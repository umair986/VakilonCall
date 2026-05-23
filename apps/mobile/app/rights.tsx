import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { brandColors, spacing, typography } from '../utils/theme';

const RIGHTS = [
  {
    title: 'Right to Remain Silent',
    article: 'Article 20(3), Constitution of India',
    description:
      'You cannot be compelled to be a witness against yourself. You have the right to refuse answering questions that may incriminate you. Say: "I exercise my right to remain silent under Article 20(3)."',
    icon: '🤐',
  },
  {
    title: 'Right to Know Grounds of Arrest',
    article: 'Article 22(1) + DK Basu Guidelines',
    description:
      'Police MUST inform you of the reason for your arrest. You must be given an arrest memo with the time, date, and reason. If they refuse, it is a violation of your constitutional rights.',
    icon: '📋',
  },
  {
    title: 'Right to Legal Counsel',
    article: 'Article 22(1), Constitution of India',
    description:
      'You have the right to consult and be defended by a lawyer of your choice. Police cannot deny you access to a lawyer. If you cannot afford one, you are entitled to free legal aid under NALSA.',
    icon: '⚖️',
  },
  {
    title: 'Right to Inform Family',
    article: 'DK Basu v. State of WB (1997)',
    description:
      'Police MUST inform your family or friend about your arrest. You can request that a specific person be notified. This is mandatory under the DK Basu Supreme Court guidelines.',
    icon: '👨‍👩‍👧',
  },
  {
    title: 'Right to Free Copy of FIR',
    article: 'Section 173 BNSS (formerly 154 CrPC)',
    description:
      'You are entitled to a free copy of the FIR. If police refuse to register an FIR, it is illegal under the Lalita Kumari v. Govt. of UP (2014) Supreme Court ruling.',
    icon: '📄',
  },
  {
    title: 'Right Against Illegal Detention',
    article: 'Article 21 + Section 35 BNSS',
    description:
      'For offences punishable by less than 7 years, police must serve notice first — NOT arrest directly (Section 35 BNSS, codifying Arnesh Kumar principle). Demand they serve notice.',
    icon: '🔓',
  },
  {
    title: 'Right to Medical Examination',
    article: 'DK Basu Guidelines',
    description:
      'You must be medically examined within 48 hours of arrest. This protects against custodial torture. Request it loudly and on record.',
    icon: '🏥',
  },
  {
    title: 'Right to be Produced Before Magistrate',
    article: 'Article 22(2) + BNSS',
    description:
      'You must be produced before a magistrate within 24 hours of arrest. Extended detention beyond this without judicial authorization is illegal.',
    icon: '🏛️',
  },
];

export default function RightsScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={brandColors.text}
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Your Constitutional Rights</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.banner} elevation={2}>
          <Text style={styles.bannerIcon}>🇮🇳</Text>
          <Text style={styles.bannerTitle}>Know Your Rights</Text>
          <Text style={styles.bannerSubtitle}>
            These rights are guaranteed by the Constitution of India, DK Basu Supreme Court
            guidelines, and BNSS 2024. No tokens required — this information is always free.
          </Text>
        </Surface>

        {RIGHTS.map((right, index) => (
          <Surface key={index} style={styles.rightCard} elevation={1}>
            <View style={styles.rightHeader}>
              <Text style={styles.rightIcon}>{right.icon}</Text>
              <View style={styles.rightTitleContainer}>
                <Text style={styles.rightTitle}>{right.title}</Text>
                <Text style={styles.rightArticle}>{right.article}</Text>
              </View>
            </View>
            <Text style={styles.rightDescription}>{right.description}</Text>
          </Surface>
        ))}

        <Surface style={styles.emergencyCard} elevation={2}>
          <Text style={styles.emergencyTitle}>🚨 In an Emergency?</Text>
          <Text style={styles.emergencyText}>
            If you are facing a legal emergency right now, go back and tap "Get Legal Help Now"
            to connect with a verified lawyer in under 60 seconds.
          </Text>
        </Surface>
      </ScrollView>
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
  banner: {
    backgroundColor: brandColors.primaryDark,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bannerIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    ...typography.h2,
    color: brandColors.white,
    marginBottom: spacing.sm,
  },
  bannerSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  rightCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rightIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  rightTitleContainer: {
    flex: 1,
  },
  rightTitle: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
  },
  rightArticle: {
    ...typography.caption,
    color: brandColors.primary,
    marginTop: 2,
  },
  rightDescription: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    lineHeight: 22,
    paddingLeft: 44,
  },
  emergencyCard: {
    backgroundColor: '#2D1B1B',
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: brandColors.error,
  },
  emergencyTitle: {
    ...typography.h3,
    color: brandColors.error,
    marginBottom: spacing.sm,
  },
  emergencyText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    lineHeight: 22,
  },
});
