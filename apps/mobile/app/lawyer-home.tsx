import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, Switch, IconButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import {
  connectSocket,
  onIncomingCall,
  onCallCancelled,
  onCallEnded,
  emitLawyerGoOnline,
  emitLawyerGoOffline,
  emitLawyerAcceptRequest,
  emitLawyerRejectRequest,
} from '../services/socket';
import { SCENARIOS } from '@vakiloncall/shared';
import { brandColors, spacing, typography } from '../utils/theme';

interface IncomingCall {
  call_session_id: string;
  scenario: string;
  language: string;
  user_location: { latitude: number; longitude: number } | null;
  received_at: string;
}

export default function LawyerHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');
  const [profileError, setProfileError] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>([]);
  const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
  const [activeCallSec, setActiveCallSec] = useState(0);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [stats, setStats] = useState({
    total_earnings: 0,
    wallet_balance: 0,
    total_calls: 0,
    avg_rating: 0,
  });

  const activeCallRef = useRef<IncomingCall | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const loadProfile = useCallback(async (): Promise<void> => {
    setProfileError('');
    setIsLoadingProfile(true);

    try {
      const result = await api.getLawyerProfile();
      if (result.success) {
        const data = result.data as {
          verification_status: string;
          is_online: boolean;
          avg_rating: number;
          total_calls: number;
          total_earnings: number;
          wallet_balance: number;
        };

        setVerificationStatus(data.verification_status ?? 'pending');
        setIsOnline(Boolean(data.is_online));
        setStats({
          avg_rating: Number(data.avg_rating ?? 0),
          total_calls: data.total_calls ?? 0,
          total_earnings: Number(data.total_earnings ?? 0),
          wallet_balance: Number(data.wallet_balance ?? 0),
        });
      } else {
        setProfileError(result.error.message);
      }
    } catch {
      setProfileError('Failed to load profile. Please try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    connectSocket();
    loadProfile().catch(() => {
      // handled in loadProfile
    });

    onIncomingCall((data) => {
      if (activeCallRef.current) return;

      setIncomingCalls((prev) => {
        if (prev.some((c) => c.call_session_id === data.call_session_id)) {
          return prev;
        }
        return [
          ...prev,
          {
            call_session_id: data.call_session_id,
            scenario: data.scenario,
            language: data.language,
            user_location: data.user_location ?? null,
            received_at: new Date().toISOString(),
          },
        ];
      });
    });

    onCallCancelled((data) => {
      setIncomingCalls((prev) =>
        prev.filter((c) => c.call_session_id !== data.call_session_id)
      );
    });

    onCallEnded((data) => {
      if (activeCallRef.current?.call_session_id !== data.call_session_id) return;
      setActiveCall(null);
      setActiveCallSec(0);
      loadProfile().catch(() => {
        // handled in loadProfile
      });
    });
  }, [loadProfile]);

  useEffect(() => {
    if (!activeCall) return;
    const timer = setInterval(() => {
      setActiveCallSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCall]);

  const handleToggleOnline = useCallback(async (value: boolean): Promise<void> => {
    setIsToggling(true);
    setProfileError('');
    try {
      const result = await api.toggleOnline(value);
      if (result.success) {
        setIsOnline(result.data.is_online);
        if (result.data.is_online) {
          emitLawyerGoOnline();
        } else {
          emitLawyerGoOffline();
        }
      } else {
        setProfileError(result.error.message);
      }
    } catch {
      setProfileError('Failed to update online status. Please try again.');
    } finally {
      setIsToggling(false);
    }
  }, []);

  const isVerified = verificationStatus === 'verified';
  const activeCallLabel = useMemo(() => {
    if (!activeCall) return null;
    return SCENARIOS.find((s) => s.type === activeCall.scenario)?.label ?? 'Legal Help';
  }, [activeCall]);

  const handleAccept = useCallback((call: IncomingCall): void => {
    emitLawyerAcceptRequest(call.call_session_id);
    setActiveCall(call);
    setActiveCallSec(0);
    setIncomingCalls((prev) =>
      prev.filter((c) => c.call_session_id !== call.call_session_id)
    );
  }, []);

  const handleReject = useCallback((call: IncomingCall): void => {
    emitLawyerRejectRequest(call.call_session_id);
    setIncomingCalls((prev) =>
      prev.filter((c) => c.call_session_id !== call.call_session_id)
    );
  }, []);

  const handleEndCall = useCallback(async (): Promise<void> => {
    if (!activeCall) return;
    setIsEndingCall(true);
    setProfileError('');

    try {
      const result = await api.endCall(activeCall.call_session_id);
      if (result.success) {
        setActiveCall(null);
        setActiveCallSec(0);
        loadProfile().catch(() => {
          // handled in loadProfile
        });
      } else {
        setProfileError(result.error.message);
      }
    } catch {
      setProfileError('Failed to end call. Please try again.');
    } finally {
      setIsEndingCall(false);
    }
  }, [activeCall, loadProfile]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, Advocate {user?.full_name ?? ''} ⚖️
            </Text>
            <Text style={styles.greetingSub}>Lawyer Dashboard</Text>
          </View>
          <IconButton
            icon="account-circle"
            iconColor={brandColors.textSecondary}
            size={32}
            onPress={() => router.push('/profile')}
          />
        </View>

        {isLoadingProfile ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={brandColors.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : null}

        {profileError ? (
          <Surface style={styles.errorCard} elevation={1}>
            <Text style={styles.errorText}>{profileError}</Text>
          </Surface>
        ) : null}

        {/* Verification Status */}
        {!isVerified && (
          <Surface style={styles.verificationCard} elevation={2}>
            <Text style={styles.verificationIcon}>
              {verificationStatus === 'pending' ? '⏳' : '❌'}
            </Text>
            <Text style={styles.verificationTitle}>
              {verificationStatus === 'pending'
                ? 'Verification Pending'
                : 'Verification Rejected'}
            </Text>
            <Text style={styles.verificationText}>
              {verificationStatus === 'pending'
                ? 'Your Bar enrollment is being verified. This typically takes 24-48 hours. You will be notified once approved.'
                : 'Your verification was rejected. Please check your documents and re-submit.'}
            </Text>
          </Surface>
        )}

        {/* Online/Offline Toggle */}
        <Surface style={styles.onlineCard} elevation={2}>
          <View style={styles.onlineRow}>
            <View>
              <Text style={styles.onlineLabel}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
              <Text style={styles.onlineSub}>
                {isOnline
                  ? 'You can receive call requests from citizens'
                  : 'Toggle to start receiving call requests'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={isToggling || !isVerified || !!activeCall}
              color={brandColors.success}
            />
          </View>
          {!isVerified && (
            <Text style={styles.disabledNote}>
              You must be verified before going online
            </Text>
          )}
          {activeCall ? (
            <Text style={styles.disabledNote}>
              You are in an active call. Finish it before going offline.
            </Text>
          ) : null}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? brandColors.success : brandColors.textMuted },
            ]}
          />
        </Surface>

        {activeCall ? (
          <Surface style={styles.activeCallCard} elevation={2}>
            <Text style={styles.sectionTitle}>Active Call</Text>
            <Text style={styles.activeCallScenario}>{activeCallLabel}</Text>
            <Text style={styles.activeCallMeta}>
              Language: {activeCall.language.toUpperCase()}
            </Text>
            {activeCall.user_location ? (
              <Text style={styles.activeCallMeta}>
                Location: {activeCall.user_location.latitude.toFixed(4)}, {activeCall.user_location.longitude.toFixed(4)}
              </Text>
            ) : null}
            <Text style={styles.activeCallTimer}>
              {Math.floor(activeCallSec / 60)}:{String(activeCallSec % 60).padStart(2, '0')}
            </Text>
            <Button
              mode="contained"
              onPress={handleEndCall}
              loading={isEndingCall}
              disabled={isEndingCall}
              style={styles.endCallButton}
              labelStyle={styles.endCallButtonLabel}
              icon="phone-hangup"
            >
              {isEndingCall ? 'Ending...' : 'End Call'}
            </Button>
          </Surface>
        ) : null}

        {isOnline && isVerified && !activeCall ? (
          <Surface style={styles.requestsCard} elevation={1}>
            <Text style={styles.sectionTitle}>Incoming Requests</Text>
            {incomingCalls.length === 0 ? (
              <Text style={styles.requestsEmpty}>Waiting for new requests...</Text>
            ) : (
              incomingCalls.map((call) => {
                const scenarioLabel =
                  SCENARIOS.find((s) => s.type === call.scenario)?.label ?? 'Legal Help';
                return (
                  <Surface key={call.call_session_id} style={styles.requestItem} elevation={1}>
                    <Text style={styles.requestScenario}>{scenarioLabel}</Text>
                    <Text style={styles.requestMeta}>Language: {call.language.toUpperCase()}</Text>
                    {call.user_location ? (
                      <Text style={styles.requestMeta}>
                        Location: {call.user_location.latitude.toFixed(4)}, {call.user_location.longitude.toFixed(4)}
                      </Text>
                    ) : null}
                    <View style={styles.requestActions}>
                      <Button
                        mode="contained"
                        onPress={() => handleAccept(call)}
                        style={styles.acceptButton}
                        labelStyle={styles.acceptLabel}
                        icon="check"
                      >
                        Accept
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleReject(call)}
                        style={styles.rejectButton}
                        textColor={brandColors.error}
                        icon="close"
                      >
                        Reject
                      </Button>
                    </View>
                  </Surface>
                );
              })
            )}
          </Surface>
        ) : null}

        {/* Earnings Summary */}
        <Surface style={styles.earningsCard} elevation={1}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
          <View style={styles.earningsGrid}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>₹{stats.total_earnings}</Text>
              <Text style={styles.earningsLabel}>Total Earned</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>₹{stats.wallet_balance}</Text>
              <Text style={styles.earningsLabel}>Wallet Balance</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>{stats.total_calls}</Text>
              <Text style={styles.earningsLabel}>Total Calls</Text>
            </View>
          </View>
        </Surface>

        {/* Stats */}
        <Surface style={styles.statsCard} elevation={1}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{stats.avg_rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📞</Text>
              <Text style={styles.statValue}>{stats.total_calls}</Text>
              <Text style={styles.statLabel}>Calls Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🕐</Text>
              <Text style={styles.statValue}>0h</Text>
              <Text style={styles.statLabel}>Online Time</Text>
            </View>
          </View>
        </Surface>

        {/* Request Payout */}
        <Button
          mode="outlined"
          onPress={() => router.push('/earnings')}
          textColor={brandColors.secondary}
          style={styles.payoutButton}
          icon="bank-transfer"
          disabled={!isVerified}
        >
          Request Payout
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    color: brandColors.white,
  },
  greetingSub: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: brandColors.textSecondary,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: brandColors.error,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.error,
  },
  verificationCard: {
    backgroundColor: '#2D2006',
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: brandColors.accent,
  },
  verificationIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  verificationTitle: {
    ...typography.h3,
    color: brandColors.accent,
    marginBottom: spacing.xs,
  },
  verificationText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
    lineHeight: 22,
  },
  onlineCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  onlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onlineLabel: {
    ...typography.h3,
    color: brandColors.white,
  },
  onlineSub: {
    ...typography.caption,
    color: brandColors.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  disabledNote: {
    ...typography.caption,
    color: brandColors.accent,
    marginTop: spacing.sm,
  },
  statusDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeCallCard: {
    backgroundColor: brandColors.primaryDark,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  activeCallScenario: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.xs,
  },
  activeCallMeta: {
    ...typography.caption,
    color: brandColors.textSecondary,
    marginTop: 2,
  },
  activeCallTimer: {
    fontSize: 32,
    fontWeight: '700',
    color: brandColors.white,
    marginVertical: spacing.md,
  },
  endCallButton: {
    borderRadius: 12,
    backgroundColor: brandColors.error,
  },
  endCallButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  requestsCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  requestsEmpty: {
    ...typography.bodySmall,
    color: brandColors.textMuted,
  },
  requestItem: {
    backgroundColor: brandColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  requestScenario: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  requestMeta: {
    ...typography.caption,
    color: brandColors.textSecondary,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: brandColors.success,
  },
  acceptLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  rejectButton: {
    flex: 1,
    borderRadius: 10,
    borderColor: brandColors.error,
  },
  earningsCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  earningsItem: {
    alignItems: 'center',
  },
  earningsValue: {
    ...typography.h2,
    color: brandColors.secondary,
  },
  earningsLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 4,
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: brandColors.border,
  },
  statsCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: brandColors.white,
  },
  statLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
  payoutButton: {
    borderRadius: 12,
    borderColor: brandColors.secondary,
  },
});
