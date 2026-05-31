import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { LegalCard, PrimaryAction, Screen, ScreenHeader, StatusPill } from '../components/ui';

const RIGHTS = [
  {
    title: 'Right to Remain Silent',
    article: 'Article 20(3), Constitution of India',
    description:
      'You cannot be compelled to be a witness against yourself. You may refuse to answer questions that could incriminate you.',
    icon: 'account-voice-off-outline',
  },
  {
    title: 'Right to Know Grounds of Arrest',
    article: 'Article 22(1) and DK Basu Guidelines',
    description:
      'Police must inform you of the reason for arrest and provide an arrest memo with time, date, and reason.',
    icon: 'file-document-alert-outline',
  },
  {
    title: 'Right to Legal Counsel',
    article: 'Article 22(1), Constitution of India',
    description:
      'You have the right to consult and be defended by a lawyer of your choice. Free legal aid is available when eligible.',
    icon: 'scale-balance',
  },
  {
    title: 'Right to Inform Family',
    article: 'DK Basu v. State of WB (1997)',
    description:
      'Police must inform your family or a friend about your arrest when requested. This is a mandatory safeguard.',
    icon: 'account-group-outline',
  },
  {
    title: 'Right to Free Copy of FIR',
    article: 'Section 173 BNSS, formerly 154 CrPC',
    description:
      'You are entitled to a free copy of the FIR. Refusal to register an FIR may be challenged.',
    icon: 'file-document-outline',
  },
  {
    title: 'Right Against Illegal Detention',
    article: 'Article 21 and Section 35 BNSS',
    description:
      'For many offences punishable by less than 7 years, police must serve notice before arrest unless legal conditions are met.',
    icon: 'lock-open-variant-outline',
  },
  {
    title: 'Right to Medical Examination',
    article: 'DK Basu Guidelines',
    description:
      'A medical examination within the required period protects against custodial violence and creates a record.',
    icon: 'medical-bag',
  },
  {
    title: 'Right to Magistrate Production',
    article: 'Article 22(2) and BNSS',
    description:
      'You must be produced before a magistrate within 24 hours of arrest, excluding travel time.',
    icon: 'bank-outline',
  },
];

export default function RightsScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <>
      <ScreenHeader title="Rights Library" subtitle="Constitutional reference" back />
      <Screen scroll contentStyle={styles.scrollContent}>
        <LegalCard style={styles.banner}>
          <StatusPill label="Always free" icon="shield-check-outline" />
          <Text style={styles.bannerTitle}>Know Your Rights</Text>
          <Text style={styles.bannerSubtitle}>
            A concise legal reference for police interaction, arrest safeguards,
            FIR access, and counsel rights in India.
          </Text>
        </LegalCard>

        <View style={styles.rightsList}>
          {RIGHTS.map((right) => (
            <LegalCard key={right.title} style={styles.rightCard}>
              <View style={styles.rightHeader}>
                <View style={styles.rightIcon}>
                  <Icon source={right.icon} color={brandColors.textSecondary} size={22} />
                </View>
                <View style={styles.rightTitleContainer}>
                  <Text style={styles.rightTitle}>{right.title}</Text>
                  <Text style={styles.rightArticle}>{right.article}</Text>
                </View>
              </View>
              <Text style={styles.rightDescription}>{right.description}</Text>
            </LegalCard>
          ))}
        </View>

        <LegalCard variant="danger" style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Facing an urgent situation?</Text>
          <Text style={styles.emergencyText}>
            Start a legal assistance request to connect with an available lawyer.
          </Text>
          <PrimaryAction onPress={() => router.push('/scenario-select')} icon="phone-in-talk-outline">
            Request Legal Assistance
          </PrimaryAction>
        </LegalCard>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.lg,
  },
  banner: {
    gap: spacing.sm,
  },
  bannerTitle: {
    ...typography.h2,
    color: brandColors.text,
  },
  bannerSubtitle: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  rightsList: {
    gap: spacing.md,
  },
  rightCard: {
    gap: spacing.md,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  rightIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: brandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.surface,
  },
  rightTitleContainer: {
    flex: 1,
  },
  rightTitle: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '700',
  },
  rightArticle: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 3,
  },
  rightDescription: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  emergencyCard: {
    gap: spacing.md,
  },
  emergencyTitle: {
    ...typography.h3,
    color: brandColors.text,
  },
  emergencyText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
});
