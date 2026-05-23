import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useTokenStore } from '../stores/tokenStore';
import { api } from '../services/api';
import { brandColors, spacing, typography } from '../utils/theme';

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

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleOtpChange = useCallback(
    (text: string, index: number): void => {
      const newOtp = [...otp];
      // Handle paste of full OTP
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

      // Auto-focus next input
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
      setError('Please enter the complete 6-digit OTP');
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
            language_pref: (userData.language_pref as string) ?? 'en',
            token_balance: (userData.token_balance as number) ?? 0,
            is_active: true,
            is_banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setBalance((userData.token_balance as number) ?? 0);

          if (userData.role === 'lawyer') {
            router.replace('/lawyer-home');
          } else {
            router.replace('/home');
          }
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
      setError('Failed to resend OTP');
    }
  }, [phone, resendTimer]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneHighlight}>{phone ?? ''}</Text>
            </Text>
          </View>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <Surface key={index} style={styles.otpBox} elevation={1}>
                <RNTextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : {},
                  ]}
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
              </Surface>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={isVerifying || otp.join('').length !== OTP_LENGTH}
            style={styles.verifyButton}
            labelStyle={styles.verifyButtonLabel}
            contentStyle={styles.verifyButtonContent}
          >
            {isVerifying ? 'Verifying...' : 'Verify & Continue'}
          </Button>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>
              {resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : "Didn't receive OTP?"}
            </Text>
            {resendTimer <= 0 && (
              <Button
                mode="text"
                onPress={handleResend}
                textColor={brandColors.primary}
                compact
              >
                Resend
              </Button>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: brandColors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: brandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneHighlight: {
    color: brandColors.primary,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: brandColors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: brandColors.text,
  },
  otpInputFilled: {
    color: brandColors.primary,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  verifyButton: {
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  verifyButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  verifyButtonContent: {
    paddingVertical: spacing.xs,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    ...typography.bodySmall,
    color: brandColors.textMuted,
  },
});
