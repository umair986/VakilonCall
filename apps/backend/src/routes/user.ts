import { Router } from 'express';
import { updateProfileSchema, paginationSchema } from '@vakiloncall/shared';
import { validateBody, validateQuery } from '../middleware/validate';
import { authMiddleware, requireRegistered } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import type { Request, Response } from 'express';

export const userRouter = Router();

// GET /api/v1/user/profile
userRouter.get(
  '/profile',
  authMiddleware,
  requireRegistered,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
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
        created_at: user.created_at.toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'user profile error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch profile');
    }
  }
);

// PATCH /api/v1/user/profile
userRouter.patch(
  '/profile',
  authMiddleware,
  requireRegistered,
  validateBody(updateProfileSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { full_name, language_pref } = req.body as {
        full_name?: string;
        language_pref?: string;
      };

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(full_name !== undefined ? { full_name } : {}),
          ...(language_pref !== undefined ? { language_pref } : {}),
        },
      });

      sendSuccess(res, {
        id: user.id,
        full_name: user.full_name,
        language_pref: user.language_pref,
      });
    } catch (err) {
      logger.error({ err }, 'user profile update error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update profile');
    }
  }
);

// GET /api/v1/user/token-balance
userRouter.get(
  '/token-balance',
  authMiddleware,
  requireRegistered,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { token_balance: true },
      });

      if (!user) {
        sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
        return;
      }

      sendSuccess(res, { token_balance: user.token_balance });
    } catch (err) {
      logger.error({ err }, 'token balance error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch token balance');
    }
  }
);

// GET /api/v1/user/call-history
userRouter.get(
  '/call-history',
  authMiddleware,
  requireRegistered,
  validateQuery(paginationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const skip = (page - 1) * limit;

      const [calls, total] = await Promise.all([
        prisma.callSession.findMany({
          where: { user_id: req.user!.id },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          include: {
            rating: { select: { stars: true } },
          },
        }),
        prisma.callSession.count({ where: { user_id: req.user!.id } }),
      ]);

      sendSuccess(
        res,
        calls.map((c: typeof calls[number]) => ({
          id: c.id,
          scenario: c.scenario,
          status: c.status,
          tokens_charged: c.tokens_charged,
          duration_sec: c.recording_duration_sec,
          rating: c.rating?.stars ?? null,
          created_at: c.created_at.toISOString(),
        })),
        200,
        { page, limit, total }
      );
    } catch (err) {
      logger.error({ err }, 'call history error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch call history');
    }
  }
);
