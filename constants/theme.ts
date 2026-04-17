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
  successDark: '#1B7A42',
  warning: '#E67E22',
  warningDark: '#B85E0E',
  error: '#C0392B',
  errorDark: '#922B21',
  customerBlue: '#1565C0',
  shopTeal: '#006878',
  shopTealDark: '#004E5B',
  adminRed: '#ba1a1a',
  adminRedLight: '#ffdad6',
  deliveryGreen: '#2e7d32',
  deliveryGreenLight: '#E8F5E9',
  staffOrange: '#E65100',
  staffOrangeLight: '#FBE9E7',
  borderSoft: '#E0EAF5',
  infoSoft: '#E8F4FD',
  dangerSoft: '#FFEBEE',
  successSoft: '#E8F5E9',
  // Dark mode palette companions
  darkBg: '#0B1220',
  darkSurface: '#111827',
  darkBorder: '#1F2937',
  darkMuted: '#9BA1A6',
} as const;

export const roleGradients = {
  customer: { start: '#005D90', end: '#0077B6' },
  shop_owner: { start: '#006878', end: '#008E9B' },
  admin: { start: '#ba1a1a', end: '#e32424' },
  delivery: { start: '#2e7d32', end: '#388E3C' },
  staff: { start: '#E65100', end: '#F57C00' },
  guest: { start: '#707881', end: '#94A3B8' },
} as const;

export const roleAccent = {
  customer: roleGradients.customer.start,
  shop_owner: roleGradients.shop_owner.start,
  admin: roleGradients.admin.start,
  delivery: roleGradients.delivery.start,
  staff: roleGradients.staff.start,
  guest: roleGradients.guest.start,
} as const;

/** Role-specific soft background tints */
export const roleSurface = {
  customer: '#E8F0FA',
  shop_owner: '#E0F2F4',
  admin: '#FFDAD6',
  delivery: '#E8F5E9',
  staff: '#FBE9E7',
  guest: '#F1F3F5',
} as const;

/** Role display labels */
export const roleLabel = {
  customer: 'Customer',
  shop_owner: 'Shop Owner',
  admin: 'Administrator',
  delivery: 'Delivery Agent',
  staff: 'Shop Staff',
  guest: 'Guest',
} as const;

/**
 * Returns platform shadows that work in both light and dark mode.
 * Pass `isDark` from useAppTheme() to get the right shadow color.
 */
export const makeShadow = (isDark: boolean) => ({
  none: {},
  xs: { shadowColor: isDark ? '#000' : '#003a5c', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.3 : 0.04, shadowRadius: 4, elevation: 1 },
  sm: { shadowColor: isDark ? '#000' : '#003a5c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.4 : 0.06, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: isDark ? '#000' : '#003a5c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.5 : 0.08, shadowRadius: 16, elevation: 4 },
  lg: { shadowColor: isDark ? '#000' : '#003a5c', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.6 : 0.10, shadowRadius: 24, elevation: 6 },
  hero: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.5 : 0.18, shadowRadius: 20, elevation: 6 },
});

/** Standard shadow definitions — use these instead of ad-hoc elevation/shadowOpacity values */
export const Shadow = {
  none: {},
  xs: {
    shadowColor: '#003a5c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#003a5c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#003a5c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#003a5c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
  /** Hero card shadow — colored by role accent usage */
  hero: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

/** Standard typography scale — H1: 32, H2: 24, Body: 16, Caption: 12 */
export const Typography = {
  h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.8, lineHeight: 38 },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 26 },
  h4: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  overline: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1, lineHeight: 14 },
} as const;

export const Colors = {
  light: {
    text: thannigoPalette.darkText,
    background: thannigoPalette.background,
    surface: thannigoPalette.surface,
    surfaceElevated: '#FFFFFF',
    tint: thannigoPalette.primary,
    primary: thannigoPalette.primary,
    secondary: thannigoPalette.secondary,
    accent: thannigoPalette.accent,
    icon: thannigoPalette.neutral,
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#005D90',
    success: thannigoPalette.success,
    successSoft: thannigoPalette.successSoft,
    warning: thannigoPalette.warning,
    error: thannigoPalette.error,
    border: thannigoPalette.borderSoft,
    card: thannigoPalette.surface,
    muted: thannigoPalette.neutral,
    inputBg: '#EEF3FB',
    placeholder: '#9BA1A6',
    divider: '#E0EAF5',
    overlay: 'rgba(0,40,80,0.45)',
    // Role soft tints — light mode
    customerSoft: '#E8F0FA',
    shopSoft: '#E0F2F4',
    adminSoft: '#FFDAD6',
    deliverySoft: '#E8F5E9',
    staffSoft: '#FBE9E7',
  },
  dark: {
    text: '#ECEDEE',
    background: thannigoPalette.darkBg,
    surface: thannigoPalette.darkSurface,
    surfaceElevated: '#1A2332',
    tint: thannigoPalette.secondary,
    primary: thannigoPalette.secondary,
    secondary: thannigoPalette.tertiary,
    accent: thannigoPalette.accent,
    icon: thannigoPalette.darkMuted,
    tabIconDefault: thannigoPalette.darkMuted,
    tabIconSelected: '#FFFFFF',
    success: '#4ADE80',
    successSoft: '#052e16',
    warning: '#FBBF24',
    error: '#F87171',
    border: thannigoPalette.darkBorder,
    card: thannigoPalette.darkSurface,
    muted: thannigoPalette.darkMuted,
    inputBg: '#1A2332',
    placeholder: '#6B7280',
    divider: '#1F2937',
    overlay: 'rgba(0,0,0,0.7)',
    // Role soft tints — dark mode (muted so they don't glare)
    customerSoft: '#0A1929',
    shopSoft: '#071A1E',
    adminSoft: '#2D0A0A',
    deliverySoft: '#071A0A',
    staffSoft: '#1F0D00',
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
  xl: 24,
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
