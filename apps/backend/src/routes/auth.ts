import { Router } from 'express';
import { sendOtpSchema, verifyOtpSchema, setRoleSchema } from '@vakiloncall/shared';
import { validateBody } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { supabaseAdmin } from '../utils/supabase';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import type { Request, Response } from 'express';

export const authRouter = Router();

// POST /api/v1/auth/send-otp
authRouter.post('/send-otp', validateBody(sendOtpSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body as { phone: string };

    const { error } = await supabaseAdmin.auth.signInWithOtp({ phone });

    if (error) {
      logger.error({ error, phone }, 'Failed to send OTP');
      sendError(res, 400, 'AUTH_PHONE_REQUIRED', 'Failed to send OTP. Please try again.');
      return;
    }

    sendSuccess(res, { message: 'OTP sent successfully', phone });
  } catch (err) {
    logger.error({ err }, 'send-otp error');
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to send OTP');
  }
});

// POST /api/v1/auth/verify-otp
authRouter.post('/verify-otp', validateBody(verifyOtpSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body as { phone: string; otp: string };

    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error || !data.session) {
      logger.warn({ error, phone }, 'OTP verification failed');
      sendError(res, 400, 'AUTH_INVALID_OTP', 'Invalid or expired OTP');
      return;
    }

    // Check if user exists in our DB
    const existingUser = await prisma.user.findUnique({
      where: { phone },
      include: { lawyer_profile: true },
    });

    sendSuccess(res, {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: existingUser
        ? {
            id: existingUser.id,
            phone: existingUser.phone,
            full_name: existingUser.full_name,
            role: existingUser.role,
            language_pref: existingUser.language_pref,
            token_balance: existingUser.token_balance,
            has_lawyer_profile: !!existingUser.lawyer_profile,
            verification_status: existingUser.lawyer_profile?.verification_status ?? null,
          }
        : null,
      is_new_user: !existingUser,
    });
  } catch (err) {
    logger.error({ err }, 'verify-otp error');
    sendError(res, 500, 'INTERNAL_ERROR', 'OTP verification failed');
  }
});

// POST /api/v1/auth/set-role (requires auth)
authRouter.post('/set-role', authMiddleware, validateBody(setRoleSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body as { role: 'user' | 'lawyer' };
    const phone = req.user?.phone;

    if (!phone) {
      sendError(res, 400, 'AUTH_PHONE_REQUIRED', 'Phone number not found');
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      sendError(res, 409, 'VALIDATION_ERROR', 'User already registered');
      return;
    }

    // Create the user in our database
    const user = await prisma.user.create({
      data: {
        phone,
        role,
        language_pref: 'en',
        token_balance: 0,
      },
    });

    sendSuccess(res, {
      id: user.id,
      phone: user.phone,
      role: user.role,
      language_pref: user.language_pref,
      token_balance: user.token_balance,
    }, 201);
  } catch (err) {
    logger.error({ err }, 'set-role error');
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to set role');
  }
});

// GET /api/v1/auth/me (requires auth + registered)
authRouter.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      sendError(res, 404, 'USER_NOT_FOUND', 'User not found. Please complete registration.');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { lawyer_profile: true },
    });

    if (!user) {
      sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
      return;
    }

    sendSuccess(res, {
      id: user.id,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      language_pref: user.language_pref,
      token_balance: user.token_balance,
      is_active: user.is_active,
      lawyer_profile: user.lawyer_profile
        ? {
            verification_status: user.lawyer_profile.verification_status,
            is_online: user.lawyer_profile.is_online,
            avg_rating: Number(user.lawyer_profile.avg_rating),
            total_calls: user.lawyer_profile.total_calls,
            total_earnings: Number(user.lawyer_profile.total_earnings),
            wallet_balance: Number(user.lawyer_profile.wallet_balance),
            languages: user.lawyer_profile.languages,
            scenario_tags: user.lawyer_profile.scenario_tags,
          }
        : null,
      created_at: user.created_at.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'auth/me error');
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch profile');
  }
});
