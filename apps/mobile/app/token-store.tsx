import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, Surface, IconButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTokenStore } from '../stores/tokenStore';
import { useAuthStore } from '../stores/authStore';
import { TOKEN_PACKS } from '@vakiloncall/shared';
import { api } from '../services/api';
import { brandColors, spacing, typography } from '../utils/theme';

export default function TokenStoreScreen(): React.JSX.Element {
  const router = useRouter();
  const balance = useTokenStore((s) => s.balance);
  const incrementBalance = useTokenStore((s) => s.incrementBalance);
  const user = useAuthStore((s) => s.user);

  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(1); // Default to "Basic" (Most Popular)
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePurchase = useCallback(async (): Promise<void> => {
    setError('');
    setSuccess('');
    setIsPurchasing(true);

    try {
      // For now, simulate the Razorpay flow since the SDK needs native setup.
      // In production, this will:
      // 1. Call api.createTokenOrder(pack_id) to get a Razorpay order
      // 2. Open Razorpay checkout
      // 3. Call api.verifyPayment() with the Razorpay response
      // 4. Update local token balance

      const selectedPack = TOKEN_PACKS[selectedPackIndex];
      if (!selectedPack) {
        setError('Please select a token pack');
        return;
      }

      // Step 1: Create order on backend
      const orderResult = await api.createTokenOrder('placeholder-pack-id');

      if (!orderResult.success) {
        // In dev mode without Razorpay keys, show a helpful message
        setError(
          'Payment gateway not configured yet. ' +
          'Add your Razorpay keys to the backend .env file to enable purchases.'
        );
        return;
      }

      // Step 2: In production, open Razorpay checkout here
      // Step 3: Verify payment
      // Step 4: Update balance
      setSuccess(`${selectedPack.tokens} tokens added to your account!`);
      incrementBalance(selectedPack.tokens);
    } catch {
      setError('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }, [selectedPackIndex, incrementBalance]);

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
        <Text style={styles.headerTitle}>Token Store</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance */}
        <Surface style={styles.balanceCard} elevation={2}>
          <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceValue}>{balance}</Text>
            <Text style={styles.balanceUnit}>
              token{balance !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.balanceSub}>
            Each token = 1 legal consultation (up to 15 min)
          </Text>
        </Surface>

        {/* Token Packs */}
        <Text style={styles.sectionTitle}>Choose a Token Pack</Text>

        {TOKEN_PACKS.map((pack, index) => {
          const isSelected = selectedPackIndex === index;
          const savings =
            index > 0
              ? Math.round(
                  ((TOKEN_PACKS[0]!.per_token_inr - pack.per_token_inr) /
                    TOKEN_PACKS[0]!.per_token_inr) *
                    100
                )
              : 0;

          return (
            <Pressable
              key={pack.name}
              onPress={() => setSelectedPackIndex(index)}
            >
              <Surface
                style={[
                  styles.packCard,
                  isSelected && styles.packCardSelected,
                  pack.badge === 'Most Popular' && styles.packCardPopular,
                ]}
                elevation={isSelected ? 3 : 1}
              >
                {/* Badge */}
                {pack.badge ? (
                  <View
                    style={[
                      styles.badge,
                      pack.badge === 'Most Popular'
                        ? styles.badgePopular
                        : styles.badgeBest,
                    ]}
                  >
                    <Text style={styles.badgeText}>{pack.badge}</Text>
                  </View>
                ) : null}

                <View style={styles.packContent}>
                  {/* Left: Pack Info */}
                  <View style={styles.packInfo}>
                    <Text style={styles.packName}>{pack.name}</Text>
                    <Text style={styles.packTokens}>
                      {pack.tokens} token{pack.tokens !== 1 ? 's' : ''}
                    </Text>
                    {savings > 0 ? (
                      <Text style={styles.packSavings}>
                        Save {savings}% per token
                      </Text>
                    ) : null}
                  </View>

                  {/* Right: Price */}
                  <View style={styles.packPricing}>
                    <Text style={styles.packPrice}>₹{pack.price_inr}</Text>
                    <Text style={styles.packPerToken}>
                      ₹{pack.per_token_inr.toFixed(0)}/token
                    </Text>
                  </View>

                  {/* Selection Indicator */}
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected ? (
                      <View style={styles.radioInner} />
                    ) : null}
                  </View>
                </View>
              </Surface>
            </Pressable>
          );
        })}

        {/* Error / Success Messages */}
        {error ? (
          <Surface style={styles.messageCard} elevation={1}>
            <Text style={styles.errorText}>{error}</Text>
          </Surface>
        ) : null}
        {success ? (
          <Surface style={styles.successCard} elevation={1}>
            <Text style={styles.successText}>{success}</Text>
          </Surface>
        ) : null}

        {/* Buy Button */}
        <Button
          mode="contained"
          onPress={handlePurchase}
          loading={isPurchasing}
          disabled={isPurchasing}
          style={styles.buyButton}
          labelStyle={styles.buyButtonLabel}
          contentStyle={styles.buyButtonContent}
          icon="credit-card"
        >
          {isPurchasing
            ? 'Processing...'
            : `Pay ₹${TOKEN_PACKS[selectedPackIndex]?.price_inr ?? 0}`}
        </Button>

        <Text style={styles.paymentNote}>
          Secure payment via Razorpay. UPI, Credit/Debit Cards, Wallets accepted.
        </Text>

        {/* Transaction History Link */}
        <Button
          mode="text"
          onPress={() => router.push('/transactions')}
          textColor={brandColors.textSecondary}
          style={styles.historyButton}
          icon="history"
        >
          View Transaction History
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
  balanceCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  balanceLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  balanceValue: {
    fontSize: 56,
    fontWeight: '700',
    color: brandColors.primary,
  },
  balanceUnit: {
    ...typography.h3,
    color: brandColors.textSecondary,
  },
  balanceSub: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: brandColors.white,
    marginBottom: spacing.md,
  },
  packCard: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  packCardSelected: {
    borderColor: brandColors.primary,
  },
  packCardPopular: {
    borderColor: brandColors.secondary,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: 10,
  },
  badgePopular: {
    backgroundColor: brandColors.secondary,
  },
  badgeBest: {
    backgroundColor: brandColors.accent,
  },
  badgeText: {
    ...typography.caption,
    color: brandColors.white,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packInfo: {
    flex: 1,
  },
  packName: {
    ...typography.body,
    color: brandColors.white,
    fontWeight: '600',
  },
  packTokens: {
    ...typography.caption,
    color: brandColors.textSecondary,
    marginTop: 2,
  },
  packSavings: {
    ...typography.caption,
    color: brandColors.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  packPricing: {
    alignItems: 'flex-end',
    marginRight: spacing.md,
  },
  packPrice: {
    ...typography.h3,
    color: brandColors.white,
  },
  packPerToken: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: brandColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: brandColors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: brandColors.primary,
  },
  messageCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: brandColors.error,
  },
  errorText: {
    ...typography.bodySmall,
    color: brandColors.errorLight,
  },
  successCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: brandColors.secondary,
  },
  successText: {
    ...typography.bodySmall,
    color: brandColors.secondaryLight,
  },
  buyButton: {
    borderRadius: 14,
    marginTop: spacing.sm,
  },
  buyButtonLabel: {
    ...typography.button,
    color: brandColors.white,
  },
  buyButtonContent: {
    paddingVertical: spacing.sm,
  },
  paymentNote: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  historyButton: {
    marginTop: spacing.lg,
  },
});
