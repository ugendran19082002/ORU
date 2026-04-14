import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { useSecurityStore } from '@/stores/securityStore';

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* PROFILE PREVIEW */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#005d90" />
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
                  <Ionicons name={item.icon as any} size={20} color="#005d90" />
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

        <Text style={styles.footer}>ThanniGo Admin · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f4f9' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#1a1c1e', marginBottom: 24 },
  
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e0e2e8',
  },
  avatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#e0f0ff', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  userName: { fontSize: 18, fontWeight: '800', color: '#1a1c1e' },
  userRole: { fontSize: 13, color: '#707881', fontWeight: '500', marginTop: 2 },
  editBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    backgroundColor: '#f1f4f9', 
    borderRadius: 12 
  },
  editBtnText: { color: '#005d90', fontWeight: '700', fontSize: 13 },

  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#707881', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  menuCard: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#e0e2e8' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#1a1c1e' },
  menuSub: { fontSize: 12, color: '#707881', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 76 },
  
  activeBadge: { 
    backgroundColor: '#e0fdf4', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginRight: 8 
  },
  activeBadgeText: { color: '#10b981', fontSize: 10, fontWeight: '800' },
  
  footer: { textAlign: 'center', marginTop: 40, color: '#bfc7d1', fontSize: 12, fontWeight: '600' },
});
