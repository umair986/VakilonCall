import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Button,
  TextInput,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useTokenStore } from '../stores/tokenStore';
import { api } from '../services/api';
import { disconnectSocket } from '../services/socket';
import { LANGUAGES } from '@vakiloncall/shared';
import { brandColors, spacing, typography } from '../utils/theme';

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const balance = useTokenStore((s) => s.balance);

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
    } catch {
      // Silently fail for now
    } finally {
      setIsSaving(false);
    }
  }, [fullName, user, setUser]);

  const handleLogout = useCallback((): void => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
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
      ]
    );
  }, [logout, router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={brandColors.text}
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar & Phone */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.full_name ?? user?.phone ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.phone}>{user?.phone ?? ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'lawyer' ? '⚖️ Lawyer' : '👤 User'}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statValue}>{balance}</Text>
            <Text style={styles.statLabel}>Tokens</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statValue}>
              {user?.role === 'lawyer' ? '—' : '0'}
            </Text>
            <Text style={styles.statLabel}>Calls</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statValue}>
              {user?.language_pref?.toUpperCase() ?? 'EN'}
            </Text>
            <Text style={styles.statLabel}>Language</Text>
          </Surface>
        </View>

        {/* Edit Name */}
        <Surface style={styles.sectionCard} elevation={1}>
          <Text style={styles.sectionTitle}>Display Name</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              mode="outlined"
              placeholder="Enter your name"
              value={fullName}
              onChangeText={setFullName}
              maxLength={100}
              outlineColor={brandColors.border}
              activeOutlineColor={brandColors.primary}
              textColor={brandColors.text}
              placeholderTextColor={brandColors.textMuted}
            />
            <Button
              mode="contained"
              onPress={handleSaveName}
              loading={isSaving}
              disabled={isSaving || !fullName.trim() || fullName.trim() === user?.full_name}
              compact
              style={styles.saveButton}
            >
              {saveSuccess ? '✓' : 'Save'}
            </Button>
          </View>
        </Surface>

        {/* Account Info */}
        <Surface style={styles.sectionCard} elevation={1}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone ?? '—'}</Text>
          </View>
          <Divider style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>
              {user?.role === 'lawyer' ? 'Lawyer' : 'User'}
            </Text>
          </View>
          <Divider style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Language</Text>
            <Text style={styles.infoValue}>
              {LANGUAGES.find((l) => l.code === user?.language_pref)?.label ?? 'English'}
            </Text>
          </View>
          <Divider style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </Text>
          </View>
        </Surface>

        {/* Quick Links */}
        <Surface style={styles.sectionCard} elevation={1}>
          <Button
            mode="text"
            icon="shield-check"
            onPress={() => router.push('/rights')}
            textColor={brandColors.secondary}
            contentStyle={styles.linkContent}
            style={styles.linkButton}
          >
            Know Your Rights
          </Button>
          <Divider style={styles.infoDivider} />
          <Button
            mode="text"
            icon="history"
            onPress={() => router.push('/transactions')}
            textColor={brandColors.textSecondary}
            contentStyle={styles.linkContent}
            style={styles.linkButton}
          >
            Transaction History
          </Button>
        </Surface>

        {/* Logout */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          textColor={brandColors.error}
          style={styles.logoutButton}
          icon="logout"
        >
          Logout
        </Button>

        {/* Version */}
        <Text style={styles.version}>VakilOnCall v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
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
    color: brandColors.white,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: brandColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: brandColors.white,
  },
  phone: {
    ...typography.body,
    color: brandColors.textSecondary,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  roleText: {
    ...typography.caption,
    color: brandColors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: brandColors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: brandColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: brandColors.surface,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: brandColors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '500',
  },
  infoDivider: {
    backgroundColor: brandColors.border,
    opacity: 0.2,
  },
  linkContent: {
    justifyContent: 'flex-start',
  },
  linkButton: {
    paddingVertical: spacing.xs,
  },
  logoutButton: {
    borderRadius: 12,
    borderColor: brandColors.error,
    marginTop: spacing.md,
  },
  version: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
