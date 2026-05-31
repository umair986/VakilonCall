import React, { useState, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTokenStore } from '../stores/tokenStore';
import { TOKEN_PACKS } from '@vakiloncall/shared';
import { api } from '../services/api';
import { brandColors, radius, spacing, typography } from '../utils/theme';
import { ActionRow, LegalCard, PrimaryAction, Screen, ScreenHeader, StatusPill } from '../components/ui';

export default function TokenStoreScreen(): React.JSX.Element {
  const router = useRouter();
  const balance = useTokenStore((s) => s.balance);
  const setBalance = useTokenStore((s) => s.setBalance);
  const incrementBalance = useTokenStore((s) => s.incrementBalance);

  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const res = await api.getTokenBalance();
        if (res.success && res.data && typeof res.data.token_balance === 'number' && isMounted) {
          setBalance(res.data.token_balance);
        }
      } catch (err) {
        console.error('Failed to fetch token balance in store:', err);
      }
    };
    fetchBalance();
    return () => {
      isMounted = false;
    };
  }, [setBalance]);

  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePurchase = useCallback(async (): Promise<void> => {
    setError('');
    setSuccess('');
    setIsPurchasing(true);

    try {
      const selectedPack = TOKEN_PACKS[selectedPackIndex];
      if (!selectedPack) {
        setError('Please select a token pack.');
        return;
      }

      const orderResult = await api.createTokenOrder('placeholder-pack-id');
      if (!orderResult.success) {
        setError('Payment gateway is not configured yet. Add Razorpay keys to enable purchases.');
        return;
      }

      setSuccess(`${selectedPack.tokens} tokens added to your account.`);
      incrementBalance(selectedPack.tokens);
    } catch {
      setError('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }, [selectedPackIndex, incrementBalance]);

  const selectedPack = TOKEN_PACKS[selectedPackIndex];

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

        <View style={styles.packList}>
          {TOKEN_PACKS.map((pack, index) => {
            const isSelected = selectedPackIndex === index;
            const savings =
              index > 0
                ? Math.round(((TOKEN_PACKS[0]!.per_token_inr - pack.per_token_inr) / TOKEN_PACKS[0]!.per_token_inr) * 100)
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
