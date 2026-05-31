import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Button,
  Icon,
  IconButton,
  Surface,
  Text,
  type ButtonProps,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { brandColors, radius, spacing, typography } from '../utils/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  centered?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  scroll = false,
  centered = false,
  contentStyle,
}: ScreenProps): React.JSX.Element {
  if (scroll) {
    return (
      <SafeAreaView style={uiStyles.screen}>
        <ScrollView
          contentContainerStyle={[uiStyles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={uiStyles.screen}>
      <View style={[uiStyles.content, centered && uiStyles.centered, contentStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  rightAction,
}: ScreenHeaderProps): React.JSX.Element {
  const router = useRouter();

  return (
    <View style={uiStyles.header}>
      <View style={uiStyles.headerSide}>
        {back ? (
          <IconButton
            icon="arrow-left"
            iconColor={brandColors.text}
            size={22}
            onPress={() => router.back()}
            style={uiStyles.headerIcon}
          />
        ) : null}
      </View>
      <View style={uiStyles.headerCenter}>
        <Text style={uiStyles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={uiStyles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={uiStyles.headerSide}>{rightAction}</View>
    </View>
  );
}

type LegalCardVariant = 'default' | 'outlined' | 'notice' | 'danger';

interface LegalCardProps {
  children: React.ReactNode;
  variant?: LegalCardVariant;
  style?: StyleProp<ViewStyle>;
}

export function LegalCard({
  children,
  variant = 'default',
  style,
}: LegalCardProps): React.JSX.Element {
  return (
    <Surface style={[uiStyles.card, uiStyles[`${variant}Card`], style]} elevation={0}>
      {children}
    </Surface>
  );
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger';

interface StatusPillProps {
  label: string;
  tone?: Tone;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatusPill({
  label,
  tone = 'neutral',
  icon,
  style,
}: StatusPillProps): React.JSX.Element {
  const color = toneColors[tone];
  return (
    <View style={[uiStyles.pill, { borderColor: color }, style]}>
      {icon ? <Icon source={icon} size={13} color={color} /> : null}
      <Text style={[uiStyles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

interface MetricTileProps {
  label: string;
  value: string | number;
  supportingText?: string;
  style?: StyleProp<ViewStyle>;
}

export function MetricTile({
  label,
  value,
  supportingText,
  style,
}: MetricTileProps): React.JSX.Element {
  return (
    <LegalCard variant="outlined" style={[uiStyles.metricTile, style]}>
      <Text style={uiStyles.metricValue}>{value}</Text>
      <Text style={uiStyles.metricLabel}>{label}</Text>
      {supportingText ? <Text style={uiStyles.metricSupport}>{supportingText}</Text> : null}
    </LegalCard>
  );
}

interface ActionRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  tone?: Tone;
}

export function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  tone = 'neutral',
}: ActionRowProps): React.JSX.Element {
  const color = toneColors[tone];
  return (
    <Button
      mode="text"
      onPress={onPress}
      disabled={!onPress}
      contentStyle={uiStyles.actionRowContent}
      style={uiStyles.actionRow}
      textColor={brandColors.text}
    >
      <View style={uiStyles.actionRowInner}>
        <View style={[uiStyles.actionIcon, { borderColor: color }]}>
          <Icon source={icon} color={color} size={20} />
        </View>
        <View style={uiStyles.actionCopy}>
          <Text style={uiStyles.actionTitle}>{title}</Text>
          {subtitle ? <Text style={uiStyles.actionSubtitle}>{subtitle}</Text> : null}
        </View>
        {right ?? <Icon source="chevron-right" color={brandColors.textMuted} size={20} />}
      </View>
    </Button>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={uiStyles.empty}>
      <View style={uiStyles.emptyIcon}>
        <Icon source={icon} color={brandColors.text} size={34} />
      </View>
      <Text style={uiStyles.emptyTitle}>{title}</Text>
      <Text style={uiStyles.emptySubtitle}>{subtitle}</Text>
      {action ? <View style={uiStyles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function PrimaryAction(props: ButtonProps): React.JSX.Element {
  return (
    <Button
      mode="contained"
      {...props}
      buttonColor={brandColors.text}
      textColor={brandColors.black}
      style={[uiStyles.primaryAction, props.style]}
      labelStyle={[uiStyles.actionLabel, props.labelStyle]}
      contentStyle={[uiStyles.actionContent, props.contentStyle]}
    />
  );
}

export function DangerAction(props: ButtonProps): React.JSX.Element {
  return (
    <Button
      mode="outlined"
      {...props}
      textColor={brandColors.errorLight}
      style={[uiStyles.dangerAction, props.style]}
      labelStyle={[uiStyles.actionLabel, props.labelStyle]}
      contentStyle={[uiStyles.actionContent, props.contentStyle]}
    />
  );
}

const toneColors: Record<Tone, string> = {
  neutral: brandColors.textSecondary,
  success: brandColors.successLight,
  warning: brandColors.warning,
  danger: brandColors.errorLight,
};

const uiStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  centered: {
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brandColors.border,
  },
  headerSide: {
    width: 54,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    margin: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: brandColors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.caption,
    color: brandColors.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  card: {
    backgroundColor: brandColors.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.border,
    padding: spacing.lg,
  },
  defaultCard: {},
  outlinedCard: {
    backgroundColor: brandColors.surface,
  },
  noticeCard: {
    backgroundColor: brandColors.surface,
    borderLeftWidth: 3,
    borderLeftColor: brandColors.textSecondary,
  },
  dangerCard: {
    backgroundColor: '#170B0A',
    borderLeftWidth: 3,
    borderLeftColor: brandColors.error,
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pillText: {
    ...typography.caption,
    fontWeight: '700',
  },
  metricTile: {
    flex: 1,
    minHeight: 88,
    justifyContent: 'center',
    padding: spacing.md,
  },
  metricValue: {
    ...typography.h2,
    color: brandColors.text,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 3,
  },
  metricSupport: {
    ...typography.caption,
    color: brandColors.textSecondary,
    marginTop: 3,
  },
  actionRow: {
    borderRadius: radius.md,
    marginVertical: 0,
  },
  actionRowContent: {
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
  },
  actionRowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.surface,
  },
  actionCopy: {
    flex: 1,
    alignItems: 'flex-start',
  },
  actionTitle: {
    ...typography.bodySmall,
    color: brandColors.text,
    fontWeight: '700',
  },
  actionSubtitle: {
    ...typography.caption,
    color: brandColors.textMuted,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: brandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    backgroundColor: brandColors.surface,
  },
  emptyTitle: {
    ...typography.h3,
    color: brandColors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: brandColors.textMuted,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
  primaryAction: {
    borderRadius: radius.md,
  },
  dangerAction: {
    borderRadius: radius.md,
    borderColor: brandColors.error,
  },
  actionLabel: {
    ...typography.button,
  },
  actionContent: {
    minHeight: 48,
  },
});
