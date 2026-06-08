import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { radius, spacing, typography } from '../utils/theme';

const palette = {
  paper: '#FFFFFF',
  ink: '#000000',
  muted: '#626262',
  faint: '#F7F7F7',
  line: '#E4E4E4',
  white: '#FFFFFF',
  danger: '#B42318',
};

export default function MobileLoginScreen(): React.JSX.Element {
  const router = useRouter();
  const setLoading = useAuthStore((s) => s.setLoading);

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhoneDisplay = useCallback((text: string): string => {
    const digits = text.replace(/\D/g, '');
    return digits.slice(0, 10);
  }, []);

  const handleSendOtp = useCallback(async (): Promise<void> => {
    setError('');

    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = `+91${phone}`;
    setIsSubmitting(true);
    setLoading(true);

    try {
      const result = await api.sendOtp(fullPhone);
      if (result.success) {
        router.push({ pathname: '/otp', params: { phone: fullPhone } });
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Unable to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  }, [phone, router, setLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Continue with mobile</Text>
          <Text style={styles.subtitle}>We will send a one-time password to confirm access.</Text>

          <View style={styles.phoneInputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              mode="outlined"
              placeholder="9876543210"
              value={phone}
              onChangeText={(text) => setPhone(formatPhoneDisplay(text))}
              keyboardType="phone-pad"
              maxLength={10}
              outlineColor={palette.line}
              activeOutlineColor={palette.ink}
              textColor={palette.ink}
              placeholderTextColor={palette.muted}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleSendOtp}
            loading={isSubmitting}
            disabled={isSubmitting || phone.length !== 10}
            buttonColor={palette.ink}
            textColor={palette.white}
            icon="login"
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {isSubmitting ? 'Sending OTP' : 'Continue'}
          </Button>

          <Button mode="text" textColor={palette.ink} onPress={() => router.back()}>
            Back
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: palette.ink,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: palette.muted,
    marginBottom: spacing.lg,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryCode: {
    minWidth: 62,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.faint,
  },
  countryCodeText: {
    ...typography.body,
    color: palette.ink,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: palette.paper,
    fontSize: 18,
  },
  errorText: {
    ...typography.bodySmall,
    color: palette.danger,
    marginTop: spacing.sm,
  },
  primaryButton: {
    borderRadius: radius.sm,
    marginTop: spacing.lg,
  },
  buttonContent: {
    minHeight: 52,
  },
  buttonLabel: {
    ...typography.button,
  },
});
