import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, Icon, Text } from 'react-native-paper';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { EmptyState, LegalCard, ScreenHeader } from '../components/ui';

interface ITransaction {
  id: string;
  type: 'purchase' | 'deduct' | 'refund' | 'promo';
  tokens: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

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
    metadata: { reason: 'Call dropped under 2 min' },
  },
];

function getTransactionIcon(type: ITransaction['type']): string {
  switch (type) {
    case 'purchase':
      return 'arrow-down-circle-outline';
    case 'deduct':
      return 'arrow-up-circle-outline';
    case 'refund':
      return 'refresh-circle';
    case 'promo':
      return 'gift-outline';
    default:
      return 'circle-outline';
  }
}

function getTransactionColor(type: ITransaction['type']): string {
  switch (type) {
    case 'purchase':
    case 'refund':
    case 'promo':
      return brandColors.successLight;
    case 'deduct':
      return brandColors.errorLight;
    default:
      return brandColors.textMuted;
  }
}

function getTransactionLabel(type: ITransaction['type'], metadata: Record<string, unknown>): string {
  switch (type) {
    case 'purchase':
      return `Purchased - ${(metadata.pack_name as string) ?? 'Token Pack'}`;
    case 'deduct':
      return `Consultation - ${(metadata.scenario as string) ?? 'Legal Help'}`;
    case 'refund':
      return `Refund - ${(metadata.reason as string) ?? 'Call issue'}`;
    case 'promo':
      return `Bonus - ${(metadata.reason as string) ?? 'Promotion'}`;
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
      <View style={[styles.txIconBg, { borderColor: color }]}>
        <Icon source={getTransactionIcon(item.type)} color={color} size={20} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{getTransactionLabel(item.type, item.metadata)}</Text>
        <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={[styles.txAmount, { color }]}>
        {isPositive ? '+' : ''}{item.tokens}
      </Text>
    </View>
  );
}

export default function TransactionsScreen(): React.JSX.Element {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  const keyExtractor = useCallback((item: ITransaction) => item.id, []);

  return (
    <>
      <ScreenHeader title="Transactions" subtitle="Token ledger" back />
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandColors.text} />
            <Text style={styles.loadingText}>Loading transactions</Text>
          </View>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="clipboard-text-outline"
            title="No transactions"
            subtitle="Token purchase and usage history will appear here."
          />
        ) : (
          <LegalCard style={styles.listCard}>
            <FlatList
              data={transactions}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={() => <Divider style={styles.divider} />}
              showsVerticalScrollIndicator={false}
            />
          </LegalCard>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
  },
  listCard: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  txIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: brandColors.surface,
  },
  txInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  txLabel: {
    ...typography.bodySmall,
    color: brandColors.text,
    fontWeight: '700',
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
    fontVariant: ['tabular-nums'],
  },
  divider: {
    backgroundColor: brandColors.border,
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
});
