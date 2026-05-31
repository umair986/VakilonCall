import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useTokenStore } from '../stores/tokenStore';
import { api } from '../services/api';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import type { LanguageCode } from '@vakiloncall/shared';
import { LegalCard, PrimaryAction, Screen } from '../components/ui';

const OTP_LENGTH = 6;

export default function OtpScreen(): React.JSX.Element {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setTokens, setUser, setIsNewUser } = useAuthStore();
  const { setBalance } = useTokenStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleOtpChange = useCallback(
    (text: string, index: number): void => {
      const newOtp = [...otp];
      if (text.length > 1) {
        const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
        digits.split('').forEach((digit, i) => {
          if (i < OTP_LENGTH) newOtp[i] = digit;
        });
        setOtp(newOtp);
        inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
        return;
      }

      newOtp[index] = text.replace(/\D/g, '');
      setOtp(newOtp);
      if (text && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleBackspace = useCallback(
    (index: number): void => {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerify = useCallback(async (): Promise<void> => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      setError('Enter the complete 6-digit OTP.');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      const result = await api.verifyOtp(phone ?? '', otpString);
      if (result.success) {
        setTokens(result.data.access_token, result.data.refresh_token);

        if (result.data.is_new_user || !result.data.user) {
          setIsNewUser(true);
          router.replace('/role-select');
        } else {
          const userData = result.data.user as Record<string, unknown>;
          setUser({
            id: userData.id as string,
            phone: userData.phone as string,
            full_name: (userData.full_name as string) ?? null,
            role: userData.role as 'user' | 'lawyer',
            language_pref: (userData.language_pref as LanguageCode) ?? 'en',
            token_balance: (userData.token_balance as number) ?? 0,
            is_active: true,
            is_banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setBalance((userData.token_balance as number) ?? 0);
          router.replace(userData.role === 'lawyer' ? '/lawyer-home' : '/home');
        }
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [otp, phone, router, setTokens, setUser, setIsNewUser, setBalance]);

  const handleResend = useCallback(async (): Promise<void> => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setError('');
    try {
      await api.sendOtp(phone ?? '');
    } catch {
      setError('Failed to resend OTP.');
    }
  }, [phone, resendTimer]);

  return (
    <Screen centered>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <LegalCard style={styles.card}>
          <Text style={styles.label}>Verification</Text>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to <Text style={styles.phone}>{phone ?? ''}</Text>.
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}>
                <RNTextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') handleBackspace(index);
                  }}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? OTP_LENGTH : 1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              </View>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryAction
            onPress={handleVerify}
            loading={isVerifying}
            disabled={isVerifying || otp.join('').length !== OTP_LENGTH}
          >
            {isVerifying ? 'Verifying' : 'Verify and Continue'}
          </PrimaryAction>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Didn't receive the code?"}
            </Text>
            {resendTimer <= 0 ? (
              <Button mode="text" onPress={handleResend} textColor={brandColors.text}>
                Resend
              </Button>
            ) : null}
          </View>
        </LegalCard>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    gap: spacing.md,
  },
  label: {
    ...typography.section,
    color: brandColors.textMuted,
  },
  title: {
    ...typography.h1,
    color: brandColors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  phone: {
    color: brandColors.text,
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: brandColors.surface,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  otpBoxFilled: {
    borderColor: brandColors.text,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: brandColors.text,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.errorLight,
  },
  resendRow: {
    alignItems: 'center',
  },
  resendText: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
});
