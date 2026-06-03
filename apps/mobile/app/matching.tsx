import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { onCallMatched, onNoLawyers, onCallEnded, connectSocket } from '../services/socket';
import { SCENARIOS } from '@vakiloncall/shared';
import { api } from '../services/api';
import { getCurrentLocation } from '../utils/location';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { DangerAction, EmptyState, LegalCard, PrimaryAction, Screen, StatusPill } from '../components/ui';

export default function MatchingScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ scenario: string; callSessionId: string }>();

  const [status, setStatus] = useState<'searching' | 'matched' | 'no_lawyers'>('searching');
  const [lawyerName, setLawyerName] = useState('');
  const [lawyerRating, setLawyerRating] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState('');
  const [activeCallId, setActiveCallId] = useState(params.callSessionId ?? '');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const activeCallIdRef = useRef(activeCallId);
  const scenario = SCENARIOS.find((s) => s.type === params.scenario);

  useEffect(() => {
    activeCallIdRef.current = activeCallId;
  }, [activeCallId]);

  useEffect(() => {
    if (status !== 'searching') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [status, pulseAnim]);

  useEffect(() => {
    if (status !== 'searching') return;
    const interval = setInterval(() => setElapsedSec((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    connectSocket();
    onCallMatched((data) => {
      if (activeCallIdRef.current && data.call_session_id !== activeCallIdRef.current) return;
      setStatus('matched');
      setLawyerName(data.lawyer_name);
      setLawyerRating(data.lawyer_rating);
      router.replace({
        pathname: '/call',
        params: {
          callSessionId: data.call_session_id,
          lawyerName: data.lawyer_name,
          lawyerRating: String(data.lawyer_rating),
        },
      });
    });
    onNoLawyers((data) => {
      if (activeCallIdRef.current && data.call_session_id !== activeCallIdRef.current) return;
      setStatus('no_lawyers');
    });
    onCallEnded(() => router.back());
  }, [router]);

  const handleCancel = useCallback(() => {
    setError('');
    if (!activeCallId) {
      router.back();
      return;
    }

    api.cancelCall(activeCallId)
      .then(() => router.back())
      .catch(() => {
        setError('Failed to cancel the request. Please try again.');
      });
  }, [router, activeCallId]);

  const handleRetry = useCallback(() => {
    setStatus('searching');
    setElapsedSec(0);
    setError('');

    const scenarioType = params.scenario ?? 'other';
    getCurrentLocation()
      .then((location) =>
        api.requestCall(scenarioType, location?.latitude, location?.longitude)
      )
      .then((result) => {
        if (result.success) {
          setActiveCallId(result.data.call_session_id);
          return;
        }
        setError(result.error.message);
        setStatus('no_lawyers');
      })
      .catch(() => {
        setError('Failed to retry. Please try again.');
        setStatus('no_lawyers');
      });
  }, [params.scenario]);

  return (
    <Screen centered contentStyle={styles.content}>
      {status === 'searching' ? (
        <>
          <View style={styles.animationContainer}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.seal}>
              <Icon source="scale-balance" color={brandColors.text} size={44} />
            </View>
          </View>
          <Text style={styles.title}>Searching for a lawyer</Text>
          <Text style={styles.subtitle}>
            {scenario?.label ?? 'Legal help'} request is being sent to available
            verified lawyers.
          </Text>
          <LegalCard variant="outlined" style={styles.timerCard}>
            <Text style={styles.timerLabel}>Elapsed time</Text>
            <Text style={styles.timerValue}>
              {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')}
            </Text>
          </LegalCard>
          <LegalCard variant="notice" style={styles.noticeCard}>
            <StatusPill label="Request active" icon="broadcast" />
            <Text style={styles.noticeText}>
              Stay on this screen while the platform locates an available lawyer.
            </Text>
          </LegalCard>
          {error ? (
            <LegalCard variant="danger" style={styles.noticeCard}>
              <Text style={styles.noticeText}>{error}</Text>
            </LegalCard>
          ) : null}
          <DangerAction onPress={handleCancel}>Cancel Request</DangerAction>
        </>
      ) : status === 'matched' ? (
        <>
          <View style={styles.seal}>
            <Icon source="check-circle-outline" color={brandColors.successLight} size={48} />
          </View>
          <Text style={styles.title}>Lawyer accepted</Text>
          <Text style={styles.subtitle}>Your call is being connected.</Text>
          <LegalCard style={styles.lawyerCard}>
            <Text style={styles.lawyerName}>{lawyerName}</Text>
            <Text style={styles.lawyerMeta}>{lawyerRating.toFixed(1)} rating</Text>
            <StatusPill label={scenario?.label ?? 'Legal help'} />
          </LegalCard>
        </>
      ) : (
        <EmptyState
          icon="account-search-outline"
          title="No lawyers available"
          subtitle="We could not find an available lawyer right now. Your token was not charged."
          action={<PrimaryAction onPress={handleRetry} icon="refresh">Try Again</PrimaryAction>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  animationContainer: {
    width: 152,
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.textSecondary,
    opacity: 0.35,
  },
  seal: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.borderLight,
    backgroundColor: brandColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: brandColors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  timerCard: {
    alignItems: 'center',
    minWidth: 160,
    marginBottom: spacing.md,
  },
  timerLabel: {
    ...typography.section,
    color: brandColors.textMuted,
  },
  timerValue: {
    fontSize: 38,
    fontWeight: '700',
    color: brandColors.text,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xs,
  },
  noticeCard: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  noticeText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  lawyerCard: {
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 260,
  },
  lawyerName: {
    ...typography.h3,
    color: brandColors.text,
  },
  lawyerMeta: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
});
