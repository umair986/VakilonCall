import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Icon, Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { radius, spacing, typography } from '../utils/theme';

const palette = {
  paper: '#FBFAF6',
  ink: '#0B0B0B',
  muted: '#62615C',
  faint: '#E8E5DD',
  line: '#D8D4C9',
  black: '#000000',
  white: '#FFFFFF',
  danger: '#B42318',
};

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.letterhead}>
            <View style={styles.seal}>
              <Icon source="scale-balance" color={palette.white} size={30} />
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.brandName}>Vakil On Call</Text>
              <Text style={styles.brandMeta}>Verified legal access in India</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.overline}>Private consultation access</Text>
            <Text style={styles.headline}>Legal help, without the waiting room.</Text>
            <Text style={styles.subhead}>
              Sign in with your mobile number to request a lawyer, review your
              rights, or manage consultation tokens.
            </Text>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.panelRule} />
            <Text style={styles.panelTitle}>Mobile verification</Text>
            <Text style={styles.panelNote}>
              We will send a one-time password to confirm access.
            </Text>

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
                activeOutlineColor={palette.black}
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
              buttonColor={palette.black}
              textColor={palette.white}
              icon="login"
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {isSubmitting ? 'Sending OTP' : 'Continue Securely'}
            </Button>
          </View>

          <View style={styles.rightsStrip}>
            <View style={styles.rightsIcon}>
              <Icon source="shield-check-outline" color={palette.ink} size={18} />
            </View>
            <View style={styles.rightsCopy}>
              <Text style={styles.rightsTitle}>Know your rights</Text>
              <Text style={styles.rightsText}>Free constitutional reference, no login required.</Text>
            </View>
            <Button
              mode="text"
              textColor={palette.black}
              onPress={() => router.push('/rights')}
              compact
            >
              Open
            </Button>
          </View>
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
  letterhead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  seal: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: palette.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    ...typography.h3,
    color: palette.ink,
  },
  brandMeta: {
    ...typography.caption,
    color: palette.muted,
    marginTop: 2,
  },
  hero: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.ink,
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  overline: {
    ...typography.section,
    color: palette.muted,
    marginBottom: spacing.md,
  },
  headline: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: palette.ink,
  },
  subhead: {
    ...typography.body,
    color: palette.muted,
    marginTop: spacing.md,
  },
  formPanel: {
    backgroundColor: palette.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  panelRule: {
    width: 52,
    height: 4,
    backgroundColor: palette.black,
    marginBottom: spacing.md,
  },
  panelTitle: {
    ...typography.h3,
    color: palette.ink,
  },
  panelNote: {
    ...typography.bodySmall,
    color: palette.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
    backgroundColor: palette.paper,
  },
  countryCodeText: {
    ...typography.body,
    color: palette.ink,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: palette.white,
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
    minHeight: 50,
  },
  buttonLabel: {
    ...typography.button,
  },
  rightsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.faint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rightsIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  rightsCopy: {
    flex: 1,
  },
  rightsTitle: {
    ...typography.bodySmall,
    color: palette.ink,
    fontWeight: '800',
  },
  rightsText: {
    ...typography.caption,
    color: palette.muted,
    marginTop: 2,
  },
});
