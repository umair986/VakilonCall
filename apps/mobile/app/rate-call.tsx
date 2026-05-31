import React, { useState, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { LegalCard, PrimaryAction, Screen } from '../components/ui';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function RateCallScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{
    callSessionId: string;
    lawyerName: string;
    durationSec: string;
    scenario: string;
  }>();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (stars === 0) return;
    setIsSubmitting(true);

    try {
      await api.rateCall(params.callSessionId ?? '', stars, comment || undefined);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [stars, comment, params.callSessionId]);

  const durationMin = Math.floor(parseInt(params.durationSec ?? '0', 10) / 60);

  if (submitted) {
    return (
      <Screen centered contentStyle={styles.centeredContent}>
        <View style={styles.confirmIcon}>
          <Icon source="check-circle-outline" color={brandColors.successLight} size={48} />
        </View>
        <Text style={styles.thankYouTitle}>Feedback submitted</Text>
        <Text style={styles.thankYouSub}>
          Your review helps keep the lawyer network accountable and useful.
        </Text>
        <PrimaryAction onPress={() => router.replace('/home')}>Back to Home</PrimaryAction>
      </Screen>
    );
  }

  return (
    <Screen centered>
      <View style={styles.summarySection}>
        <View style={styles.callIcon}>
          <Icon source="phone-check-outline" color={brandColors.text} size={34} />
        </View>
        <Text style={styles.summaryTitle}>Call completed</Text>
        <Text style={styles.summaryDetails}>
          {params.scenario ?? 'Legal help'} | {durationMin} min
        </Text>
        {params.lawyerName ? <Text style={styles.lawyerName}>with {params.lawyerName}</Text> : null}
      </View>

      <LegalCard style={styles.ratingCard}>
        <Text style={styles.ratingPrompt}>How was your experience?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Pressable key={i} onPress={() => setStars(i)} style={styles.starButton}>
              <Icon
                source={i <= stars ? 'star' : 'star-outline'}
                color={i <= stars ? brandColors.text : brandColors.textMuted}
                size={34}
              />
            </Pressable>
          ))}
        </View>
        {stars > 0 ? <Text style={styles.starLabel}>{RATING_LABELS[stars]}</Text> : null}
      </LegalCard>

      <TextInput
        style={styles.commentInput}
        mode="outlined"
        placeholder="Optional feedback for the lawyer"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        maxLength={500}
        outlineColor={brandColors.border}
        activeOutlineColor={brandColors.text}
        textColor={brandColors.text}
        placeholderTextColor={brandColors.textMuted}
      />

      <PrimaryAction
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={stars === 0 || isSubmitting}
      >
        Submit Rating
      </PrimaryAction>

      <PrimaryAction
        mode="text"
        onPress={() => router.replace('/home')}
        textColor={brandColors.textMuted}
        buttonColor="transparent"
      >
        Skip
      </PrimaryAction>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centeredContent: {
    alignItems: 'center',
  },
  summarySection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  callIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.borderLight,
    backgroundColor: brandColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.h2,
    color: brandColors.text,
  },
  summaryDetails: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    marginTop: spacing.xs,
  },
  lawyerName: {
    ...typography.bodySmall,
    color: brandColors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  ratingCard: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  ratingPrompt: {
    ...typography.h3,
    color: brandColors.text,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  starLabel: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    fontWeight: '700',
  },
  commentInput: {
    backgroundColor: brandColors.surfaceCard,
    marginBottom: spacing.lg,
  },
  confirmIcon: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  thankYouTitle: {
    ...typography.h2,
    color: brandColors.text,
    marginBottom: spacing.sm,
  },
  thankYouSub: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
