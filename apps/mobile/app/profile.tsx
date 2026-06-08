import React, { useState, useCallback, useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useTokenStore } from '../stores/tokenStore';
import { api } from '../services/api';
import { disconnectSocket } from '../services/socket';
import { LANGUAGES } from '@vakiloncall/shared';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import {
  ActionRow,
  DangerAction,
  LegalCard,
  MetricTile,
  PrimaryAction,
  Screen,
  ScreenHeader,
  StatusPill,
} from '../components/ui';

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const balance = useTokenStore((s) => s.balance);
  const setBalance = useTokenStore((s) => s.setBalance);

  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const res = await api.getTokenBalance();
        if (res.success && res.data && typeof res.data.token_balance === 'number' && isMounted) {
          setBalance(res.data.token_balance);
        }
      } catch (err) {
        console.error('Failed to fetch token balance in profile:', err);
      }
    };
    fetchBalance();
    return () => {
      isMounted = false;
    };
  }, [setBalance]);

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveName = useCallback(async (): Promise<void> => {
    if (!fullName.trim() || fullName.trim() === user?.full_name) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const result = await api.updateProfile({ full_name: fullName.trim() });
      if (result.success && user) {
        setUser({ ...user, full_name: fullName.trim() });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [fullName, user, setUser]);

  const handleLogout = useCallback((): void => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          disconnectSocket();
          logout();
          router.replace('/');
        },
      },
    ]);
  }, [logout, router]);

  const initial = (user?.full_name ?? user?.phone ?? '?').charAt(0).toUpperCase();

  return (
    <>
      <ScreenHeader title="Profile" subtitle="Account and access" back />
      <Screen scroll>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.full_name ?? 'Unnamed account'}</Text>
          <Text style={styles.phone}>{user?.phone ?? ''}</Text>
          <StatusPill
            label={user?.role === 'lawyer' ? 'Lawyer' : 'Citizen'}
            icon={user?.role === 'lawyer' ? 'account-tie-outline' : 'account-outline'}
          />
        </View>

        <View style={styles.statsRow}>
          <MetricTile label="Tokens" value={balance} />
          <MetricTile label="Calls" value={user?.role === 'lawyer' ? '-' : '0'} />
          <MetricTile label="Language" value={user?.language_pref?.toUpperCase() ?? 'EN'} />
        </View>

        <LegalCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Display name</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              mode="outlined"
              placeholder="Enter your name"
              value={fullName}
              onChangeText={setFullName}
              maxLength={100}
              outlineColor="#E2E0DA"
              activeOutlineColor="#111111"
              textColor="#111111"
              placeholderTextColor="#8A8A84"
            />
            <PrimaryAction
              onPress={handleSaveName}
              loading={isSaving}
              disabled={isSaving || !fullName.trim() || fullName.trim() === user?.full_name}
              compact
              style={styles.saveButton}
            >
              {saveSuccess ? 'Saved' : 'Save'}
            </PrimaryAction>
          </View>
        </LegalCard>

        <LegalCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <InfoRow label="Phone" value={user?.phone ?? '-'} />
          <Divider style={styles.divider} />
          <InfoRow label="Role" value={user?.role === 'lawyer' ? 'Lawyer' : 'Citizen'} />
          <Divider style={styles.divider} />
          <InfoRow
            label="Language"
            value={LANGUAGES.find((l) => l.code === user?.language_pref)?.label ?? 'English'}
          />
          <Divider style={styles.divider} />
          <InfoRow
            label="Member since"
            value={
              user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : '-'
            }
          />
        </LegalCard>

        <LegalCard style={styles.linksCard}>
          <ActionRow
            icon="shield-check-outline"
            title="Know Your Rights"
            subtitle="Open free rights reference"
            onPress={() => router.push('/rights')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="history"
            title="Transaction History"
            subtitle="Review token movement"
            onPress={() => router.push('/transactions')}
          />
        </LegalCard>

        <DangerAction onPress={handleLogout} icon="logout">Logout</DangerAction>

        <Text style={styles.version}>Vakil On Call v0.1.0</Text>
      </Screen>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E0DA',
    backgroundColor: '#F0EDE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
  },
  name: {
    ...typography.h3,
    color: brandColors.text,
  },
  phone: {
    ...typography.bodySmall,
    color: brandColors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.section,
    color: brandColors.textMuted,
    marginBottom: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  saveButton: {
    minWidth: 82,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  infoValue: {
    ...typography.bodySmall,
    color: brandColors.text,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    backgroundColor: brandColors.border,
  },
  linksCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  version: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
