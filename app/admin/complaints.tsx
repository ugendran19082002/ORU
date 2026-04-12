import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COMPLAINTS = [
  { id: 'C1', order: '#TN-9402', customer: 'Rahul Sharma', shop: 'AquaPrime', issue: 'Water can was not sealed properly.', status: 'open' },
  { id: 'C2', order: '#TN-9311', customer: 'Vikas G', shop: 'Oceania Fresh', issue: 'Driver was rude and demanded extra cash.', status: 'open' },
  { id: 'C3', order: '#TN-9205', customer: 'Simran K', shop: 'BlueSpring', issue: 'Delivery delayed by 4 hours.', status: 'resolved' },
];

export default function AdminComplaintsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const [complaints, setComplaints] = useState(COMPLAINTS);

  const resolveIssue = (id: string) => {
    setComplaints(complaints.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Complaints</Text>

        <View style={styles.listContainer}>
          {complaints.map((item, index) => (
            <View key={item.id}>
              <View style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name="warning-outline" size={20} color={item.status === 'open' ? '#ba1a1a' : '#2e7d32'} />
                </View>
                <View style={styles.infoCol}>
                  <View style={styles.headerRow}>
                     <Text style={styles.orderId}>Order {item.order}</Text>
                     <View style={[styles.statusBadge, item.status === 'open' ? styles.statusOpen : styles.statusResolved]}>
                       <Text style={[styles.statusText, item.status === 'open' ? styles.statusTextOpen : styles.statusTextResolved]}>
                         {(item.status || 'pending').toUpperCase()}
                       </Text>
                     </View>
                  </View>
                  <Text style={styles.entitiesLabel}>{item.customer} • {item.shop}</Text>
                  
                  <View style={styles.issueBox}>
                    <Text style={styles.issueText}>"{item.issue}"</Text>
                  </View>

                  {item.status === 'open' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.resolveBtn} onPress={() => resolveIssue(item.id)}>
                        <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
                        <Text style={styles.resolveText}>Mark Resolved</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.suspendBtn}>
                        <Ionicons name="ban" size={16} color="#ba1a1a" />
                        <Text style={styles.suspendText}>Suspend Shop</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              {index < complaints.length - 1 && <View style={styles.divider} />}
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
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  infoCol: { flex: 1 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderId: { fontSize: 15, fontWeight: '800', color: '#181c20' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusOpen: { backgroundColor: '#ffdad6' },
  statusResolved: { backgroundColor: '#e8f5e9' },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  statusTextOpen: { color: '#ba1a1a' },
  statusTextResolved: { color: '#2e7d32' },
  
  entitiesLabel: { fontSize: 12, color: '#707881', fontWeight: '500', marginBottom: 10 },
  
  issueBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#f1f4f9', marginBottom: 12 },
  issueText: { fontSize: 13, color: '#404850', fontStyle: 'italic', lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 10 },
  resolveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e8f5e9', paddingVertical: 10, borderRadius: 10 },
  resolveText: { color: '#2e7d32', fontSize: 12, fontWeight: '700' },
  suspendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white', borderWidth: 1, borderColor: '#ffdad6', paddingHorizontal: 12, borderRadius: 10 },
  suspendText: { color: '#ba1a1a', fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 54 },
});
