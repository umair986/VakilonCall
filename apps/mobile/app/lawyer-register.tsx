import React, { useState, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { LegalCard, PrimaryAction, Screen, ScreenHeader, StatusPill } from '../components/ui';

export default function LawyerRegisterScreen(): React.JSX.Element {
  const router = useRouter();

  const [barNumber, setBarNumber] = useState('');
  const [barState, setBarState] = useState('');
  const [certFile, setCertFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [idFile, setIdFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const pickDocument = useCallback(async (type: 'cert' | 'id'): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'cert') {
        setCertFile(result.assets[0]);
      } else {
        setIdFile(result.assets[0]);
      }
    }
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setError('');

    if (!barNumber.trim()) {
      setError('Bar enrollment number is required.');
      return;
    }
    if (!barState.trim()) {
      setError('Bar council state is required.');
      return;
    }
    if (!certFile) {
      setError('Enrollment certificate is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('bar_enrollment_number', barNumber.trim());
      formData.append('bar_council_state', barState.trim());
      formData.append('enrollment_cert', {
        uri: certFile.uri,
        type: certFile.mimeType ?? 'image/jpeg',
        name: `enrollment_cert.${certFile.uri.split('.').pop()}`,
      } as unknown as Blob);

      if (idFile) {
        formData.append('id_proof', {
          uri: idFile.uri,
          type: idFile.mimeType ?? 'image/jpeg',
          name: `id_proof.${idFile.uri.split('.').pop()}`,
        } as unknown as Blob);
      }

      const { useAuthStore: store } = await import('../stores/authStore');
      const token = store.getState().accessToken;
      const Constants = (await import('expo-constants')).default;
      const baseUrl =
        (Constants.expoConfig?.extra as Record<string, string> | undefined)?.API_BASE_URL ??
        'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/v1/lawyer/register`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error?.message ?? 'Registration failed.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [barNumber, barState, certFile, idFile]);

  if (success) {
    return (
      <Screen centered>
        <View style={styles.successIcon}>
          <Icon source="check-circle-outline" color={brandColors.successLight} size={48} />
        </View>
        <Text style={styles.successTitle}>Registration submitted</Text>
        <Text style={styles.successText}>
          Your Bar enrollment certificate is under review. Verification typically
          takes 24 to 48 hours.
        </Text>
        <PrimaryAction onPress={() => router.replace('/lawyer-home')}>
          Go to Dashboard
        </PrimaryAction>
      </Screen>
    );
  }

  return (
    <>
      <ScreenHeader title="Lawyer Registration" subtitle="Bar verification" back />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <Screen scroll>
          <LegalCard style={styles.formCard}>
            <StatusPill label="Verification required" icon="account-tie-outline" />
            <Text style={styles.formTitle}>Bar Council details</Text>
            <Text style={styles.formSubtitle}>
              We verify lawyers before they can receive calls. Submit accurate
              enrollment and certificate details.
            </Text>

            <TextInput
              label="Bar Enrollment Number *"
              value={barNumber}
              onChangeText={setBarNumber}
              mode="outlined"
              style={styles.input}
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.text}
              textColor={brandColors.text}
              placeholder="MH/1234/2024"
              placeholderTextColor={brandColors.textMuted}
            />

            <TextInput
              label="Bar Council State *"
              value={barState}
              onChangeText={setBarState}
              mode="outlined"
              style={styles.input}
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.text}
              textColor={brandColors.text}
              placeholder="Maharashtra"
              placeholderTextColor={brandColors.textMuted}
            />
            <HelperText type="info" style={styles.helper}>
              Enter the state where your Bar Council enrollment was issued.
            </HelperText>

            <UploadButton
              label="Enrollment Certificate *"
              selected={Boolean(certFile)}
              selectedText="Certificate selected"
              defaultText="Upload certificate"
              onPress={() => pickDocument('cert')}
            />
            <UploadButton
              label="ID Proof (optional)"
              selected={Boolean(idFile)}
              selectedText="ID proof selected"
              defaultText="Upload ID proof"
              onPress={() => pickDocument('id')}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryAction
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              icon="file-upload-outline"
            >
              {isSubmitting ? 'Submitting' : 'Submit for Verification'}
            </PrimaryAction>
          </LegalCard>
        </Screen>
      </KeyboardAvoidingView>
    </>
  );
}

function UploadButton({
  label,
  selected,
  selectedText,
  defaultText,
  onPress,
}: {
  label: string;
  selected: boolean;
  selectedText: string;
  defaultText: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.uploadGroup}>
      <Text style={styles.uploadLabel}>{label}</Text>
      <Button
        mode="outlined"
        onPress={onPress}
        icon={selected ? 'check-circle-outline' : 'upload-outline'}
        textColor={selected ? brandColors.successLight : brandColors.textSecondary}
        style={styles.uploadButton}
      >
        {selected ? selectedText : defaultText}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  formCard: {
    gap: spacing.md,
  },
  formTitle: {
    ...typography.h2,
    color: brandColors.text,
  },
  formSubtitle: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  input: {
    backgroundColor: brandColors.surface,
  },
  helper: {
    color: brandColors.textMuted,
  },
  uploadGroup: {
    gap: spacing.xs,
  },
  uploadLabel: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    fontWeight: '700',
  },
  uploadButton: {
    borderRadius: radius.md,
    borderColor: brandColors.border,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.errorLight,
  },
  successIcon: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h2,
    color: brandColors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
