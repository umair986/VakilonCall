import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { brandColors, spacing, typography } from '../utils/theme';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

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
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false);
    }
  }, [stars, comment, params.callSessionId]);

  const durationMin = Math.floor(parseInt(params.durationSec ?? '0', 10) / 60);

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.thankYouIcon}>🎉</Text>
          <Text style={styles.thankYouTitle}>Thank You!</Text>
          <Text style={styles.thankYouSub}>
            Your feedback helps us improve the platform and reward great
            lawyers.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/home')}
            style={styles.doneButton}
            labelStyle={styles.doneButtonLabel}
          >
            Back to Home
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Call Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryIcon}>📞</Text>
          <Text style={styles.summaryTitle}>Call Completed</Text>
          <Text style={styles.summaryDetails}>
            {params.scenario ?? 'Legal Help'} • {durationMin} min
          </Text>
          {params.lawyerName ? (
            <Text style={styles.lawyerName}>
              with {params.lawyerName}
            </Text>
          ) : null}
        </View>

        {/* Star Rating */}
        <Surface style={styles.ratingCard} elevation={2}>
          <Text style={styles.ratingPrompt}>
            How was your experience?
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setStars(i)}>
                <Text
                  style={[
                    styles.star,
                    i <= stars && styles.starFilled,
                  ]}
                >
                  {i <= stars ? '★' : '☆'}
                </Text>
              </Pressable>
            ))}
          </View>

          {stars > 0 ? (
            <Text style={styles.starLabel}>
              {STAR_LABELS[stars]}
            </Text>
          ) : null}
        </Surface>

        {/* Optional Comment */}
        <TextInput
          style={styles.commentInput}
          mode="outlined"
          placeholder="Any feedback for the lawyer? (optional)"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          maxLength={500}
          outlineColor={brandColors.border}
          activeOutlineColor={brandColors.primary}
          textColor={brandColors.text}
          placeholderTextColor={brandColors.textMuted}
        />

        {/* Submit */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={stars === 0 || isSubmitting}
          style={styles.submitButton}
          labelStyle={styles.submitLabel}
          contentStyle={styles.submitContent}
        >
          Submit Rating
        </Button>

        <Button
          mode="text"
          onPress={() => router.replace('/home')}
          textColor={brandColors.textMuted}
          style={styles.skipButton}
        >
          Skip
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
    padding: spacing.lg,
    justifyContent: 'center',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  summarySection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  summaryIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.h2,
    color: brandColors.white,
    marginBottom: spacing.xs,
  },
  summaryDetails: {
    ...typography.body,
    color: brandColors.textSecondary,
  },
  lawyerName: {
    ...typography.body,
    color: brandColors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  ratingCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ratingPrompt: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.lg,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  star: {
    fontSize: 44,
    color: brandColors.border,
  },
  starFilled: {
    color: '#FBBF24',
  },
  starLabel: {
    ...typography.body,
    color: brandColors.accent,
    fontWeight: '600',
  },
  commentInput: {
    backgroundColor: brandColors.surfaceCard,
    marginBottom: spacing.lg,
  },
  submitButton: {
    borderRadius: 14,
  },
  submitLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  submitContent: {
    paddingVertical: spacing.sm,
  },
  skipButton: {
    marginTop: spacing.md,
  },
  thankYouIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  thankYouTitle: {
    ...typography.h1,
    color: brandColors.white,
    marginBottom: spacing.md,
  },
  thankYouSub: {
    ...typography.body,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  doneButton: {
    borderRadius: 14,
    minWidth: 200,
  },
  doneButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
});
