import React, { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button, Icon, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { radius, spacing, typography } from '../utils/theme';

const palette = {
  white: '#FFFFFF',
  black: '#000000',
  ink: '#111111',
  muted: '#6B6B6B',
  line: '#E4E4E4',
  faint: '#F7F7F7',
  danger: '#B42318',
};

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const handleGoogle = useCallback((): void => {
    setMessage('Google sign-in frontend is ready. Connect OAuth next.');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Icon source="scale-balance" color={palette.black} size={34} />
        </View>
        <Text style={styles.title}>Almost there</Text>
        <Text style={styles.subtitle}>Sign up or log in to continue.</Text>
        <Text style={styles.caption}>It only takes a minute.</Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleGoogle}
            icon="google"
            textColor={palette.black}
            style={[styles.authButton, styles.googleButton]}
            contentStyle={styles.authButtonContent}
            labelStyle={styles.authButtonLabel}
          >
            Continue with Google
          </Button>

          <Button
            mode="contained"
            onPress={() => router.push('/mobile-login')}
            icon="cellphone"
            buttonColor={palette.black}
            textColor={palette.white}
            style={styles.authButton}
            contentStyle={styles.authButtonContent}
            labelStyle={styles.authButtonLabel}
          >
            Continue with Mobile
          </Button>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.terms}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.white,
  },
  hero: {
    minHeight: '44%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.white,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: palette.black,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: palette.muted,
    textAlign: 'center',
  },
  caption: {
    ...typography.caption,
    color: palette.black,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  sheet: {
    flex: 1,
    backgroundColor: palette.faint,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  actions: {
    gap: spacing.md,
  },
  authButton: {
    borderRadius: radius.sm,
    borderColor: palette.line,
  },
  googleButton: {
    backgroundColor: palette.white,
  },
  authButtonContent: {
    minHeight: 52,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  authButtonLabel: {
    ...typography.button,
    flex: 1,
    textAlign: 'left',
  },
  message: {
    ...typography.caption,
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: spacing.md,
  },
  terms: {
    ...typography.caption,
    color: palette.muted,
    textAlign: 'center',
  },
});
