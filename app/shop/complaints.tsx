import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { complaintApi, Complaint } from '@/api/complaintApi';
import Toast from 'react-native-toast-message';

export default function ShopComplaintsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');

  const fetchComplaints = async () => {
    try {
      const data = await complaintApi.shopGetComplaints({ limit: 100 });
      setComplaints(data.data || []);
    } catch (error) {
      console.error('[Complaints] Failed to fetch:', error);
      Toast.show({ type: 'error', text1: 'Failed to load complaints' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints().finally(() => setRefreshing(false));
  }, []);

  const filteredComplaints = complaints.filter(c =>
    activeTab === 'open' ? (c.status === 'open' || c.status === 'in_progress') : (c.status === 'resolved' || c.status === 'closed')
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton fallback="/shop/settings" />
          <View>
            <Text style={styles.headerTitle}>Customer Complaints</Text>
            <Text style={styles.headerSub}>Viewing & Responding to Issues</Text>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'open' && styles.activeTab]}
          onPress={() => setActiveTab('open')}
        >
          <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resolved' && styles.activeTab]}
          onPress={() => setActiveTab('resolved')}
        >
          <Text style={[styles.tabText, activeTab === 'resolved' && styles.activeTabText]}>Resolved</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 40 }} />
        ) : filteredComplaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySub}>No {activeTab} complaints found.</Text>
          </View>
        ) : (
          filteredComplaints.map(c => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, c.priority === 'urgent' && { backgroundColor: '#ffebee' }]}>
                  <Text style={[styles.badgeText, c.priority === 'urgent' && { color: '#c62828' }]}>
                    {c.priority.toUpperCase()}
                  </Text>
                </View>
                {c.is_sos && (
                  <View style={[styles.badge, { backgroundColor: '#c62828' }]}>
                    <Text style={[styles.badgeText, { color: 'white' }]}>SOS</Text>
                  </View>
                )}
                <Text style={styles.date}>{new Date(c.created_at).toLocaleDateString()}</Text>
              </View>

              <Text style={styles.issueText}>{c.type} {c.issue_type ? `- ${c.issue_type}` : ''}</Text>
              <Text style={styles.descText}>{c.description}</Text>

              <View style={styles.orderLabel}>
                <Ionicons name="receipt-outline" size={14} color="#64748b" />
                <Text style={styles.orderText}>Order: {c.Order?.order_number || `#${c.order_id}`}</Text>
              </View>

              {activeTab === 'resolved' && c.resolution_notes && (
                <View style={styles.resolutionBox}>
                  <Text style={styles.resolutionLabel}>Resolution Notes:</Text>
                  <Text style={styles.resolutionNotes}>{c.resolution_notes}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Resolution Modal removed - Admin now handles final decisions */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },

  tabContainer: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#005d90' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#005d90', fontWeight: '800' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 4 },

  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  date: { fontSize: 12, color: '#94a3b8', marginLeft: 'auto' },

  issueText: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  descText: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },

  orderLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  orderText: { fontSize: 13, color: '#64748b', fontWeight: '600' },

  resolveBtn: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  resolveBtnText: { color: '#166534', fontWeight: '700', fontSize: 14 },

  resolutionBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginTop: 4 },
  resolutionLabel: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 4 },
  resolutionNotes: { fontSize: 14, color: '#0f172a' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  
  textArea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, height: 100, fontSize: 15, color: '#0f172a', marginBottom: 20 },
  submitBtn: { backgroundColor: '#005d90', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
