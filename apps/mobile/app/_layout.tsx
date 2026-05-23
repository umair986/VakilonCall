import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { darkTheme } from '../utils/theme';

export default function RootLayout(): React.JSX.Element {
  return (
    <PaperProvider theme={darkTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: darkTheme.colors.background },
          animation: 'slide_from_right',
        }}
      />
    </PaperProvider>
  );
}
