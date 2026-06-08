import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../services/api';
import { useTokenStore } from '../stores/tokenStore';
import { brandColors, spacing, typography } from '../utils/theme';

export default function CallScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{
    callSessionId: string;
    lawyerName: string;
    scenario: string;
  }>();

  const decrementBalance = useTokenStore((s) => s.decrementBalance);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEndCall = useCallback(async (): Promise<void> => {
    if (!params.callSessionId) return;

    setIsEnding(true);
    setError('');

    try {
      const result = await api.endCall(params.callSessionId);

      if (result.success) {
        if (result.data.tokens_charged > 0) {
          decrementBalance();
        }

        router.replace({
          pathname: '/rate-call',
          params: {
            callSessionId: params.callSessionId,
            lawyerName: params.lawyerName ?? '',
            durationSec: String(result.data.duration_sec),
            scenario: params.scenario ?? 'Legal Help',
          },
        });
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to end the call. Please try again.');
    } finally {
      setIsEnding(false);
    }
  }, [params.callSessionId, params.lawyerName, params.scenario, decrementBalance, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={brandColors.textSecondary}
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>In Call</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.content}>
        <Surface style={styles.callCard} elevation={2}>
          <Text style={styles.callLabel}>Connected With</Text>
          <Text style={styles.callLawyerName}>
            {params.lawyerName ?? 'Verified Lawyer'}
          </Text>
          <Text style={styles.callScenario}>
            {params.scenario ?? 'Legal Help'}
          </Text>

          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>Duration</Text>
            <Text style={styles.timerValue}>
              {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')}
            </Text>
          </View>
        </Surface>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleEndCall}
          loading={isEnding}
          disabled={isEnding}
          style={styles.endButton}
          labelStyle={styles.endButtonLabel}
          icon="phone-hangup"
        >
          {isEnding ? 'Ending...' : 'End Call'}
        </Button>

        <Text style={styles.noteText}>
          Calls are limited to 15 minutes per token.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: brandColors.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  callCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E0DA',
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  callLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginBottom: spacing.xs,
  },
  callLawyerName: {
    ...typography.h2,
    color: brandColors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  callScenario: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  timerRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  timerLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginBottom: spacing.xs,
  },
  timerValue: {
    fontSize: 40,
    fontWeight: '700',
    color: brandColors.primary,
    fontVariant: ['tabular-nums'],
  },
  endButton: {
    borderRadius: 14,
    width: '100%',
    backgroundColor: brandColors.error,
  },
  endButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  errorText: {
    ...typography.caption,
    color: brandColors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  noteText: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: spacing.md,
  },
});
