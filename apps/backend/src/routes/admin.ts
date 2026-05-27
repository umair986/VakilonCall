import { Router } from 'express';
import { verifyLawyerSchema, paginationSchema } from '@vakiloncall/shared';
import { validateBody, validateQuery } from '../middleware/validate';
import { authMiddleware, requireRegistered } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import type { Request, Response } from 'express';

export const adminRouter = Router();

// Simple admin check — in production, use a proper RBAC system
function requireAdmin(_req: Request, _res: Response, next: () => void): void {
  // For now, any authenticated user can access admin routes in dev.
  // TODO: Add admin role check from a separate admin table or Supabase custom claims.
  next();
}

// GET /api/v1/admin/lawyers/pending — List lawyers awaiting verification
adminRouter.get(
  '/lawyers/pending',
  authMiddleware,
  requireRegistered,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const pendingLawyers = await prisma.lawyerProfile.findMany({
        where: { verification_status: 'pending' },
        include: {
          user: { select: { phone: true, full_name: true, created_at: true } },
        },
        orderBy: { created_at: 'asc' },
      });

      sendSuccess(
        res,
        pendingLawyers.map((l) => ({
          id: l.id,
          user_id: l.user_id,
          full_name: l.user.full_name,
          phone: l.user.phone,
          bar_enrollment_number: l.bar_enrollment_number,
          bar_council_state: l.bar_council_state,
          enrollment_cert_url: l.enrollment_cert_url,
          id_proof_url: l.id_proof_url,
          created_at: l.created_at.toISOString(),
        }))
      );
    } catch (err) {
      logger.error({ err }, 'list pending lawyers error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch pending lawyers');
    }
  }
);

// POST /api/v1/admin/lawyers/:id/verify — Approve or reject a lawyer
adminRouter.post(
  '/lawyers/:id/verify',
  authMiddleware,
  requireRegistered,
  requireAdmin,
  validateBody(verifyLawyerSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body as { status: 'verified' | 'rejected' };
      const lawyerId = req.params.id as string;

      const profile = await prisma.lawyerProfile.findUnique({
        where: { id: lawyerId },
      });

      if (!profile) {
        sendError(res, 404, 'USER_NOT_FOUND', 'Lawyer profile not found');
        return;
      }

      const updated = await prisma.lawyerProfile.update({
        where: { id: lawyerId },
        data: {
          verification_status: status,
          verified_at: status === 'verified' ? new Date() : null,
          verified_by: req.user!.id,
        },
      });

      sendSuccess(res, {
        id: updated.id,
        verification_status: updated.verification_status,
        verified_at: updated.verified_at?.toISOString() ?? null,
      });
    } catch (err) {
      logger.error({ err }, 'verify lawyer error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to verify lawyer');
    }
  }
);

// GET /api/v1/admin/calls/audit — Audit log of all call sessions
adminRouter.get(
  '/calls/audit',
  authMiddleware,
  requireRegistered,
  requireAdmin,
  validateQuery(paginationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const skip = (page - 1) * limit;

      const [calls, total] = await Promise.all([
        prisma.callSession.findMany({
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          include: {
            user: { select: { phone: true, full_name: true } },
            lawyer: { select: { phone: true, full_name: true } },
          },
        }),
        prisma.callSession.count(),
      ]);

      sendSuccess(
        res,
        calls.map((c) => ({
          id: c.id,
          user_phone: c.user.phone,
          user_name: c.user.full_name,
          lawyer_phone: c.lawyer?.phone ?? null,
          lawyer_name: c.lawyer?.full_name ?? null,
          scenario: c.scenario,
          status: c.status,
          tokens_charged: c.tokens_charged,
          duration_sec: c.recording_duration_sec,
          sos_fired: c.sos_fired,
          created_at: c.created_at.toISOString(),
        })),
        200,
        { page, limit, total }
      );
    } catch (err) {
      logger.error({ err }, 'calls audit error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch call audit');
    }
  }
);

// GET /api/v1/admin/dashboard/stats — Platform stats
adminRouter.get(
  '/dashboard/stats',
  authMiddleware,
  requireRegistered,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const [
        totalUsers,
        totalLawyers,
        verifiedLawyers,
        pendingLawyers,
        totalCalls,
        completedCalls,
        totalRevenue,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'user' } }),
        prisma.lawyerProfile.count(),
        prisma.lawyerProfile.count({ where: { verification_status: 'verified' } }),
        prisma.lawyerProfile.count({ where: { verification_status: 'pending' } }),
        prisma.callSession.count(),
        prisma.callSession.count({ where: { status: 'completed' } }),
        prisma.callSession.aggregate({
          _sum: { platform_revenue: true },
        }),
      ]);

      sendSuccess(res, {
        users: { total: totalUsers },
        lawyers: {
          total: totalLawyers,
          verified: verifiedLawyers,
          pending: pendingLawyers,
        },
        calls: {
          total: totalCalls,
          completed: completedCalls,
        },
        revenue: {
          total_inr: Number(totalRevenue._sum.platform_revenue ?? 0),
        },
      });
    } catch (err) {
      logger.error({ err }, 'dashboard stats error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch dashboard stats');
    }
  }
);
