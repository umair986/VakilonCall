import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, IconButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { INDIAN_BAR_COUNCIL_STATES } from '@vakiloncall/shared';
import { brandColors, spacing, typography } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';

export default function LawyerRegisterScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

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
      setError('Bar enrollment number is required');
      return;
    }
    if (!barState.trim()) {
      setError('Bar council state is required');
      return;
    }
    if (!certFile) {
      setError('Enrollment certificate is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build FormData for multipart upload
      const formData = new FormData();
      formData.append('bar_enrollment_number', barNumber.trim());
      formData.append('bar_council_state', barState.trim());

      // TypeScript limitation with FormData + React Native file — cast needed
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

      // Direct fetch since api client doesn't handle multipart
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
        setError(data.error?.message ?? 'Registration failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [barNumber, barState, certFile, idFile]);

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Registration Submitted!</Text>
          <Text style={styles.successText}>
            Your Bar enrollment certificate is under review.{'\n'}
            Verification typically takes 24-48 hours.{'\n\n'}
            We will notify you once your profile is verified and you can start
            accepting calls.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/lawyer-home')}
            style={styles.successButton}
          >
            Go to Dashboard
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor={brandColors.text}
            size={24}
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Lawyer Registration</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={styles.formCard} elevation={2}>
            <Text style={styles.formTitle}>Bar Council Verification</Text>
            <Text style={styles.formSubtitle}>
              We verify all lawyers against Bar Council of India records.
              Please provide accurate details.
            </Text>

            {/* Bar Enrollment Number */}
            <TextInput
              label="Bar Enrollment Number *"
              value={barNumber}
              onChangeText={setBarNumber}
              mode="outlined"
              style={styles.input}
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.primary}
              textColor={brandColors.text}
              placeholder="e.g., MH/1234/2024"
            />

            {/* Bar Council State */}
            <TextInput
              label="Bar Council State *"
              value={barState}
              onChangeText={setBarState}
              mode="outlined"
              style={styles.input}
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.primary}
              textColor={brandColors.text}
              placeholder="e.g., Maharashtra"
            />
            <HelperText type="info" style={styles.helper}>
              Select the state where your Bar Council enrollment was done
            </HelperText>

            {/* Enrollment Certificate Upload */}
            <Text style={styles.uploadLabel}>Enrollment Certificate *</Text>
            <Button
              mode="outlined"
              onPress={() => pickDocument('cert')}
              icon={certFile ? 'check-circle' : 'upload'}
              textColor={certFile ? brandColors.success : brandColors.textSecondary}
              style={styles.uploadButton}
            >
              {certFile ? 'Certificate Selected ✓' : 'Upload Certificate'}
            </Button>

            {/* ID Proof Upload (Optional) */}
            <Text style={styles.uploadLabel}>ID Proof (Optional)</Text>
            <Button
              mode="outlined"
              onPress={() => pickDocument('id')}
              icon={idFile ? 'check-circle' : 'upload'}
              textColor={idFile ? brandColors.success : brandColors.textSecondary}
              style={styles.uploadButton}
            >
              {idFile ? 'ID Proof Selected ✓' : 'Upload ID Proof'}
            </Button>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              contentStyle={styles.submitButtonContent}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: brandColors.white,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 16,
    padding: spacing.lg,
  },
  formTitle: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  input: {
    backgroundColor: brandColors.surface,
    marginBottom: spacing.sm,
  },
  helper: {
    color: brandColors.textMuted,
    marginBottom: spacing.md,
  },
  uploadLabel: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  uploadButton: {
    borderRadius: 10,
    borderColor: brandColors.border,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.error,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  submitButton: {
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  submitButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  submitButtonContent: {
    paddingVertical: spacing.xs,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h2,
    color: brandColors.white,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.body,
    color: brandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
  successButton: {
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
  },
});
