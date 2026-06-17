import { Router } from 'express';
import { sendOtpSchema, verifyOtpSchema, setRoleSchema, googleLoginSchema } from '@vakiloncall/shared';
import { validateBody } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

export const authRouter = Router();

// =============================================
// Google OAuth client for ID token verification
// =============================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// =============================================
// In-memory OTP store for development
// In production, use Redis or a proper OTP service
// =============================================
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const DEV_OTP = process.env.DEV_AUTH_OTP ?? '123456';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp(): string {
  // In dev mode, always use the dev OTP for simplicity
  if (process.env.NODE_ENV !== 'production') {
    return DEV_OTP;
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/v1/auth/send-otp
authRouter.post('/send-otp', validateBody(sendOtpSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body as { phone: string };

    const otp = generateOtp();
    otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

    logger.info({ phone, otp: process.env.NODE_ENV !== 'production' ? otp : '[hidden]' }, 'OTP generated');

    // In production, send OTP via SMS provider (Exotel, Twilio, etc.)
    // For now, the OTP is stored in-memory and logged in dev mode.

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

    // Verify the OTP
    const stored = otpStore.get(phone);
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
      sendError(res, 400, 'AUTH_INVALID_OTP', 'Invalid or expired OTP');
      return;
    }

    // OTP is valid — clear it
    otpStore.delete(phone);

    // Check if user exists in our DB
    const existingUser = await prisma.user.findUnique({
      where: { phone },
      include: { lawyer_profile: true },
    });

    // Generate JWT tokens
    const userId = existingUser?.id ?? '';
    const accessToken = signAccessToken(userId, phone);
    const refreshToken = signRefreshToken(userId, phone);

    sendSuccess(res, {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: existingUser
        ? {
            id: existingUser.id,
            phone: existingUser.phone,
            email: existingUser.email,
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

// POST /api/v1/auth/google
authRouter.post('/google', validateBody(googleLoginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_token } = req.body as { id_token: string };

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      logger.error({ err: verifyErr }, 'Google token verification failed');
      sendError(res, 401, 'AUTH_GOOGLE_FAILED', 'Invalid Google token');
      return;
    }

    if (!payload || !payload.sub) {
      sendError(res, 401, 'AUTH_GOOGLE_FAILED', 'Invalid Google token payload');
      return;
    }

    const googleId = payload.sub;
    const email = payload.email ?? null;
    const fullName = payload.name ?? null;

    logger.info({ googleId, email }, 'Google sign-in attempt');

    // Check if user already exists by google_id
    let existingUser = await prisma.user.findUnique({
      where: { google_id: googleId },
      include: { lawyer_profile: true },
    });

    // If not found by google_id, try by email (user might have been created via another method)
    if (!existingUser && email) {
      existingUser = await prisma.user.findUnique({
        where: { email },
        include: { lawyer_profile: true },
      });

      // Link the google_id to the existing email-based user
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { google_id: googleId },
        });
      }
    }

    const isNewUser = !existingUser;

    if (isNewUser) {
      // Create a new user with Google info — role will be set later via set-role
      const newUser = await prisma.user.create({
        data: {
          email,
          google_id: googleId,
          full_name: fullName,
          role: 'user', // default, will be updated via set-role
          language_pref: 'en',
          token_balance: 0,
        },
      });

      const accessToken = signAccessToken(newUser.id, undefined, email ?? undefined);
      const refreshToken = signRefreshToken(newUser.id, undefined, email ?? undefined);

      sendSuccess(res, {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: newUser.id,
          phone: newUser.phone,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          language_pref: newUser.language_pref,
          token_balance: newUser.token_balance,
          has_lawyer_profile: false,
          verification_status: null,
        },
        is_new_user: true,
      }, 201);
      return;
    }

    // Existing user — update full_name if it was previously null
    if (!existingUser) {
      // Should not reach here — handled by isNewUser block above
      sendError(res, 500, 'INTERNAL_ERROR', 'Unexpected state');
      return;
    }

    if (!existingUser.full_name && fullName) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { full_name: fullName },
      });
    }

    const accessToken = signAccessToken(
      existingUser.id,
      existingUser.phone ?? undefined,
      existingUser.email ?? undefined
    );
    const refreshToken = signRefreshToken(
      existingUser.id,
      existingUser.phone ?? undefined,
      existingUser.email ?? undefined
    );

    sendSuccess(res, {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: existingUser.id,
        phone: existingUser.phone,
        email: existingUser.email,
        full_name: existingUser.full_name ?? fullName,
        role: existingUser.role,
        language_pref: existingUser.language_pref,
        token_balance: existingUser.token_balance,
        has_lawyer_profile: !!existingUser.lawyer_profile,
        verification_status: existingUser.lawyer_profile?.verification_status ?? null,
      },
      is_new_user: false,
    });
  } catch (err) {
    logger.error({ err }, 'google auth error');
    sendError(res, 500, 'INTERNAL_ERROR', 'Google authentication failed');
  }
});

// POST /api/v1/auth/set-role (requires auth)
authRouter.post('/set-role', authMiddleware, validateBody(setRoleSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body as { role: 'user' | 'lawyer' };
    const userId = req.user?.id;
    const phone = req.user?.phone;
    const email = req.user?.email;

    if (!userId && !phone && !email) {
      sendError(res, 400, 'AUTH_PHONE_REQUIRED', 'User identity not found');
      return;
    }

    // Check if user already exists
    let existing;
    if (userId) {
      existing = await prisma.user.findUnique({ where: { id: userId } });
    } else if (phone) {
      existing = await prisma.user.findUnique({ where: { phone } });
    } else if (email) {
      existing = await prisma.user.findUnique({ where: { email } });
    }

    if (existing) {
      // In dev, allow role update
      if (process.env.NODE_ENV !== 'production') {
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: { role },
        });

        const accessToken = signAccessToken(updated.id, updated.phone ?? undefined, updated.email ?? undefined);
        const refreshToken = signRefreshToken(updated.id, updated.phone ?? undefined, updated.email ?? undefined);

        sendSuccess(res, {
          id: updated.id,
          phone: updated.phone,
          email: updated.email,
          role: updated.role,
          language_pref: updated.language_pref,
          token_balance: updated.token_balance,
          access_token: accessToken,
          refresh_token: refreshToken,
        }, 200);
        return;
      }

      sendError(res, 409, 'VALIDATION_ERROR', 'User already registered');
      return;
    }

    // Create the user in our database (only for phone-based flow; Google users are already created)
    if (!phone) {
      sendError(res, 400, 'AUTH_PHONE_REQUIRED', 'Phone number required for new user creation');
      return;
    }

    const user = await prisma.user.create({
      data: {
        phone,
        role,
        language_pref: 'en',
        token_balance: 0,
      },
    });

    // Issue new tokens with the real user ID
    const accessToken = signAccessToken(user.id, user.phone ?? undefined);
    const refreshToken = signRefreshToken(user.id, user.phone ?? undefined);

    sendSuccess(res, {
      id: user.id,
      phone: user.phone,
      role: user.role,
      language_pref: user.language_pref,
      token_balance: user.token_balance,
      access_token: accessToken,
      refresh_token: refreshToken,
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
      email: user.email,
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

// POST /api/v1/auth/push-token — Register Expo push notification token
authRouter.post(
  '/push-token',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { push_token } = req.body as { push_token: string };

      if (
        !push_token ||
        (!push_token.startsWith('ExponentPushToken[') && !push_token.startsWith('ExpoPushToken['))
      ) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid Expo push token');
        return;
      }

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { push_token },
      });

      sendSuccess(res, { registered: true });
    } catch (err) {
      logger.error({ err }, 'push-token registration error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to register push token');
    }
  }
);
