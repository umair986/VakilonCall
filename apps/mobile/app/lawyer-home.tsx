import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Switch, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import {
  connectSocket,
  emitLawyerAcceptRequest,
  emitLawyerGoOffline,
  emitLawyerGoOnline,
  emitLawyerRejectRequest,
  onCallCancelled,
  onIncomingCall,
} from '../services/socket';
import { SCENARIOS } from '@vakiloncall/shared';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { DangerAction, LegalCard, MetricTile, PrimaryAction, Screen, StatusPill } from '../components/ui';

interface IncomingCall {
  call_session_id: string;
  scenario: string;
  language: string;
  user_location: { latitude: number; longitude: number } | null;
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

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const result = await api.getLawyerProfile();
        if (result.success && isMounted) {
          const data = result.data as {
            verification_status?: string;
            is_online?: boolean;
            avg_rating?: number;
            total_calls?: number;
            total_earnings?: number;
            wallet_balance?: number;
          };

          setVerificationStatus(data.verification_status ?? 'pending');
          setIsOnline(Boolean(data.is_online));
          setStats({
            avg_rating: Number(data.avg_rating ?? 0),
            total_calls: data.total_calls ?? 0,
            total_earnings: data.total_earnings ?? 0,
            wallet_balance: data.wallet_balance ?? 0,
          });
        } else if (!result.success && isMounted) {
          setProfileError(result.error.message);
        }
      } catch {
        if (isMounted) {
          setProfileError('Failed to load lawyer profile.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();
    connectSocket();
    onIncomingCall((data) => {
      if (activeCallRef.current) return;
      setIncomingCalls((prev) =>
        prev.some((call) => call.call_session_id === data.call_session_id)
          ? prev
          : [...prev, data]
      );
    });
    onCallCancelled((data) => {
      setIncomingCalls((prev) =>
        prev.filter((call) => call.call_session_id !== data.call_session_id)
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
          setIncomingCalls([]);
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
    setIncomingCalls((prev) =>
      prev.filter((item) => item.call_session_id !== call.call_session_id)
    );
  }, []);

  const handleReject = useCallback((call: IncomingCall): void => {
    emitLawyerRejectRequest(call.call_session_id);
    setIncomingCalls((prev) =>
      prev.filter((item) => item.call_session_id !== call.call_session_id)
    );
  }, []);

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.kicker}>Lawyer dashboard</Text>
          <Text style={styles.title}>Adv. {user?.full_name ?? 'Profile'}</Text>
        </View>
        <IconButton
          icon="account-circle-outline"
          iconColor={brandColors.textSecondary}
          size={28}
          onPress={() => router.push('/profile')}
          style={styles.profileButton}
        />
      </View>

      {!isVerified ? (
        <LegalCard variant="notice" style={styles.verificationCard}>
          <StatusPill
            label={verificationStatus === 'pending' ? 'Verification pending' : 'Verification rejected'}
            tone="warning"
            icon={verificationStatus === 'pending' ? 'clock-outline' : 'alert-circle-outline'}
          />
          <Text style={styles.cardTitle}>
            {verificationStatus === 'pending' ? 'Bar Council verification' : 'Documents need review'}
          </Text>
          <Text style={styles.cardText}>
            {verificationStatus === 'pending'
              ? 'Your enrollment is under review. Approval is required before accepting calls.'
              : 'Your verification was rejected. Please check your documents and re-submit.'}
          </Text>
        </LegalCard>
      ) : null}

      {profileError ? (
        <LegalCard variant="danger" style={styles.verificationCard}>
          <Text style={styles.cardText}>{profileError}</Text>
        </LegalCard>
      ) : null}

      <LegalCard style={styles.onlineCard}>
        <View style={styles.onlineRow}>
          <View style={styles.onlineCopy}>
            <StatusPill
              label={isOnline ? 'Online' : 'Offline'}
              tone={isOnline ? 'success' : 'neutral'}
              icon={isOnline ? 'broadcast' : 'minus-circle-outline'}
            />
            <Text style={styles.cardTitle}>{isOnline ? 'Accepting requests' : 'Not receiving requests'}</Text>
            <Text style={styles.cardText}>
              {isVerified ? 'Toggle availability when you are ready for calls.' : 'Verification must be approved first.'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            disabled={isToggling || !isVerified || !!activeCall}
            color={brandColors.successLight}
          />
        </View>
      </LegalCard>

      {isLoadingProfile ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={brandColors.text} />
          <Text style={styles.cardText}>Loading profile...</Text>
        </View>
      ) : null}

      {activeCall ? (
        <LegalCard variant="notice" style={styles.verificationCard}>
          <StatusPill label="Active call" tone="success" icon="phone-in-talk-outline" />
          <Text style={styles.cardTitle}>{activeCallLabel}</Text>
          <Text style={styles.cardText}>You have accepted this request.</Text>
          <DangerAction onPress={() => setActiveCall(null)} icon="phone-hangup">
            End Call
          </DangerAction>
        </LegalCard>
      ) : null}

      {isOnline && isVerified && !activeCall ? (
        <LegalCard style={styles.requestsCard}>
          <Text style={styles.sectionTitle}>Incoming Requests</Text>
          {incomingCalls.length === 0 ? (
            <Text style={styles.cardText}>Waiting for new requests...</Text>
          ) : (
            incomingCalls.map((call) => {
              const scenarioLabel =
                SCENARIOS.find((s) => s.type === call.scenario)?.label ?? 'Legal Help';
              return (
                <LegalCard key={call.call_session_id} variant="outlined" style={styles.requestItem}>
                  <Text style={styles.cardTitle}>{scenarioLabel}</Text>
                  <Text style={styles.cardText}>Language: {call.language || 'English'}</Text>
                  <View style={styles.requestActions}>
                    <DangerAction onPress={() => handleReject(call)} icon="close-circle-outline">
                      Reject
                    </DangerAction>
                    <PrimaryAction onPress={() => handleAccept(call)} icon="phone-check-outline">
                      Accept
                    </PrimaryAction>
                  </View>
                </LegalCard>
              );
            })
          )}
        </LegalCard>
      ) : null}

      <View style={styles.metricsRow}>
        <MetricTile label="Total Earned" value={`Rs ${stats.total_earnings}`} />
        <MetricTile label="Wallet" value={`Rs ${stats.wallet_balance}`} />
      </View>
      <View style={styles.metricsRow}>
        <MetricTile label="Calls" value={String(stats.total_calls)} />
        <MetricTile label="Rating" value={stats.avg_rating.toFixed(1)} />
      </View>

      <LegalCard style={styles.performanceCard}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Calls today</Text>
          <Text style={styles.performanceValue}>{stats.total_calls}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Online time</Text>
          <Text style={styles.performanceValue}>0h</Text>
        </View>
      </LegalCard>

      <PrimaryAction
        onPress={() => router.push('/earnings')}
        icon="bank-transfer"
        disabled={!isVerified}
      >
        Request Payout
      </PrimaryAction>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  kicker: {
    ...typography.section,
    color: brandColors.textMuted,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: brandColors.text,
  },
  profileButton: {
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: radius.md,
  },
  verificationCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  onlineCard: {
    marginBottom: spacing.md,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  onlineCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: brandColors.text,
  },
  cardText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  requestsCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  requestItem: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  performanceCard: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.section,
    color: brandColors.textMuted,
    marginBottom: spacing.sm,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performanceLabel: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  performanceValue: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brandColors.border,
  },
});
