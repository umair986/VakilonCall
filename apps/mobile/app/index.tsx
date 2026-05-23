import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { brandColors, spacing, typography } from '../utils/theme';

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const setLoading = useAuthStore((s) => s.setLoading);

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhoneDisplay = useCallback((text: string): string => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');
    // Allow max 10 digits (without +91 prefix)
    return digits.slice(0, 10);
  }, []);

  const handleSendOtp = useCallback(async (): Promise<void> => {
    setError('');

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const fullPhone = `+91${phone}`;
    setIsSubmitting(true);

    try {
      const result = await api.sendOtp(fullPhone);

      if (result.success) {
        router.push({ pathname: '/otp', params: { phone: fullPhone } });
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [phone, router]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo / Brand Section */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>⚖️</Text>
            </View>
            <Text style={styles.title}>Vakil On Call</Text>
            <Text style={styles.subtitle}>
              Instant legal help when you need it most
            </Text>
          </View>

          {/* Phone Input Section */}
          <Surface style={styles.inputCard} elevation={2}>
            <Text style={styles.inputLabel}>Enter your mobile number</Text>

            <View style={styles.phoneInputRow}>
              <Surface style={styles.countryCode} elevation={0}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </Surface>
              <TextInput
                style={styles.phoneInput}
                mode="outlined"
                placeholder="9876543210"
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneDisplay(text))}
                keyboardType="phone-pad"
                maxLength={10}
                outlineColor={brandColors.border}
                activeOutlineColor={brandColors.primary}
                textColor={brandColors.text}
                placeholderTextColor={brandColors.textMuted}
                autoFocus
              />
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSendOtp}
              loading={isSubmitting}
              disabled={isSubmitting || phone.length !== 10}
              style={styles.sendButton}
              labelStyle={styles.sendButtonLabel}
              contentStyle={styles.sendButtonContent}
            >
              {isSubmitting ? 'Sending OTP...' : 'Get OTP'}
            </Button>

            <Text style={styles.disclaimer}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
              This platform facilitates connection with independent legal professionals.
            </Text>
          </Surface>

          {/* Free Rights Link */}
          <Button
            mode="text"
            textColor={brandColors.secondary}
            onPress={() => router.push('/rights')}
            style={styles.rightsButton}
            icon="shield-check"
          >
            Know Your Rights — Free, No Login Required
          </Button>
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
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: brandColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    ...typography.h1,
    color: brandColors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    marginBottom: spacing.md,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  countryCode: {
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  countryCodeText: {
    ...typography.body,
    color: brandColors.text,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: brandColors.surface,
    fontSize: 18,
  },
  errorText: {
    ...typography.caption,
    color: brandColors.error,
    marginBottom: spacing.sm,
  },
  sendButton: {
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  sendButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  sendButtonContent: {
    paddingVertical: spacing.xs,
  },
  disclaimer: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  rightsButton: {
    marginTop: spacing.sm,
  },
});
