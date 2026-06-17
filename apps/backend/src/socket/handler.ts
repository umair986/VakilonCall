import type { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { WS_EVENTS, CALL_ECONOMICS, SCENARIOS } from '@vakiloncall/shared';
import { verifyAccessToken } from '../utils/jwt';
import { sendPushNotifications } from '../utils/push';

// Track online lawyers: Map<lawyerUserId, socketId>
const onlineLawyers = new Map<string, string>();

// Track active matching requests: Map<callSessionId, timeoutId>
const matchingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Authenticate a socket connection using a local JWT from auth.token.
 * Returns the user record or null if authentication fails.
 */
async function authenticateSocket(
  socket: Socket
): Promise<{ id: string; phone: string | null; role: string } | null> {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return null;

    const payload = verifyAccessToken(token);
    if (!payload) return null;

    // Prefer userId lookup; fall back to phone then email
    let dbUser = null;
    if (payload.userId) {
      dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, phone: true, role: true, is_active: true, is_banned: true },
      });
    }
    if (!dbUser && payload.phone) {
      dbUser = await prisma.user.findUnique({
        where: { phone: payload.phone },
        select: { id: true, phone: true, role: true, is_active: true, is_banned: true },
      });
    }
    if (!dbUser && payload.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, phone: true, role: true, is_active: true, is_banned: true },
      });
    }

    if (!dbUser || !dbUser.is_active || dbUser.is_banned) return null;

    return { id: dbUser.id, phone: dbUser.phone, role: dbUser.role };
  } catch (err) {
    logger.error({ err }, 'Socket authentication failed');
    return null;
  }
}

/**
 * Initialize all WebSocket event handlers.
 */
export function initSocketHandlers(io: SocketIOServer): void {
  io.on('connection', async (socket: Socket) => {
    const user = await authenticateSocket(socket);

    if (!user) {
      logger.warn({ socketId: socket.id }, 'Unauthenticated socket connection rejected');
      socket.disconnect(true);
      return;
    }

    logger.info({ socketId: socket.id, userId: user.id, role: user.role }, 'Socket connected');

    // Join a room based on user ID for targeted messages
    socket.join(`user:${user.id}`);

    // ===================================================
    // LAWYER EVENTS
    // ===================================================

    socket.on(WS_EVENTS.LAWYER_GO_ONLINE, async () => {
      if (user.role !== 'lawyer') return;

      try {
        const profile = await prisma.lawyerProfile.findUnique({
          where: { user_id: user.id },
          select: { verification_status: true },
        });

        if (profile?.verification_status !== 'verified') {
          socket.emit('error', { message: 'Profile must be verified to go online' });
          return;
        }

        await prisma.lawyerProfile.update({
          where: { user_id: user.id },
          data: { is_online: true },
        });

        onlineLawyers.set(user.id, socket.id);
        socket.join('lawyers:online');
        logger.info({ userId: user.id }, 'Lawyer went online');
      } catch (err) {
        logger.error({ err, userId: user.id }, 'Failed to go online');
      }
    });

    socket.on(WS_EVENTS.LAWYER_GO_OFFLINE, async () => {
      if (user.role !== 'lawyer') return;

      try {
        await prisma.lawyerProfile.update({
          where: { user_id: user.id },
          data: { is_online: false },
        });

        onlineLawyers.delete(user.id);
        socket.leave('lawyers:online');
        logger.info({ userId: user.id }, 'Lawyer went offline');
      } catch (err) {
        logger.error({ err, userId: user.id }, 'Failed to go offline');
      }
    });

    socket.on(WS_EVENTS.LAWYER_ACCEPT_REQUEST, async (data: { call_session_id: string }) => {
      if (user.role !== 'lawyer') return;

      try {
        const session = await prisma.callSession.findUnique({
          where: { id: data.call_session_id },
        });

        if (!session || session.status !== 'matching') {
          socket.emit('error', { message: 'Call request no longer available' });
          return;
        }

        // Claim the session: set lawyer_id and update status atomically
        const updatedSession = await prisma.callSession.update({
          where: {
            id: data.call_session_id,
            status: 'matching', // optimistic lock
          },
          data: {
            lawyer_id: user.id,
            status: 'lawyer_accepted',
            started_at: new Date(),
          },
        });

        // Cancel the matching timeout
        const timeout = matchingTimeouts.get(data.call_session_id);
        if (timeout) {
          clearTimeout(timeout);
          matchingTimeouts.delete(data.call_session_id);
        }

        // Get lawyer info for the user notification
        const lawyerProfile = await prisma.lawyerProfile.findUnique({
          where: { user_id: user.id },
          select: { avg_rating: true },
        });

        const lawyerUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { full_name: true },
        });

        // Notify the user that a lawyer was matched
        io.to(`user:${updatedSession.user_id}`).emit(WS_EVENTS.CALL_MATCHED, {
          call_session_id: updatedSession.id,
          lawyer_name: lawyerUser?.full_name ?? 'Verified Lawyer',
          lawyer_rating: Number(lawyerProfile?.avg_rating ?? 0),
        });

        // Notify other lawyers that this request is taken
        socket.to('lawyers:online').emit(WS_EVENTS.CALL_CANCELLED, {
          call_session_id: data.call_session_id,
        });

        logger.info(
          { callSessionId: data.call_session_id, lawyerId: user.id },
          'Lawyer accepted call request'
        );
      } catch (err) {
        logger.error({ err }, 'Failed to accept call request');
        socket.emit('error', { message: 'Failed to accept request' });
      }
    });

    socket.on(WS_EVENTS.LAWYER_REJECT_REQUEST, (data: { call_session_id: string }) => {
      // The lawyer simply declines — no DB update needed. The matching
      // timeout will handle the "no lawyers available" case if no one accepts.
      logger.info(
        { callSessionId: data.call_session_id, lawyerId: user.id },
        'Lawyer rejected call request'
      );
    });

    // ===================================================
    // DISCONNECT
    // ===================================================

    socket.on('disconnect', async () => {
      if (user.role === 'lawyer' && onlineLawyers.has(user.id)) {
        onlineLawyers.delete(user.id);
        try {
          await prisma.lawyerProfile.update({
            where: { user_id: user.id },
            data: { is_online: false },
          });
        } catch {
          // Swallow — user may already be offline
        }
      }
      logger.info({ socketId: socket.id, userId: user.id }, 'Socket disconnected');
    });
  });
}

// ===================================================
// MATCHING ENGINE
// ===================================================

/**
 * Find available lawyers matching the call criteria and broadcast the request.
 * Called from the /calls/request REST endpoint.
 */
export async function broadcastCallRequest(
  io: SocketIOServer,
  callSessionId: string,
  scenario: string,
  language: string,
  userLocation: { latitude: number; longitude: number } | null
): Promise<void> {
  try {
    // Find online, verified lawyers matching language and scenario
    const matchingLawyers = await prisma.lawyerProfile.findMany({
      where: {
        is_online: true,
        verification_status: 'verified',
        languages: { has: language },
        scenario_tags: { has: scenario },
        avg_rating: { gte: CALL_ECONOMICS.LAWYER_MIN_RATING },
      },
      orderBy: { avg_rating: 'desc' },
      take: CALL_ECONOMICS.MAX_LAWYERS_BROADCAST,
      select: { user_id: true },
    });

    if (matchingLawyers.length === 0) {
      // Try a broader match: any online verified lawyer
      const anyLawyers = await prisma.lawyerProfile.findMany({
        where: {
          is_online: true,
          verification_status: 'verified',
        },
        orderBy: { avg_rating: 'desc' },
        take: CALL_ECONOMICS.MAX_LAWYERS_BROADCAST,
        select: { user_id: true },
      });

      if (anyLawyers.length === 0) {
        // No lawyers available at all
        await prisma.callSession.update({
          where: { id: callSessionId },
          data: { status: 'no_lawyers' },
        });

        // Notify the user
        const session = await prisma.callSession.findUnique({
          where: { id: callSessionId },
          select: { user_id: true },
        });
        if (session) {
          io.to(`user:${session.user_id}`).emit(WS_EVENTS.CALL_NO_LAWYERS, {
            call_session_id: callSessionId,
          });
        }
        return;
      }

      // Broadcast to fallback lawyers
      for (const lawyer of anyLawyers) {
        io.to(`user:${lawyer.user_id}`).emit(WS_EVENTS.CALL_INCOMING, {
          call_session_id: callSessionId,
          scenario,
          language,
          user_location: userLocation,
        });
      }

      // Send push notifications to fallback lawyers
      await sendPushToLawyers(anyLawyers.map((l) => l.user_id), scenario);
    } else {
      // Broadcast to matched lawyers
      for (const lawyer of matchingLawyers) {
        io.to(`user:${lawyer.user_id}`).emit(WS_EVENTS.CALL_INCOMING, {
          call_session_id: callSessionId,
          scenario,
          language,
          user_location: userLocation,
        });
      }

      // Send push notifications to matched lawyers
      await sendPushToLawyers(matchingLawyers.map((l) => l.user_id), scenario);
    }

    // Set a timeout: if no lawyer accepts within MATCH_TIMEOUT_SEC, mark as no_lawyers
    const timeout = setTimeout(async () => {
      matchingTimeouts.delete(callSessionId);
      try {
        const session = await prisma.callSession.findUnique({
          where: { id: callSessionId },
          select: { status: true, user_id: true },
        });

        if (session?.status === 'matching') {
          await prisma.callSession.update({
            where: { id: callSessionId },
            data: { status: 'no_lawyers' },
          });

          io.to(`user:${session.user_id}`).emit(WS_EVENTS.CALL_NO_LAWYERS, {
            call_session_id: callSessionId,
          });

          logger.info({ callSessionId }, 'Matching timed out — no lawyers accepted');
        }
      } catch (err) {
        logger.error({ err, callSessionId }, 'Matching timeout handler error');
      }
    }, CALL_ECONOMICS.MATCH_TIMEOUT_SEC * 1000);

    matchingTimeouts.set(callSessionId, timeout);

    logger.info(
      { callSessionId, matchedLawyers: matchingLawyers.length, scenario },
      'Call request broadcasted to lawyers'
    );
  } catch (err) {
    logger.error({ err, callSessionId }, 'broadcastCallRequest error');
  }
}

/**
 * Returns the count of currently online lawyers.
 */
export function getOnlineLawyerCount(): number {
  return onlineLawyers.size;
}

/**
 * Send push notifications to a list of lawyer user IDs.
 * Fetches their push tokens from the DB and sends via Expo.
 */
async function sendPushToLawyers(lawyerUserIds: string[], scenario: string): Promise<void> {
  try {
    if (lawyerUserIds.length === 0) return;

    const users = await prisma.user.findMany({
      where: {
        id: { in: lawyerUserIds },
        push_token: { not: null },
      },
      select: { push_token: true },
    });

    const tokens = users
      .map((u) => u.push_token)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) return;

    const scenarioLabel = SCENARIOS.find((s) => s.type === scenario)?.label ?? 'Legal Help';

    await sendPushNotifications(
      tokens.map((token) => ({
        to: token,
        title: '📞 New Call Request',
        body: `A user needs help with: ${scenarioLabel}`,
        data: { type: 'incoming_call', scenario },
        sound: 'default' as const,
        priority: 'high' as const,
      }))
    );

    logger.info(
      { count: tokens.length, scenario },
      'Push notifications sent to lawyers'
    );
  } catch (err) {
    logger.error({ err }, 'sendPushToLawyers error');
  }
}
