import React, { useState, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { LegalCard, PrimaryAction, Screen } from '../components/ui';

export default function LoginScreen(): React.JSX.Element {
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
    <Screen centered contentStyle={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.brandSection}>
          <View style={styles.brandMark}>
            <Icon source="scale-balance" color={brandColors.text} size={34} />
          </View>
          <Text style={styles.title}>Vakil On Call</Text>
          <Text style={styles.subtitle}>
            Immediate access to verified legal assistance across India.
          </Text>
        </View>

        <LegalCard style={styles.formCard}>
          <Text style={styles.sectionLabel}>Secure sign in</Text>
          <Text style={styles.formTitle}>Enter mobile number</Text>

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
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.text}
              textColor={brandColors.text}
              placeholderTextColor={brandColors.textMuted}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryAction
            onPress={handleSendOtp}
            loading={isSubmitting}
            disabled={isSubmitting || phone.length !== 10}
            icon="login"
          >
            {isSubmitting ? 'Sending OTP' : 'Continue'}
          </PrimaryAction>

          <Text style={styles.disclaimer}>
            This platform connects you with independent legal professionals. By
            continuing, you agree to the terms and privacy policy.
          </Text>
        </LegalCard>

        <Button
          mode="text"
          textColor={brandColors.textSecondary}
          onPress={() => router.push('/rights')}
          style={styles.rightsButton}
          icon="shield-check-outline"
        >
          Know Your Rights
        </Button>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.lg,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: brandColors.surface,
  },
  title: {
    ...typography.h1,
    color: brandColors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  formCard: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.section,
    color: brandColors.textMuted,
  },
  formTitle: {
    ...typography.h3,
    color: brandColors.text,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryCode: {
    minWidth: 62,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.surface,
  },
  countryCodeText: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: brandColors.surface,
    fontSize: 18,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.errorLight,
  },
  disclaimer: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
  },
  rightsButton: {
    marginTop: spacing.md,
  },
});
