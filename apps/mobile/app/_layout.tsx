import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { darkTheme } from '../utils/theme';

export default function RootLayout(): React.JSX.Element {
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
