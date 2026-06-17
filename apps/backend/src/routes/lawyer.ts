import { Router } from 'express';
import {
  lawyerRegisterSchema,
  updateLawyerProfileSchema,
  toggleOnlineSchema,
} from '@vakiloncall/shared';
import { validateBody } from '../middleware/validate';
import { authMiddleware, requireLawyer, requireRegistered } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import multer from 'multer';
import { uploadFile, getPublicUrl } from '../utils/storage';
import type { Request, Response } from 'express';

export const lawyerRouter = Router();

// Multer for file uploads (enrollment cert + ID proof)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and PDF files are allowed'));
    }
  },
});

// Helper: upload file to local storage and return public URL
async function uploadToLocalStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const storedPath = await uploadFile(buffer, fileName, mimeType);
  return getPublicUrl(storedPath);
}

// POST /api/v1/lawyer/register
lawyerRouter.post(
  '/register',
  authMiddleware,
  requireRegistered,
  upload.fields([
    { name: 'enrollment_cert', maxCount: 1 },
    { name: 'id_proof', maxCount: 1 },
  ]),
  validateBody(lawyerRegisterSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { bar_enrollment_number, bar_council_state } = req.body as {
        bar_enrollment_number: string;
        bar_council_state: string;
      };

      // Verify user has lawyer role
      if (req.user!.role !== 'lawyer') {
        sendError(res, 403, 'AUTH_UNAUTHORIZED', 'Only lawyer accounts can register as lawyers');
        return;
      }

      // Check if lawyer profile already exists
      const existing = await prisma.lawyerProfile.findUnique({
        where: { user_id: userId },
      });
      if (existing) {
        sendError(res, 409, 'VALIDATION_ERROR', 'Lawyer profile already exists');
        return;
      }

      // Check if Bar enrollment number is already registered
      const existingBar = await prisma.lawyerProfile.findUnique({
        where: { bar_enrollment_number },
      });
      if (existingBar) {
        sendError(res, 409, 'VALIDATION_ERROR', 'Bar enrollment number already registered');
        return;
      }

      // Upload enrollment certificate
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files['enrollment_cert']?.[0]) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Enrollment certificate is required');
        return;
      }

      const certFile = files['enrollment_cert'][0];
      const certFileName = `lawyers/${userId}/enrollment_cert_${Date.now()}.${certFile.originalname.split('.').pop()}`;
      const certUrl = await uploadToLocalStorage(certFile.buffer, certFileName, certFile.mimetype);

      let idProofUrl: string | null = null;
      if (files['id_proof']?.[0]) {
        const idFile = files['id_proof'][0];
        const idFileName = `lawyers/${userId}/id_proof_${Date.now()}.${idFile.originalname.split('.').pop()}`;
        idProofUrl = await uploadToLocalStorage(idFile.buffer, idFileName, idFile.mimetype);
      }

      // Create lawyer profile
      const profile = await prisma.lawyerProfile.create({
        data: {
          user_id: userId,
          bar_enrollment_number,
          bar_council_state,
          enrollment_cert_url: certUrl,
          id_proof_url: idProofUrl,
          verification_status: 'pending',
          languages: ['en'],
          scenario_tags: [],
        },
      });

      sendSuccess(res, {
        id: profile.id,
        bar_enrollment_number: profile.bar_enrollment_number,
        bar_council_state: profile.bar_council_state,
        verification_status: profile.verification_status,
        message: 'Registration submitted. Verification typically takes 24-48 hours.',
      }, 201);
    } catch (err) {
      logger.error({ err }, 'lawyer register error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to register lawyer profile');
    }
  }
);

// GET /api/v1/lawyer/profile
lawyerRouter.get(
  '/profile',
  authMiddleware,
  requireRegistered,
  requireLawyer,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await prisma.lawyerProfile.findUnique({
        where: { user_id: req.user!.id },
      });

      if (!profile) {
        sendError(res, 404, 'USER_NOT_FOUND', 'Lawyer profile not found. Please register first.');
        return;
      }

      sendSuccess(res, {
        id: profile.id,
        bar_enrollment_number: profile.bar_enrollment_number,
        bar_council_state: profile.bar_council_state,
        verification_status: profile.verification_status,
        is_online: profile.is_online,
        languages: profile.languages,
        scenario_tags: profile.scenario_tags,
        avg_rating: Number(profile.avg_rating),
        total_calls: profile.total_calls,
        total_earnings: Number(profile.total_earnings),
        wallet_balance: Number(profile.wallet_balance),
        created_at: profile.created_at.toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'lawyer profile error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch lawyer profile');
    }
  }
);

// PATCH /api/v1/lawyer/profile
lawyerRouter.patch(
  '/profile',
  authMiddleware,
  requireRegistered,
  requireLawyer,
  validateBody(updateLawyerProfileSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { languages, scenario_tags } = req.body as {
        languages?: string[];
        scenario_tags?: string[];
      };

      const profile = await prisma.lawyerProfile.update({
        where: { user_id: req.user!.id },
        data: {
          ...(languages ? { languages } : {}),
          ...(scenario_tags ? { scenario_tags } : {}),
        },
      });

      sendSuccess(res, {
        languages: profile.languages,
        scenario_tags: profile.scenario_tags,
      });
    } catch (err) {
      logger.error({ err }, 'lawyer profile update error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update lawyer profile');
    }
  }
);

// POST /api/v1/lawyer/toggle-online
lawyerRouter.post(
  '/toggle-online',
  authMiddleware,
  requireRegistered,
  requireLawyer,
  validateBody(toggleOnlineSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { is_online } = req.body as { is_online: boolean };

      // Check verification status
      const profile = await prisma.lawyerProfile.findUnique({
        where: { user_id: req.user!.id },
      });

      if (!profile) {
        sendError(res, 404, 'USER_NOT_FOUND', 'Lawyer profile not found');
        return;
      }

      if (profile.verification_status !== 'verified') {
        sendError(res, 403, 'LAWYER_NOT_VERIFIED', 'Your profile must be verified before going online');
        return;
      }

      const updated = await prisma.lawyerProfile.update({
        where: { user_id: req.user!.id },
        data: { is_online },
      });

      sendSuccess(res, { is_online: updated.is_online });
    } catch (err) {
      logger.error({ err }, 'toggle-online error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update online status');
    }
  }
);

// GET /api/v1/lawyer/earnings — Lawyer earnings + recent calls
lawyerRouter.get(
  '/earnings',
  authMiddleware,
  requireRegistered,
  requireLawyer,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      // Fetch lawyer profile for summary stats
      const profile = await prisma.lawyerProfile.findUnique({
        where: { user_id: userId },
        select: {
          total_earnings: true,
          wallet_balance: true,
          total_calls: true,
          avg_rating: true,
        },
      });

      if (!profile) {
        sendError(res, 404, 'USER_NOT_FOUND', 'Lawyer profile not found');
        return;
      }

      // Fetch pending payout total
      const pendingPayouts = await prisma.lawyerPayout.aggregate({
        where: { lawyer_id: userId, status: { in: ['pending', 'processing'] } },
        _sum: { amount: true },
      });

      // Fetch recent completed calls for this lawyer
      const recentCalls = await prisma.callSession.findMany({
        where: { lawyer_id: userId, status: 'completed' },
        orderBy: { ended_at: 'desc' },
        take: 20,
        include: {
          rating: { select: { stars: true } },
        },
      });

      sendSuccess(res, {
        total_earnings: Number(profile.total_earnings),
        wallet_balance: Number(profile.wallet_balance),
        pending_payout: Number(pendingPayouts._sum.amount ?? 0),
        total_calls: profile.total_calls,
        avg_rating: Number(profile.avg_rating),
        recent_calls: recentCalls.map((c) => ({
          id: c.id,
          scenario: c.scenario,
          duration_min: c.recording_duration_sec
            ? Math.round(c.recording_duration_sec / 60)
            : 0,
          earned: Number(c.lawyer_payout),
          date: (c.ended_at ?? c.created_at).toISOString(),
          rating: c.rating?.stars ?? null,
        })),
      });
    } catch (err) {
      logger.error({ err }, 'lawyer earnings error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch earnings');
    }
  }
);
