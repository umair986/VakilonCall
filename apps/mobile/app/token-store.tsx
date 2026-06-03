import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTokenStore } from '../stores/tokenStore';
import { TOKEN_PACKS } from '@vakiloncall/shared';
import { api } from '../services/api';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { ActionRow, LegalCard, PrimaryAction, Screen, ScreenHeader, StatusPill } from '../components/ui';

type TokenPackView = {
  id?: string;
  name: string;
  tokens: number;
  price_inr: number;
  per_token_inr: number;
  badge?: string | null;
};

export default function TokenStoreScreen(): React.JSX.Element {
  const router = useRouter();
  const balance = useTokenStore((s) => s.balance);
  const setBalance = useTokenStore((s) => s.setBalance);
  const fallbackPacks = useMemo<TokenPackView[]>(
    () =>
      TOKEN_PACKS.map((pack) => ({
        name: pack.name,
        tokens: pack.tokens,
        price_inr: pack.price_inr,
        per_token_inr: pack.per_token_inr,
        badge: pack.badge,
      })),
    []
  );

  const [packs, setPacks] = useState<TokenPackView[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const displayPacks = packs.length > 0 ? packs : fallbackPacks;

  useEffect(() => {
    setSelectedPackIndex((prev) =>
      displayPacks.length === 0 ? 0 : Math.min(prev, displayPacks.length - 1)
    );
  }, [displayPacks.length]);

  useEffect(() => {
    let isMounted = true;
    const fetchStoreData = async () => {
      try {
        const [packsResult, balanceResult] = await Promise.all([
          api.getTokenPacks(),
          api.getTokenBalance(),
        ]);

        if (!isMounted) return;

        if (packsResult.success) {
          setPacks(
            packsResult.data.map((pack) => ({
              ...pack,
              per_token_inr: pack.price_inr / pack.tokens,
            }))
          );
        }

        if (balanceResult.success && typeof balanceResult.data.token_balance === 'number') {
          setBalance(balanceResult.data.token_balance);
        }
      } catch (err) {
        console.error('Failed to fetch token store data:', err);
      } finally {
        if (isMounted) {
          setIsLoadingPacks(false);
        }
      }
    };
    fetchStoreData();
    return () => {
      isMounted = false;
    };
  }, [setBalance]);

  const handlePurchase = useCallback(async (): Promise<void> => {
    setError('');
    setSuccess('');
    setPendingOrderId(null);
    setIsPurchasing(true);

    try {
      const selectedPack = displayPacks[selectedPackIndex];
      if (!selectedPack) {
        setError('Please select a token pack.');
        return;
      }

      if (!selectedPack.id) {
        setError('Token packs are not available yet. Please try again later.');
        return;
      }

      const orderResult = await api.createTokenOrder(selectedPack.id);
      if (!orderResult.success) {
        setError(orderResult.error.message);
        return;
      }

      setPendingOrderId(orderResult.data.order_id);
      setSuccess(
        `Order created for ${selectedPack.tokens} tokens. Complete payment in Razorpay to finish.`
      );
    } catch {
      setError('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }, [selectedPackIndex, displayPacks]);

  const selectedPack = displayPacks[selectedPackIndex];

  return (
    <>
      <ScreenHeader title="Token Store" subtitle="Consultation balance" back />
      <Screen scroll>
        <LegalCard style={styles.balanceCard}>
          <Text style={styles.sectionLabel}>Current balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceValue}>{balance}</Text>
            <Text style={styles.balanceUnit}>token{balance !== 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.balanceSub}>Each token covers one legal consultation up to 15 minutes.</Text>
        </LegalCard>

        <Text style={styles.sectionTitle}>Choose a pack</Text>

        {isLoadingPacks ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={brandColors.text} />
            <Text style={styles.loadingText}>Loading token packs...</Text>
          </View>
        ) : null}

        <View style={styles.packList}>
          {displayPacks.map((pack, index) => {
            const isSelected = selectedPackIndex === index;
            const basePerToken = displayPacks[0]?.per_token_inr ?? 0;
            const savings =
              index > 0 && basePerToken > 0
                ? Math.round(((basePerToken - pack.per_token_inr) / basePerToken) * 100)
                : 0;

            return (
              <Pressable key={pack.name} onPress={() => setSelectedPackIndex(index)}>
                <LegalCard style={[styles.packCard, isSelected && styles.packSelected]}>
                  <View style={styles.packContent}>
                    <View style={styles.radioOuter}>
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.packInfo}>
                      <View style={styles.packNameRow}>
                        <Text style={styles.packName}>{pack.name}</Text>
                        {pack.badge ? <StatusPill label={pack.badge} /> : null}
                      </View>
                      <Text style={styles.packTokens}>
                        {pack.tokens} token{pack.tokens !== 1 ? 's' : ''}
                        {savings > 0 ? ` | Save ${savings}% per token` : ''}
                      </Text>
                    </View>
                    <View style={styles.packPricing}>
                      <Text style={styles.packPrice}>Rs {pack.price_inr}</Text>
                      <Text style={styles.packPerToken}>Rs {pack.per_token_inr.toFixed(0)}/token</Text>
                    </View>
                  </View>
                </LegalCard>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <LegalCard variant="danger" style={styles.messageCard}>
            <Text style={styles.messageText}>{error}</Text>
          </LegalCard>
        ) : null}
        {success ? (
          <LegalCard variant="notice" style={styles.messageCard}>
            <Text style={styles.messageText}>{success}</Text>
          </LegalCard>
        ) : null}
        {pendingOrderId ? (
          <LegalCard style={styles.messageCard}>
            <Text style={styles.messageText}>Order ID: {pendingOrderId}</Text>
          </LegalCard>
        ) : null}

        <PrimaryAction
          onPress={handlePurchase}
          loading={isPurchasing}
          disabled={isPurchasing}
          icon="credit-card-outline"
        >
          {isPurchasing ? 'Processing' : `Pay Rs ${selectedPack?.price_inr ?? 0}`}
        </PrimaryAction>

        <Text style={styles.paymentNote}>Secure payment via Razorpay. UPI, cards, and wallets supported.</Text>

        <LegalCard style={styles.historyCard}>
          <ActionRow
            icon="history"
            title="Transaction History"
            subtitle="Review token purchases, deductions, and refunds"
            onPress={() => router.push('/transactions')}
          />
        </LegalCard>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.section,
    color: brandColors.textMuted,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  balanceValue: {
    fontSize: 52,
    fontWeight: '700',
    color: brandColors.text,
    fontVariant: ['tabular-nums'],
  },
  balanceUnit: {
    ...typography.h3,
    color: brandColors.textSecondary,
  },
  balanceSub: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.section,
    color: brandColors.textMuted,
    marginBottom: spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  packList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  packCard: {
    padding: spacing.md,
  },
  packSelected: {
    borderColor: brandColors.text,
    backgroundColor: brandColors.surfaceElevated,
  },
  packContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: brandColors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: brandColors.text,
  },
  packInfo: {
    flex: 1,
  },
  packNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  packName: {
    ...typography.body,
    color: brandColors.text,
    fontWeight: '700',
  },
  packTokens: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 3,
  },
  packPricing: {
    alignItems: 'flex-end',
  },
  packPrice: {
    ...typography.h3,
    color: brandColors.text,
  },
  packPerToken: {
    ...typography.caption,
    color: brandColors.textMuted,
  },
  messageCard: {
    marginBottom: spacing.md,
  },
  messageText: {
    ...typography.bodySmall,
    color: brandColors.textSecondary,
  },
  paymentNote: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  historyCard: {
    paddingVertical: spacing.sm,
  },
});
