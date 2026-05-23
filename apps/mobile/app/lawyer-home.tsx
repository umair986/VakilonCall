import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, Switch, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { brandColors, spacing, typography } from '../utils/theme';

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
    } catch {
      // Revert on failure
    } finally {
      setIsToggling(false);
    }
  }, []);

  const isVerified = verificationStatus === 'verified';

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
            onPress={() => { /* Profile - Sprint 3 */ }}
          />
        </View>

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
              disabled={isToggling || !isVerified}
              color={brandColors.success}
            />
          </View>
          {!isVerified && (
            <Text style={styles.disabledNote}>
              You must be verified before going online
            </Text>
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? brandColors.success : brandColors.textMuted },
            ]}
          />
        </Surface>

        {/* Earnings Summary */}
        <Surface style={styles.earningsCard} elevation={1}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
          <View style={styles.earningsGrid}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>₹0</Text>
              <Text style={styles.earningsLabel}>Total Earned</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>₹0</Text>
              <Text style={styles.earningsLabel}>Wallet Balance</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>0</Text>
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
              <Text style={styles.statValue}>0.0</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📞</Text>
              <Text style={styles.statValue}>0</Text>
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
          onPress={() => { /* Payout flow - Sprint 3 */ }}
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
