import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { darkTheme } from '../utils/theme';
import { useAuthStore } from '../stores/authStore';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '../services/notifications';

export default function RootLayout(): React.JSX.Element {
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();

  // Register for push notifications when authenticated
  useEffect(() => {
    if (!accessToken) return;

    registerForPushNotifications().catch((err) => {
      console.warn('[Push] Registration failed:', err);
    });

    // Handle notification taps — navigate to lawyer-home for incoming calls
    const cleanup = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (data?.type === 'incoming_call') {
        router.push('/lawyer-home');
      }
    });

    return cleanup;
  }, [accessToken, router]);

  return (
    <PaperProvider theme={darkTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
          animation: 'slide_from_right',
        }}
      />
    </PaperProvider>
  );
}
