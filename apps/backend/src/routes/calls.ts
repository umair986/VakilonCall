import { Router } from 'express';
import {
  callRequestSchema,
  rateCallSchema,
  reportCallSchema,
  CALL_ECONOMICS,
} from '@vakiloncall/shared';
import { validateBody } from '../middleware/validate';
import { authMiddleware, requireRegistered } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { broadcastCallRequest } from '../socket/handler';
import type { Server as SocketIOServer } from 'socket.io';
import type { Request, Response } from 'express';

export const callRouter = Router();

// POST /api/v1/calls/request — User requests legal help
callRouter.post(
  '/request',
  authMiddleware,
  requireRegistered,
  validateBody(callRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { scenario, latitude, longitude } = req.body as {
        scenario: string;
        latitude?: number;
        longitude?: number;
      };
      const userId = req.user!.id;

      // Check token balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { token_balance: true, language_pref: true },
      });

      if (!user || user.token_balance < CALL_ECONOMICS.TOKENS_PER_CALL) {
        sendError(res, 400, 'TOKEN_INSUFFICIENT', 'Not enough tokens. Please purchase more.');
        return;
      }

      // Check for any existing active call session
      const activeSession = await prisma.callSession.findFirst({
        where: {
          user_id: userId,
          status: { in: ['matching', 'lawyer_accepted', 'in_call'] },
        },
      });

      if (activeSession) {
        sendError(res, 409, 'CALL_ALREADY_MATCHED', 'You already have an active call session.');
        return;
      }

      // Create a new call session
      const session = await prisma.callSession.create({
        data: {
          user_id: userId,
          scenario,
          status: 'matching',
          user_latitude: latitude,
          user_longitude: longitude,
        },
      });

      // Broadcast to matching lawyers via WebSocket
      const io = req.app.get('io') as SocketIOServer;
      broadcastCallRequest(
        io,
        session.id,
        scenario,
        user.language_pref,
        latitude && longitude ? { latitude, longitude } : null
      ).catch((err) => {
        logger.error({ err, callSessionId: session.id }, 'Broadcast failed');
      });

      sendSuccess(res, {
        call_session_id: session.id,
        status: 'matching',
        scenario,
        message: 'Searching for available lawyers...',
      }, 201);
    } catch (err) {
      logger.error({ err }, 'call request error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create call request');
    }
  }
);

// POST /api/v1/calls/:id/cancel — User cancels before match
callRouter.post(
  '/:id/cancel',
  authMiddleware,
  requireRegistered,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await prisma.callSession.findUnique({
        where: { id: req.params.id as string },
      });

      if (!session || session.user_id !== req.user!.id) {
        sendError(res, 404, 'CALL_NOT_FOUND', 'Call session not found');
        return;
      }

      if (session.status !== 'matching') {
        sendError(res, 400, 'CALL_ALREADY_MATCHED', 'Cannot cancel — lawyer already matched');
        return;
      }

      await prisma.callSession.update({
        where: { id: req.params.id as string },
        data: { status: 'cancelled', end_reason: 'cancelled', ended_at: new Date() },
      });

      sendSuccess(res, { status: 'cancelled' });
    } catch (err) {
      logger.error({ err }, 'cancel call error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to cancel call');
    }
  }
);

// GET /api/v1/calls/:id/status — Check call status
callRouter.get(
  '/:id/status',
  authMiddleware,
  requireRegistered,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await prisma.callSession.findUnique({
        where: { id: req.params.id as string },
        include: {
          lawyer: { select: { full_name: true } },
        },
      });

      if (!session) {
        sendError(res, 404, 'CALL_NOT_FOUND', 'Call session not found');
        return;
      }

      // Only the user or assigned lawyer can check status
      if (session.user_id !== req.user!.id && session.lawyer_id !== req.user!.id) {
        sendError(res, 403, 'AUTH_UNAUTHORIZED', 'Not authorized to view this call');
        return;
      }

      sendSuccess(res, {
        id: session.id,
        status: session.status,
        scenario: session.scenario,
        lawyer_name: session.lawyer?.full_name ?? null,
        tokens_charged: session.tokens_charged,
        started_at: session.started_at?.toISOString() ?? null,
        connected_at: session.connected_at?.toISOString() ?? null,
        ended_at: session.ended_at?.toISOString() ?? null,
      });
    } catch (err) {
      logger.error({ err }, 'call status error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch call status');
    }
  }
);

// POST /api/v1/calls/:id/end — End the call
callRouter.post(
  '/:id/end',
  authMiddleware,
  requireRegistered,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await prisma.callSession.findUnique({
        where: { id: req.params.id as string },
      });

      if (!session) {
        sendError(res, 404, 'CALL_NOT_FOUND', 'Call session not found');
        return;
      }

      if (session.status !== 'in_call' && session.status !== 'lawyer_accepted') {
        sendError(res, 400, 'CALL_ALREADY_ENDED', 'Call is not active');
        return;
      }

      const endedAt = new Date();
      const connectedAt = session.connected_at ?? session.started_at ?? endedAt;
      const durationSec = Math.floor((endedAt.getTime() - connectedAt.getTime()) / 1000);

      // Determine if token should be charged or refunded
      const shouldCharge = durationSec >= CALL_ECONOMICS.CALL_MIN_DURATION_FOR_CHARGE_SEC;
      const endReason = session.user_id === req.user!.id ? 'user_ended' : 'lawyer_ended';

      if (shouldCharge && session.lawyer_id) {
        // Deduct token from user + credit lawyer wallet atomically
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: session.user_id },
            data: { token_balance: { decrement: CALL_ECONOMICS.TOKENS_PER_CALL } },
          });

          await tx.lawyerProfile.update({
            where: { user_id: session.lawyer_id! },
            data: {
              wallet_balance: { increment: CALL_ECONOMICS.LAWYER_PAYOUT_INR },
              total_earnings: { increment: CALL_ECONOMICS.LAWYER_PAYOUT_INR },
              total_calls: { increment: 1 },
            },
          });

          await tx.tokenTransaction.create({
            data: {
              user_id: session.user_id,
              type: 'deduct',
              tokens: -CALL_ECONOMICS.TOKENS_PER_CALL,
              call_session_id: session.id,
              metadata: { scenario: session.scenario, duration_sec: durationSec },
            },
          });

          await tx.callSession.update({
            where: { id: session.id },
            data: {
              status: 'completed',
              ended_at: endedAt,
              end_reason: endReason,
              recording_duration_sec: durationSec,
              tokens_charged: CALL_ECONOMICS.TOKENS_PER_CALL,
              lawyer_payout: CALL_ECONOMICS.LAWYER_PAYOUT_INR,
              platform_revenue: CALL_ECONOMICS.PLATFORM_REVENUE_INR,
            },
          });
        });
      } else {
        // Call too short — issue refund (no charge)
        await prisma.callSession.update({
          where: { id: session.id },
          data: {
            status: 'completed',
            ended_at: endedAt,
            end_reason: endReason,
            recording_duration_sec: durationSec,
            tokens_charged: 0,
          },
        });
      }

      // Notify both parties via WebSocket
      const io = req.app.get('io') as SocketIOServer;
      const payload = {
        call_session_id: session.id,
        duration: durationSec,
        summary: `Call ended after ${Math.floor(durationSec / 60)}m ${durationSec % 60}s`,
      };
      io.to(`user:${session.user_id}`).emit('call:ended', payload);
      if (session.lawyer_id) {
        io.to(`user:${session.lawyer_id}`).emit('call:ended', payload);
      }

      sendSuccess(res, {
        status: 'completed',
        duration_sec: durationSec,
        tokens_charged: shouldCharge ? CALL_ECONOMICS.TOKENS_PER_CALL : 0,
        refunded: !shouldCharge,
      });
    } catch (err) {
      logger.error({ err }, 'end call error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to end call');
    }
  }
);

// POST /api/v1/calls/:id/rate — Rate the call
callRouter.post(
  '/:id/rate',
  authMiddleware,
  requireRegistered,
  validateBody(rateCallSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { stars, comment } = req.body as { stars: number; comment?: string };

      const session = await prisma.callSession.findUnique({
        where: { id: req.params.id as string },
      });

      if (!session || session.user_id !== req.user!.id) {
        sendError(res, 404, 'CALL_NOT_FOUND', 'Call session not found');
        return;
      }

      if (!session.lawyer_id) {
        sendError(res, 400, 'CALL_NOT_FOUND', 'No lawyer was assigned to this call');
        return;
      }

      // Create rating
      await prisma.rating.create({
        data: {
          call_session_id: session.id,
          user_id: req.user!.id,
          lawyer_id: session.lawyer_id,
          stars,
          comment,
        },
      });

      // Update lawyer's average rating
      const avgResult = await prisma.rating.aggregate({
        where: { lawyer_id: session.lawyer_id },
        _avg: { stars: true },
      });

      if (avgResult._avg.stars !== null) {
        await prisma.lawyerProfile.update({
          where: { user_id: session.lawyer_id },
          data: { avg_rating: avgResult._avg.stars },
        });
      }

      sendSuccess(res, { message: 'Rating submitted', stars });
    } catch (err) {
      logger.error({ err }, 'rate call error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to submit rating');
    }
  }
);

// POST /api/v1/calls/:id/report — Report a call/lawyer
callRouter.post(
  '/:id/report',
  authMiddleware,
  requireRegistered,
  validateBody(reportCallSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { reason } = req.body as { reason: string };

      const session = await prisma.callSession.findUnique({
        where: { id: req.params.id as string },
        include: { rating: true },
      });

      if (!session || session.user_id !== req.user!.id) {
        sendError(res, 404, 'CALL_NOT_FOUND', 'Call session not found');
        return;
      }

      if (session.rating) {
        await prisma.rating.update({
          where: { call_session_id: session.id },
          data: { is_reported: true, report_reason: reason },
        });
      } else if (session.lawyer_id) {
        await prisma.rating.create({
          data: {
            call_session_id: session.id,
            user_id: req.user!.id,
            lawyer_id: session.lawyer_id,
            stars: 1,
            is_reported: true,
            report_reason: reason,
          },
        });
      }

      sendSuccess(res, { message: 'Report submitted. We will review this within 48 hours.' });
    } catch (err) {
      logger.error({ err }, 'report call error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to submit report');
    }
  }
);
