import { logger } from './logger';

/**
 * Send a push notification via Expo's push notification service.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  categoryId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notifications to one or more Expo push tokens.
 * Batches automatically for multiple tokens.
 */
export async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  // Filter out invalid tokens
  const validMessages = messages.filter((m) => isExpoPushToken(m.to));
  if (validMessages.length === 0) return [];

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(validMessages),
    });

    const result = (await response.json()) as { data: ExpoPushTicket[] };

    // Log any errors
    result.data?.forEach((ticket, i) => {
      if (ticket.status === 'error') {
        logger.warn(
          { token: validMessages[i]?.to, error: ticket.message },
          'Push notification failed'
        );
      }
    });

    return result.data ?? [];
  } catch (err) {
    logger.error({ err }, 'Failed to send push notifications');
    return [];
  }
}

/**
 * Send a push notification to a single token.
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<ExpoPushTicket | null> {
  const tickets = await sendPushNotifications([
    { to: token, title, body, data, sound: 'default', priority: 'high' },
  ]);
  return tickets[0] ?? null;
}

/**
 * Check if a string is a valid Expo push token.
 */
export function isExpoPushToken(token: string): boolean {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}
