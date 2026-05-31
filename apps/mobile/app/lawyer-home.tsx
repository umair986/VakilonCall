import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Switch, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { LegalCard, MetricTile, PrimaryAction, Screen, StatusPill } from '../components/ui';

export default function LawyerHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [verificationStatus] = useState<string>('pending');

  const handleToggleOnline = useCallback(async (value: boolean): Promise<void> => {
    setIsToggling(true);
    try {
      const result = await api.toggleOnline(value);
      if (result.success) {
        setIsOnline(result.data.is_online);
      }
    } finally {
      setIsToggling(false);
    }
  }, []);

  const isVerified = verificationStatus === 'verified';

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
          <StatusPill label="Verification pending" tone="warning" icon="clock-outline" />
          <Text style={styles.cardTitle}>Bar Council verification</Text>
          <Text style={styles.cardText}>
            Your enrollment is under review. Approval is required before accepting calls.
          </Text>
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
            disabled={isToggling || !isVerified}
            color={brandColors.successLight}
          />
        </View>
      </LegalCard>

      <View style={styles.metricsRow}>
        <MetricTile label="Total Earned" value="Rs 0" />
        <MetricTile label="Wallet" value="Rs 0" />
      </View>
      <View style={styles.metricsRow}>
        <MetricTile label="Calls" value="0" />
        <MetricTile label="Rating" value="0.0" />
      </View>

      <LegalCard style={styles.performanceCard}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Calls today</Text>
          <Text style={styles.performanceValue}>0</Text>
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
  cardTitle: {
    ...typography.h3,
    color: brandColors.text,
  },
  cardText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
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
