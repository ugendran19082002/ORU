import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';

const { width } = Dimensions.get('window');
const isMobile = width < 768; // Simple breakpoint for web/tablet vs mobile

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin', icon: 'pie-chart' },
  { name: 'Inventory Master', path: '/admin/inventory', icon: 'layers' },
  { name: 'Shops', path: '/admin/shops', icon: 'storefront' },
  { name: 'Customers', path: '/admin/customers', icon: 'people' },
  { name: 'Orders', path: '/admin/orders', icon: 'receipt' },
  { name: 'Complaints', path: '/admin/complaints', icon: 'warning' },
  { name: 'Commission', path: '/admin/commission', icon: 'cash' },
];

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    router.push(path as any);
    if (isMobile) setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    router.replace('/auth' as any);
  };

  const SidebarContent = () => (
    <View style={styles.sidebarContent}>
      <View style={styles.brandBox}>
        <Logo size="sm" />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.brandName}>ThanniGo</Text>
          <Text style={styles.adminTag}>Admin Panel</Text>
        </View>
      </View>

      <View style={styles.navMenu}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname === `${item.path}/` || (item.path === '/admin' && pathname.includes('index'));
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => handleNav(item.path)}
            >
              <Ionicons
                name={isActive ? item.icon : `${item.icon}-outline` as any}
                size={20}
                color={isActive ? '#005d90' : '#707881'}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ba1a1a" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {/* SIDEBAR (Desktop/Tablet) */}
      {!isMobile && (
        <View style={styles.sidebar}>
          <SidebarContent />
        </View>
      )}

      {/* MOBILE HEADER */}
      {isMobile && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity onPress={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Ionicons name="menu" size={28} color="#005d90" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Logo size="xs" />
            <Text style={styles.brandName}>ThanniGo Admin</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
      )}

      {/* MOBILE MENU DROPDOWN */}
      {isMobile && mobileMenuOpen && (
        <View style={styles.mobileMenu}>
          <SidebarContent />
        </View>
      )}

      {/* MAIN CONTENT AREA */}
      <View style={styles.mainContent}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    backgroundColor: '#f1f4f9',
  },
  sidebar: {
    width: 260,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e0e2e8',
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
    ...(isMobile && { backgroundColor: 'white', minHeight: 400 }),
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#003a5c',
    letterSpacing: -0.5,
  },
  adminTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ba1a1a',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  navMenu: {
    flex: 1,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#e0f0ff',
  },
  navText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#707881',
  },
  navTextActive: {
    color: '#005d90',
    fontWeight: '800',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f4f9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: '#ba1a1a',
    fontWeight: '700',
    fontSize: 15,
  },

  // Mobile specific
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e2e8',
    zIndex: 100,
  },
  mobileMenu: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e2e8',
  },

  mainContent: {
    flex: 1,
  },
});
