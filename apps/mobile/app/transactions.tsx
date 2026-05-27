import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { brandColors, spacing, typography } from '../utils/theme';

interface ITransaction {
  id: string;
  type: 'purchase' | 'deduct' | 'refund' | 'promo';
  tokens: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

// Mock data for development (will be replaced with API call)
const MOCK_TRANSACTIONS: ITransaction[] = [
  {
    id: '1',
    type: 'purchase',
    tokens: 3,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { pack_name: 'Basic', amount_inr: 149 },
  },
  {
    id: '2',
    type: 'deduct',
    tokens: -1,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    metadata: { scenario: 'Traffic Stop', duration_sec: 420 },
  },
  {
    id: '3',
    type: 'purchase',
    tokens: 7,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { pack_name: 'Standard', amount_inr: 299 },
  },
  {
    id: '4',
    type: 'refund',
    tokens: 1,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { reason: 'Call dropped < 2 min' },
  },
  {
    id: '5',
    type: 'promo',
    tokens: 2,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { reason: 'Welcome bonus' },
  },
];

function getTransactionIcon(type: ITransaction['type']): string {
  switch (type) {
    case 'purchase':
      return 'arrow-down-circle';
    case 'deduct':
      return 'arrow-up-circle';
    case 'refund':
      return 'refresh-circle';
    case 'promo':
      return 'gift';
    default:
      return 'circle';
  }
}

function getTransactionColor(type: ITransaction['type']): string {
  switch (type) {
    case 'purchase':
      return brandColors.secondary;
    case 'deduct':
      return brandColors.error;
    case 'refund':
      return brandColors.info;
    case 'promo':
      return brandColors.accent;
    default:
      return brandColors.textMuted;
  }
}

function getTransactionLabel(type: ITransaction['type'], metadata: Record<string, unknown>): string {
  switch (type) {
    case 'purchase':
      return `Purchased — ${(metadata.pack_name as string) ?? 'Token Pack'}`;
    case 'deduct':
      return `Consultation — ${(metadata.scenario as string) ?? 'Legal Help'}`;
    case 'refund':
      return `Refund — ${(metadata.reason as string) ?? 'Call issue'}`;
    case 'promo':
      return `Bonus — ${(metadata.reason as string) ?? 'Promotion'}`;
    default:
      return 'Transaction';
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TransactionItem({ item }: { item: ITransaction }): React.JSX.Element {
  const color = getTransactionColor(item.type);
  const isPositive = item.tokens > 0;

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIconBg, { backgroundColor: `${color}20` }]}>
        <IconButton
          icon={getTransactionIcon(item.type)}
          iconColor={color}
          size={20}
          style={styles.txIcon}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>
          {getTransactionLabel(item.type, item.metadata)}
        </Text>
        <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={[styles.txAmount, { color }]}>
        {isPositive ? '+' : ''}{item.tokens}
      </Text>
    </View>
  );
}

export default function TransactionsScreen(): React.JSX.Element {
  const router = useRouter();
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with api.getCallHistory() or a dedicated transactions endpoint
    const timer = setTimeout(() => {
      setTransactions(MOCK_TRANSACTIONS);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ITransaction }) => <TransactionItem item={item} />,
    []
  );

  const keyExtractor = useCallback(
    (item: ITransaction) => item.id,
    []
  );

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
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your token purchase and usage history will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <Divider style={styles.divider} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  txIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIcon: {
    margin: 0,
  },
  txInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  txLabel: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '500',
  },
  txDate: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  divider: {
    backgroundColor: brandColors.border,
    opacity: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: brandColors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: brandColors.textMuted,
    textAlign: 'center',
  },
});
