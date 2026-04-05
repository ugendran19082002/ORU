import React from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const USERS = [
  { id: 'U1', name: 'Alok Nath', phone: '+91 91234 56789', orders: 12, status: 'active' },
  { id: 'U2', name: 'Simran K', phone: '+91 99887 76655', orders: 4, status: 'active' },
  { id: 'U3', name: 'Vikas Gupta', phone: '+91 98765 12345', orders: 0, status: 'blocked' },
];

export default function AdminCustomersScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Customers</Text>

        <View style={styles.listContainer}>
          {USERS.map((user, index) => (
            <View key={user.id}>
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userSub}>{user.phone}</Text>
                </View>
                <View style={styles.statsWrap}>
                  <Text style={styles.statsValue}>{user.orders}</Text>
                  <Text style={styles.statsLabel}>Orders</Text>
                </View>
                <View style={styles.actionWrap}>
                  {user.status === 'active' ? (
                    <TouchableOpacity style={styles.blockBtn}>
                      <Ionicons name="ban" size={16} color="#ba1a1a" />
                      <Text style={styles.blockBtnText}>Block</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.unblockBtn}>
                      <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
                      <Text style={styles.unblockBtnText}>Unblock</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {index < USERS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginBottom: 24 },
  
  listContainer: { backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#005d90' },
  
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  userSub: { fontSize: 13, color: '#707881' },
  
  statsWrap: { alignItems: 'center', paddingHorizontal: 16, borderLeftWidth: 1, borderLeftColor: '#f1f4f9' },
  statsValue: { fontSize: 16, fontWeight: '900', color: '#006878' },
  statsLabel: { fontSize: 10, color: '#707881', fontWeight: '600' },

  actionWrap: { width: 80, alignItems: 'flex-end' },
  blockBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffdad6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  blockBtnText: { color: '#ba1a1a', fontSize: 12, fontWeight: '700' },
  unblockBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  unblockBtnText: { color: '#2e7d32', fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 58 },
});
