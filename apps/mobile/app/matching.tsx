import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  connectSocket,
  onCallMatched,
  onNoLawyers,
  onCallEnded,
} from '../services/socket';
import { api } from '../services/api';
import { SCENARIOS } from '@vakiloncall/shared';
import { getCurrentLocation } from '../utils/location';
import { brandColors, spacing, typography } from '../utils/theme';

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
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const activeCallIdRef = useRef(activeCallId);

  const scenario = SCENARIOS.find((s) => s.type === params.scenario);
  const scenarioLabel = scenario?.label ?? 'Legal Help';

  useEffect(() => {
    activeCallIdRef.current = activeCallId;
  }, [activeCallId]);

  // Pulse animation for the searching indicator
  useEffect(() => {
    if (status !== 'searching') return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [status, pulseAnim]);

  // Rotate animation for the gavel icon
  useEffect(() => {
    if (status !== 'searching') return;

    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotate.start();
    return () => rotate.stop();
  }, [status, rotateAnim]);

  // Elapsed time counter
  useEffect(() => {
    if (status !== 'searching') return;
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Socket listeners
  useEffect(() => {
    const socket = connectSocket();

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
          scenario: scenarioLabel,
        },
      });
    });

    onNoLawyers((data) => {
      if (activeCallIdRef.current && data.call_session_id !== activeCallIdRef.current) return;
      setStatus('no_lawyers');
    });

    onCallEnded((data) => {
      if (activeCallIdRef.current && data.call_session_id !== activeCallIdRef.current) return;
      router.back();
    });

    return () => {
      // Don't disconnect socket here — it's managed globally
    };
  }, [router, scenarioLabel]);

  const handleCancel = useCallback(() => {
    if (!activeCallId) {
      router.back();
      return;
    }

    setError('');
    api.cancelCall(activeCallId)
      .then((result) => {
        if (result.success) {
          router.back();
        } else {
          setError(result.error.message);
        }
      })
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
        api.requestCall(
          scenarioType,
          location?.latitude,
          location?.longitude
        )
      )
      .then((result) => {
        if (result.success) {
          setActiveCallId(result.data.call_session_id);
        } else {
          setError(result.error.message);
          setStatus('no_lawyers');
        }
      })
      .catch(() => {
        setError('Failed to retry. Please try again.');
        setStatus('no_lawyers');
      });
  }, [params.scenario]);

  const rotateInterp = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'searching' ? (
          <>
            {/* Animated Searching Indicator */}
            <View style={styles.animationContainer}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ rotate: rotateInterp }] },
                ]}
              >
                <Text style={styles.searchIcon}>⚖️</Text>
              </Animated.View>
            </View>

            <Text style={styles.title}>Searching for a Lawyer</Text>
            <Text style={styles.subtitle}>
              {scenario?.label ?? 'Legal Help'} — connecting you with the best
              available lawyer
            </Text>

            <Surface style={styles.timerCard} elevation={1}>
              <Text style={styles.timerLabel}>Searching for</Text>
              <Text style={styles.timerValue}>
                {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, '0')}
              </Text>
            </Surface>

            <View style={styles.tips}>
              <Text style={styles.tipsText}>
                💡 Stay on this screen. We're broadcasting your request to
                verified lawyers nearby.
              </Text>
            </View>

            <Button
              mode="outlined"
              onPress={handleCancel}
              textColor={brandColors.error}
              style={styles.cancelButton}
            >
              Cancel Request
            </Button>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        ) : status === 'matched' ? (
          <>
            <View style={styles.matchedIconContainer}>
              <Text style={styles.matchedIcon}>✅</Text>
            </View>

            <Text style={styles.title}>Lawyer Found!</Text>
            <Text style={styles.subtitle}>
              {lawyerName} has accepted your request
            </Text>

            <Surface style={styles.lawyerCard} elevation={2}>
              <Text style={styles.lawyerName}>{lawyerName}</Text>
              <Text style={styles.lawyerRating}>
                ⭐ {lawyerRating.toFixed(1)} rating
              </Text>
              <Text style={styles.lawyerScenario}>
                {scenario?.label ?? 'Legal Help'}
              </Text>
            </Surface>

            <Text style={styles.connectingText}>
              Connecting call... please stay on the line.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.noLawyersIconContainer}>
              <Text style={styles.noLawyersIcon}>😔</Text>
            </View>

            <Text style={styles.title}>No Lawyers Available</Text>
            <Text style={styles.subtitle}>
              We couldn't find an available lawyer right now. Your token was
              not charged.
            </Text>

            <Button
              mode="contained"
              onPress={handleRetry}
              style={styles.retryButton}
              labelStyle={styles.retryLabel}
              icon="refresh"
            >
              Try Again
            </Button>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              mode="text"
              onPress={() => router.back()}
              textColor={brandColors.textSecondary}
              style={styles.goBackButton}
            >
              Go Back Home
            </Button>
          </>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  animationContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: brandColors.primary,
    opacity: 0.3,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: brandColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 48,
  },
  title: {
    ...typography.h2,
    color: brandColors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  timerCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    minWidth: 150,
  },
  timerLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginBottom: spacing.xs,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '700',
    color: brandColors.primary,
    fontVariant: ['tabular-nums'],
  },
  tips: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  tipsText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: brandColors.error,
    minWidth: 200,
  },
  errorText: {
    ...typography.caption,
    color: brandColors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  matchedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  matchedIcon: {
    fontSize: 56,
  },
  lawyerCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    minWidth: 250,
  },
  lawyerName: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.xs,
  },
  lawyerRating: {
    ...typography.body,
    color: brandColors.accent,
    marginBottom: spacing.xs,
  },
  lawyerScenario: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  connectingText: {
    ...typography.body,
    color: brandColors.secondary,
    textAlign: 'center',
  },
  noLawyersIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  noLawyersIcon: {
    fontSize: 56,
  },
  retryButton: {
    borderRadius: 14,
    minWidth: 200,
    marginBottom: spacing.md,
  },
  retryLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  goBackButton: {
    marginTop: spacing.sm,
  },
});
