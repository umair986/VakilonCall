import React, { useState, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { LegalCard, PrimaryAction, Screen, StatusPill } from '../components/ui';

type RoleOption = 'user' | 'lawyer';

const roleOptions: Array<{
  role: RoleOption;
  icon: string;
  title: string;
  description: string;
  points: string[];
}> = [
  {
    role: 'user',
    icon: 'shield-check-outline',
    title: 'I need legal help',
    description: 'Connect with verified lawyers for urgent legal situations.',
    points: ['Token-based consultation', 'Rights library included', 'Emergency contact support'],
  },
  {
    role: 'lawyer',
    icon: 'account-tie-outline',
    title: 'I am a lawyer',
    description: 'Accept calls, support citizens, and manage payouts from one dashboard.',
    points: ['Bar Council verification', 'Flexible online status', 'Consultation earnings'],
  },
];

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
          phone: (result.data.phone as string) ?? null,
          email: (result.data as Record<string, unknown>).email as string ?? null,
          google_id: null,
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
        router.replace(selectedRole === 'lawyer' ? '/lawyer-register' : '/home');
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
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.kicker}>Account setup</Text>
        <Text style={styles.title}>Choose your role</Text>
        <Text style={styles.subtitle}>
          This decides the first dashboard you see. You can manage account
          details later from profile.
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {roleOptions.map((option) => {
          const isSelected = selectedRole === option.role;
          return (
            <Pressable key={option.role} onPress={() => setSelectedRole(option.role)}>
              <LegalCard style={[styles.roleCard, isSelected && styles.roleCardSelected]}>
                <View style={styles.roleHeader}>
                  <View style={styles.roleIcon}>
                    <Icon source={option.icon} size={26} color={brandColors.text} />
                  </View>
                  {isSelected ? <StatusPill label="Selected" icon="check" /> : null}
                </View>
                <Text style={styles.roleTitle}>{option.title}</Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
                <View style={styles.points}>
                  {option.points.map((point) => (
                    <View key={point} style={styles.pointRow}>
                      <Icon source="minus" size={14} color={brandColors.textMuted} />
                      <Text style={styles.pointText}>{point}</Text>
                    </View>
                  ))}
                </View>
              </LegalCard>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <PrimaryAction
        onPress={handleContinue}
        loading={isSubmitting}
        disabled={isSubmitting || !selectedRole}
      >
        Continue as {selectedRole === 'lawyer' ? 'Lawyer' : selectedRole === 'user' ? 'Citizen' : 'Selected Role'}
      </PrimaryAction>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  kicker: {
    ...typography.section,
    color: brandColors.textMuted,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: brandColors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    marginTop: spacing.sm,
  },
  cardsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleCard: {
    gap: spacing.sm,
  },
  roleCardSelected: {
    borderColor: brandColors.text,
    backgroundColor: brandColors.surfaceElevated,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.surface,
  },
  roleTitle: {
    ...typography.h3,
    color: brandColors.text,
  },
  roleDescription: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  points: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointText: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.errorLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
