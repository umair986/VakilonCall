import { Router } from 'express';
import { sendOtpSchema, verifyOtpSchema, setRoleSchema } from '@vakiloncall/shared';
import { validateBody } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { supabaseAdmin } from '../utils/supabase';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import {
  isDevAuthBypassEnabled,
  isDevAuthPhone,
  isDevAuthOtp,
  createDevAccessToken,
} from '../utils/devAuth';
import type { Request, Response } from 'express';

export const authRouter = Router();

const validateSendOtp = (req: Request, res: Response, next: () => void): void => {
  if (isDevAuthBypassEnabled() && isDevAuthPhone((req.body as { phone?: string })?.phone ?? '')) {
    next();
    return;
  }

  validateBody(sendOtpSchema)(req, res, next);
};

const validateVerifyOtp = (req: Request, res: Response, next: () => void): void => {
  const body = req.body as { phone?: string; otp?: string };
  if (isDevAuthBypassEnabled() && isDevAuthPhone(body?.phone ?? '') && typeof body?.otp === 'string') {
    next();
    return;
  }

  validateBody(verifyOtpSchema)(req, res, next);
};

// POST /api/v1/auth/send-otp
authRouter.post('/send-otp', validateSendOtp, async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body as { phone: string };

    if (isDevAuthBypassEnabled()) {
      if (!isDevAuthPhone(phone)) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Use the configured dev phone number');
        return;
      }

      sendSuccess(res, { message: 'OTP sent successfully', phone });
      return;
    }

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
authRouter.post('/verify-otp', validateVerifyOtp, async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body as { phone: string; otp: string };

    if (isDevAuthBypassEnabled()) {
      if (!isDevAuthPhone(phone) || !isDevAuthOtp(otp)) {
        sendError(res, 400, 'AUTH_INVALID_OTP', 'Invalid or expired OTP');
        return;
      }

      const token = createDevAccessToken(phone);
      sendSuccess(res, {
        access_token: token,
        refresh_token: token,
        user: null,
        is_new_user: true,
      });
      return;
    }

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
      if (!isDevAuthBypassEnabled()) {
        sendError(res, 409, 'VALIDATION_ERROR', 'User already registered');
        return;
      }

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { role },
      });

      sendSuccess(res, {
        id: updated.id,
        phone: updated.phone,
        role: updated.role,
        language_pref: updated.language_pref,
        token_balance: updated.token_balance,
      }, 200);
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
