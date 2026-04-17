import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { useSecurityStore } from '@/stores/securityStore';
import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { user } = useAppSession();
  const { isPinEnabled, isBiometricsEnabled } = useSecurityStore();

  const menuItems = [
    { 
      label: 'Personal Profile', 
      icon: 'person-outline', 
      subtitle: 'Name, Email, Mobile', 
      path: '/edit-profile' 
    },
    { 
      label: 'Privacy & Security', 
      icon: 'shield-checkmark-outline', 
      subtitle: 'App PIN, Biometrics', 
      path: '/privacy-security' 
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.headerSub}>Account & System Configuration</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={{ width: '100%', maxWidth: 1200 }}>

        {/* PROFILE PREVIEW */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={ADMIN_ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'Admin User'}</Text>
            <Text style={styles.userRole}>System Administrator</Text>
          </View>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile' as any)}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* SETTINGS MENU */}
        <Text style={styles.sectionHeader}>Account & Security</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push(item.path as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <Ionicons name={item.icon as any} size={20} color={ADMIN_ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.subtitle}</Text>
                </View>
                
                {item.label === 'Privacy & Security' && isPinEnabled && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
                
                <Ionicons name="chevron-forward" size={16} color="#bfc7d1" />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Support & Platform</Text>
        <View style={styles.menuCard}>
           {[
            { label: 'System Settings', icon: 'settings-outline', subtitle: 'Global platform configuration', path: '/admin/settings' },
            { label: 'Emergency Support', icon: 'headset-outline', subtitle: 'Contact developer team', path: '#' },
          ].map((item, index, arr) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => item.path !== '#' && router.push(item.path as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconBox}>
                  <Ionicons name={item.icon as any} size={20} color={ADMIN_ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#bfc7d1" />
              </TouchableOpacity>
              {index < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>


        <Text style={styles.footer}>ThanniGo Admin · v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  headerSafe: {
    backgroundColor: thannigoPalette.surface,
    borderBottomWidth: 1,
    borderBottomColor: thannigoPalette.borderSoft,
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '600', marginTop: 2 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120, alignItems: 'center' },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: thannigoPalette.surface,
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: thannigoPalette.borderSoft,
    ...Shadow.xs,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ADMIN_SURF,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userName: { fontSize: 18, fontWeight: '800', color: thannigoPalette.darkText },
  userRole: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '500', marginTop: 2 },
  editBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: thannigoPalette.background, borderRadius: 12 },
  editBtnText: { color: ADMIN_ACCENT, fontWeight: '700', fontSize: 13 },

  sectionHeader: { fontSize: 14, fontWeight: '800', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  menuCard: { backgroundColor: thannigoPalette.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: thannigoPalette.borderSoft, ...Shadow.xs },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: thannigoPalette.darkText },
  menuSub: { fontSize: 12, color: thannigoPalette.neutral, marginTop: 2 },
  divider: { height: 1, backgroundColor: thannigoPalette.borderSoft, marginLeft: 76 },

  activeBadge: { backgroundColor: '#e0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  activeBadgeText: { color: '#10b981', fontSize: 10, fontWeight: '800' },

  footer: { textAlign: 'center', marginTop: 40, color: thannigoPalette.borderSoft, fontSize: 12, fontWeight: '600' },
});
