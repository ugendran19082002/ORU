import { Platform } from 'react-native';

export const thannigoPalette = {
  primary: '#0077B6',
  secondary: '#48CAE4',
  tertiary: '#ADEBF4',
  accent: '#0096C7',
  background: '#F5F9FF',
  surface: '#FFFFFF',
  darkText: '#1A1A2E',
  neutral: '#74777C',
  success: '#27AE60',
  warning: '#E67E22',
  error: '#C0392B',
  customerBlue: '#1565C0',
  shopTeal: '#006878',
  shopTealDark: '#004E5B',
  adminSlate: '#23616B',
  borderSoft: '#E0EAF5',
  infoSoft: '#E8F4FD',
  dangerSoft: '#FFEBEE',
  successSoft: '#E8F5E9',
} as const;

export const roleGradients = {
  customer: { start: '#005D90', end: '#0077B6' },
  shop: { start: '#006878', end: '#008E9B' },
  admin: { start: '#23616B', end: '#2D828F' },
  delivery: { start: '#2e7d32', end: '#388E3C' },
} as const;

export const roleAccent = {
  customer: roleGradients.customer.start,
  shop: roleGradients.shop.start,
  admin: roleGradients.admin.start,
  delivery: roleGradients.delivery.start,
} as const;

export const Colors = {
  light: {
    text: thannigoPalette.darkText,
    background: thannigoPalette.background,
    surface: thannigoPalette.surface,
    tint: thannigoPalette.primary,
    primary: thannigoPalette.primary,
    secondary: thannigoPalette.secondary,
    accent: thannigoPalette.accent,
    icon: thannigoPalette.neutral,
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#005D90',
    success: thannigoPalette.success,
    warning: thannigoPalette.warning,
    error: thannigoPalette.error,
    border: thannigoPalette.borderSoft,
    card: thannigoPalette.surface,
    muted: thannigoPalette.neutral,
  },
  dark: {
    text: '#ECEDEE',
    background: '#0B1220',
    surface: '#111827',
    tint: thannigoPalette.secondary,
    primary: thannigoPalette.secondary,
    secondary: thannigoPalette.tertiary,
    accent: thannigoPalette.accent,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    border: '#1F2937',
    card: '#111827',
    muted: '#9BA1A6',
  },
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 24,
  full: 9999,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
