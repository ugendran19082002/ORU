import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { useSecurityStore } from '@/stores/securityStore';
import { Shadow, roleAccent, roleSurface, Radius } from '@/constants/theme';
import { useAppTheme, ThemePreference } from '@/providers/ThemeContext';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { colors, isDark, themePreference, setThemePreference } = useAppTheme();
  const { user } = useAppSession();
  const { isPinEnabled } = useSecurityStore();

  const bg = colors.background;
  const surf = colors.surface;
  const border = colors.border;
  const text = colors.text;
  const muted = colors.muted;
  const inputBg = colors.inputBg;

  const accountItems = [
    { label: 'Personal Profile', icon: 'person-outline', subtitle: 'Name, Email, Mobile', path: '/edit-profile' },
    { label: 'Privacy & Security', icon: 'shield-checkmark-outline', subtitle: isPinEnabled ? 'PIN Protected' : 'App PIN, Biometrics', path: '/privacy-security', badge: isPinEnabled ? 'Active' : undefined },
  ];

  const supportItems = [
    { label: 'Platform Settings', icon: 'settings-outline', subtitle: 'Global configuration', path: '/admin/settings' },
    { label: 'Emergency Support', icon: 'headset-outline', subtitle: 'Contact developer team', path: null },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={[styles.headerSafe, { backgroundColor: surf, borderBottomColor: border }]} edges={['top']}>
        <View style={styles.headerContent}>
          <Text style={[styles.pageTitle, { color: text }]}>Settings</Text>
          <Text style={[styles.headerSub, { color: muted }]}>Account & System Configuration</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={{ width: '100%', maxWidth: 680 }}>

          {/* Profile card */}
          <View style={[styles.profileCard, { backgroundColor: surf, borderColor: border }]}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#2D0A0A' : ADMIN_SURF }]}>
              <Ionicons name="person" size={30} color={ADMIN_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: text }]}>{user?.name || 'Admin User'}</Text>
              <Text style={[styles.userRole, { color: muted }]}>System Administrator</Text>
            </View>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: inputBg }]} onPress={() => router.push('/edit-profile' as any)}>
              <Text style={[styles.editBtnText, { color: ADMIN_ACCENT }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Appearance */}
          <Text style={[styles.sectionHeader, { color: muted }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
            <Text style={[styles.cardSubLabel, { color: muted }]}>Theme Mode</Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const active = themePreference === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.themeOption,
                      { borderColor: border, backgroundColor: bg },
                      active && { borderColor: ADMIN_ACCENT, backgroundColor: isDark ? '#2D0A0A' : ADMIN_SURF },
                    ]}
                    onPress={() => setThemePreference(opt.value)}
                  >
                    <Ionicons name={opt.icon as any} size={18} color={active ? ADMIN_ACCENT : muted} />
                    <Text style={[styles.themeOptionText, { color: active ? ADMIN_ACCENT : muted }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Account & Security */}
          <Text style={[styles.sectionHeader, { color: muted }]}>ACCOUNT & SECURITY</Text>
          <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
            {accountItems.map((item, i) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push(item.path as any)} activeOpacity={0.7}>
                  <View style={[styles.menuIconBox, { backgroundColor: inputBg }]}>
                    <Ionicons name={item.icon as any} size={19} color={ADMIN_ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: text }]}>{item.label}</Text>
                    <Text style={[styles.menuSub, { color: muted }]}>{item.subtitle}</Text>
                  </View>
                  {item.badge && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.successSoft }]}>
                      <Text style={[styles.activeBadgeText, { color: colors.success }]}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={muted} />
                </TouchableOpacity>
                {i < accountItems.length - 1 && <View style={[styles.divider, { backgroundColor: border, marginLeft: 72 }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Support */}
          <Text style={[styles.sectionHeader, { color: muted }]}>SUPPORT & PLATFORM</Text>
          <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
            {supportItems.map((item, i) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => item.path && router.push(item.path as any)}
                  activeOpacity={item.path ? 0.7 : 1}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: inputBg }]}>
                    <Ionicons name={item.icon as any} size={19} color={ADMIN_ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: text }]}>{item.label}</Text>
                    <Text style={[styles.menuSub, { color: muted }]}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={muted} />
                </TouchableOpacity>
                {i < supportItems.length - 1 && <View style={[styles.divider, { backgroundColor: border, marginLeft: 72 }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Branding footer */}
          <View style={styles.footerRow}>
            <Ionicons name="water" size={13} color={ADMIN_ACCENT} />
            <Text style={[styles.footerBrand, { color: text }]}>ThanniGo™</Text>
            <View style={[styles.footerSep, { backgroundColor: border }]} />
            <Text style={[styles.footerFounder, { color: muted }]}>Founded by Ugendran</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSafe: { borderBottomWidth: 1, alignItems: 'center' },
  headerContent: { width: '100%', maxWidth: 680, paddingHorizontal: 24, paddingVertical: 16 },
  pageTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120, alignItems: 'center' },

  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, marginBottom: 28, borderWidth: 1, ...Shadow.xs },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  userName: { fontSize: 17, fontWeight: '800' },
  userRole: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 11 },
  editBtnText: { fontWeight: '700', fontSize: 13 },

  sectionHeader: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginLeft: 2, alignSelf: 'flex-start', width: '100%' },

  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginBottom: 24, ...Shadow.xs, width: '100%' },
  cardSubLabel: { fontSize: 12, fontWeight: '700', padding: 16, paddingBottom: 10 },

  themeRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 16 },
  themeOption: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 13, borderWidth: 1.5, gap: 5 },
  themeOptionText: { fontSize: 11, fontWeight: '700' },

  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  menuIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '700' },
  menuSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1 },

  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  activeBadgeText: { fontSize: 10, fontWeight: '800' },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, marginBottom: 4 },
  footerBrand: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  footerSep: { width: 1, height: 12 },
  footerFounder: { fontSize: 12, fontWeight: '400', opacity: 0.6 },
});
