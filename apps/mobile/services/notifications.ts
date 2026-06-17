import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_PATHS } from '@vakiloncall/shared';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from './api';

/**
 * Check if we're running inside Expo Go (where remote push is unsupported since SDK 53).
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// Configure notification behavior — show alerts even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permissions and register the token with the backend.
 * Call this after the user is authenticated.
 *
 * NOTE: Remote push notifications are NOT supported in Expo Go (SDK 53+).
 * This function gracefully skips registration in Expo Go and logs a warning.
 * To test real push notifications, create a development build:
 *   npx expo run:android   or   npx eas build --profile development
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Expo Go doesn't support remote push since SDK 53 — skip gracefully
  if (isExpoGo()) {
    console.log(
      '[Push] Skipping push registration — Expo Go does not support remote notifications (SDK 53+). ' +
      'Use a development build to test push notifications.'
    );
    return null;
  }

  try {
    // Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted');
      return null;
    }

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4ade80',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('calls', {
        name: 'Incoming Calls',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#ef4444',
        sound: 'default',
      });
    }

    // Get Expo push token
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Uses app.json's projectId automatically
    });
    const pushToken = tokenResult.data;

    console.log('[Push] Expo push token:', pushToken);

    // Register with our backend
    const token = useAuthStore.getState().accessToken;
    if (token) {
      try {
        const response = await fetch(`${getApiBaseUrl()}${API_PATHS.AUTH.PUSH_TOKEN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ push_token: pushToken }),
        });
        const data = await response.json();
        if (data.success) {
          console.log('[Push] Token registered with backend');
        }
      } catch (err) {
        console.error('[Push] Failed to register token with backend:', err);
      }
    }

    return pushToken;
  } catch (err) {
    console.error('[Push] Registration failed:', err);
    return null;
  }
}

/**
 * Add a listener for incoming notifications (foreground).
 * Returns a cleanup function.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Add a listener for when a user taps on a notification.
 * Returns a cleanup function.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}
