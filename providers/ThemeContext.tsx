import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

const THEME_STORAGE_KEY = 'thannigo_theme_preference_v1';

export type ThemePreference = 'system' | 'light' | 'dark';

export type ColorSchemeColors = {
  text: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  tint: string;
  primary: string;
  secondary: string;
  accent: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  success: string;
  successSoft: string;
  warning: string;
  error: string;
  border: string;
  card: string;
  muted: string;
  inputBg: string;
  placeholder: string;
  divider: string;
  overlay: string;
  customerSoft: string;
  shopSoft: string;
  adminSoft: string;
  deliverySoft: string;
  staffSoft: string;
};

interface ThemeContextValue {
  colors: ColorSchemeColors;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: Colors.light,
  isDark: false,
  colorScheme: 'light',
  themePreference: 'light',
  setThemePreference: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('light');
  const [hydrated, setHydrated] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setPreference(val);
      }
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setPreference(pref);
    AsyncStorage.setItem(THEME_STORAGE_KEY, pref).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const resolvedScheme: 'light' | 'dark' = useMemo(() => {
    if (preference === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
    return preference;
  }, [preference, systemScheme]);

  const isDark = resolvedScheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? Colors.dark : Colors.light,
      isDark,
      colorScheme: resolvedScheme,
      themePreference: preference,
      setThemePreference,
      toggleTheme,
    }),
    [isDark, resolvedScheme, preference, setThemePreference, toggleTheme],
  );

  // Don't flash wrong theme before hydration
  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
