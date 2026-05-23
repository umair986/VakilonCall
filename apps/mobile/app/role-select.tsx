import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { brandColors, spacing, typography } from '../utils/theme';

type RoleOption = 'user' | 'lawyer';

export default function RoleSelectScreen(): React.JSX.Element {
  const router = useRouter();
  const { setUser, setIsNewUser } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = useCallback(async (): Promise<void> => {
    if (!selectedRole) return;

    setError('');
    setIsSubmitting(true);

    try {
      const result = await api.setRole(selectedRole);

      if (result.success) {
        setUser({
          id: result.data.id,
          phone: result.data.phone,
          full_name: null,
          role: result.data.role as RoleOption,
          language_pref: 'en',
          token_balance: 0,
          is_active: true,
          is_banned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setIsNewUser(false);

        if (selectedRole === 'lawyer') {
          router.replace('/lawyer-register');
        } else {
          router.replace('/home');
        }
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRole, router, setUser, setIsNewUser]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to{'\n'}Vakil On Call</Text>
          <Text style={styles.subtitle}>How would you like to use the app?</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* User Card */}
          <Pressable onPress={() => setSelectedRole('user')}>
            <Surface
              style={[
                styles.roleCard,
                selectedRole === 'user' && styles.roleCardSelected,
              ]}
              elevation={selectedRole === 'user' ? 3 : 1}
            >
              <Text style={styles.roleIcon}>🛡️</Text>
              <Text style={styles.roleTitle}>I Need Legal Help</Text>
              <Text style={styles.roleDescription}>
                Get instant access to verified lawyers during emergencies, traffic stops,
                FIR issues, and more.
              </Text>
              <View style={styles.roleBullets}>
                <Text style={styles.bullet}>• Pay-per-call with tokens</Text>
                <Text style={styles.bullet}>• Connected in under 60 seconds</Text>
                <Text style={styles.bullet}>• Free rights information</Text>
              </View>
            </Surface>
          </Pressable>

          {/* Lawyer Card */}
          <Pressable onPress={() => setSelectedRole('lawyer')}>
            <Surface
              style={[
                styles.roleCard,
                selectedRole === 'lawyer' && styles.roleCardSelected,
              ]}
              elevation={selectedRole === 'lawyer' ? 3 : 1}
            >
              <Text style={styles.roleIcon}>⚖️</Text>
              <Text style={styles.roleTitle}>I Am a Lawyer</Text>
              <Text style={styles.roleDescription}>
                Earn money by helping citizens in legal emergencies. Build your practice
                from day one.
              </Text>
              <View style={styles.roleBullets}>
                <Text style={styles.bullet}>• Earn ₹32+ per consultation</Text>
                <Text style={styles.bullet}>• Flexible hours — go online anytime</Text>
                <Text style={styles.bullet}>• Build ratings and experience</Text>
              </View>
            </Surface>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleContinue}
          loading={isSubmitting}
          disabled={isSubmitting || !selectedRole}
          style={styles.continueButton}
          labelStyle={styles.continueButtonLabel}
          contentStyle={styles.continueButtonContent}
        >
          Continue as {selectedRole === 'lawyer' ? 'Lawyer' : selectedRole === 'user' ? 'Citizen' : '...'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: brandColors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: brandColors.textSecondary,
  },
  cardsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: brandColors.primary,
    backgroundColor: '#1a1a3e',
  },
  roleIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  roleTitle: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.xs,
  },
  roleDescription: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  roleBullets: {
    gap: 4,
  },
  bullet: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  continueButton: {
    borderRadius: 12,
  },
  continueButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  continueButtonContent: {
    paddingVertical: spacing.xs,
  },
});
