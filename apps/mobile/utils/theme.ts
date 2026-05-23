import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// VakilOnCall brand colors — premium dark legal-tech aesthetic
const brandColors = {
  primary: '#6C63FF',        // Royal indigo — trust, authority
  primaryLight: '#8B83FF',
  primaryDark: '#4F46E5',
  secondary: '#10B981',      // Emerald — safety, growth
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  accent: '#F59E0B',         // Amber — urgency, attention (SOS)
  accentLight: '#FBBF24',
  accentDark: '#D97706',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  surface: '#0F172A',        // Deep navy — professional dark mode
  surfaceLight: '#1E293B',
  surfaceCard: '#1E293B',
  background: '#0A1628',     // Darkest navy — main bg
  backgroundLight: '#F8FAFC',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderLight: '#475569',
  white: '#FFFFFF',
  black: '#000000',
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brandColors.primary,
    primaryContainer: brandColors.primaryDark,
    secondary: brandColors.secondary,
    secondaryContainer: brandColors.secondaryDark,
    tertiary: brandColors.accent,
    tertiaryContainer: brandColors.accentDark,
    surface: brandColors.surface,
    surfaceVariant: brandColors.surfaceLight,
    background: brandColors.background,
    error: brandColors.error,
    errorContainer: brandColors.errorLight,
    onPrimary: brandColors.white,
    onPrimaryContainer: brandColors.white,
    onSecondary: brandColors.white,
    onSecondaryContainer: brandColors.white,
    onSurface: brandColors.text,
    onSurfaceVariant: brandColors.textSecondary,
    onBackground: brandColors.text,
    onError: brandColors.white,
    outline: brandColors.border,
    outlineVariant: brandColors.borderLight,
  },
  roundness: 12,
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    primaryContainer: '#EEF2FF',
    secondary: brandColors.secondary,
    secondaryContainer: '#D1FAE5',
    tertiary: brandColors.accent,
    tertiaryContainer: '#FEF3C7',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    background: '#F8FAFC',
    error: brandColors.error,
    errorContainer: '#FEE2E2',
    onPrimary: brandColors.white,
    onPrimaryContainer: brandColors.primaryDark,
    onSecondary: brandColors.white,
    onSecondaryContainer: brandColors.secondaryDark,
    onSurface: '#0F172A',
    onSurfaceVariant: '#475569',
    onBackground: '#0F172A',
    onError: brandColors.white,
    outline: '#CBD5E1',
    outlineVariant: '#E2E8F0',
  },
  roundness: 12,
};

// Spacing scale (used with StyleSheet)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Typography sizes
export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
} as const;

export { brandColors };
