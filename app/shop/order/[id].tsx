import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton } from '@/components/ui/BackButton';

import { useOrderStore } from '@/stores/orderStore';
import { useShopStore } from '@/stores/shopStore';

export default function ShopDeliveredOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { orders, updateStatus } = useOrderStore();
  const { shops, deliveryAgents } = useShopStore();
  const [isAssignModalOpen, setAssignModalOpen] = React.useState(false);

  const handleAssignAgent = (agentName: string) => {
    // In real app, we update backend order.deliveryAgentId
    updateStatus(orderId, 'assigned');
    setAssignModalOpen(false);
  };

  const order = orders.find((item) => item.id === id) ?? orders[0];
  const shop = shops.find((item) => item.id === order?.shopId);
  const orderId = order?.id || (Array.isArray(id) ? id[0] : id) || '9824';
  const customer = order?.customerName || 'Rahul Sharma';
  const address = order?.address || 'Flat 402, Ocean Breeze Apartments, Sunset Boulevard, Coastal Road.';
  const phone = order?.customerPhone || '+91 98765 43210';
  const time = order?.createdAtLabel || '10:45 AM, Today';
  const lat = 28.4595;
  const lng = 77.0266;



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <BackButton fallback="/shop" />
        <Text style={styles.headerTitle}>Order #{orderId}</Text>
        <View style={{ width: 44 }} />
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {order?.status === 'delivered' ? (
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.successBanner}
          >
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-done" size={32} color="#059669" />
            </View>
            <View>
              <Text style={styles.successTitle}>Successfully Delivered</Text>
              <Text style={styles.successSub}>{time}</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.successBanner, { backgroundColor: '#e0f0ff' }]}>
            <View style={[styles.successIconWrap, { backgroundColor: 'rgba(0,93,144,0.1)' }]}>
              <Ionicons name="time" size={32} color="#005d90" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.successTitle, { color: '#005d90' }]}>Order Status: {order?.status.toUpperCase()}</Text>
              <Text style={[styles.successSub, { color: '#005d90' }]}>{['assigned', 'accepted', 'picked'].includes(order?.status || '') && order.deliveryAgentName ? `Assigned to ${order.deliveryAgentName}` : 'Awaiting Delivery Agent'}</Text>
            </View>
          </View>
        )}

        {/* ASSIGNMENT CTA */}
        {order?.status === 'pending' && (
          <TouchableOpacity style={styles.assignBtn} onPress={() => setAssignModalOpen(true)}>
            <Ionicons name="bicycle-outline" size={20} color="white" />
            <Text style={styles.assignBtnText}>Assign Delivery Driver</Text>
          </TouchableOpacity>
        )}

        {/* CUSTOMER DETAILS */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>CUSTOMER DETAILS</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatarWrap}>
              <Ionicons name="person" size={24} color="#94a3b8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{customer}</Text>
              <Text style={styles.customerPhone}>{phone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Ionicons name="call" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#64748b" />
            <Text style={styles.addressText}>{address}</Text>
          </View>

          {/* ACCURACY POINT */}
          <View style={styles.accuracyRow}>
             <View style={styles.accuracyTag}>
                <Ionicons name="locate" size={14} color="#0369a1" />
                <Text style={styles.accuracyLabel}>ACCURACY POINT</Text>
             </View>
             <Text style={styles.coordText}>{lat.toFixed(4)}, {lng.toFixed(4)}</Text>
          </View>

          <TouchableOpacity 
            style={styles.directionsBtn} 
            onPress={() => router.push({
              pathname: "/map-preview",
              params: { lat: lat.toString(), lng: lng.toString(), title: `Delivery for ${customer}` }
            })}
          >
             <Ionicons name="map" size={18} color="white" />
             <Text style={styles.directionsText}>Get Directions on Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* ORDER SUMMARY */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
          <View style={styles.itemRow}>
            <View style={styles.itemQtyWrap}>
              <Text style={styles.itemQty}>{order?.items[0]?.quantity || 3}x</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>20L Mineral Water Can</Text>
              <Text style={styles.itemSubName}>{shop?.name || 'Blue Spring Aquatics'}</Text>
            </View>
            <Text style={styles.itemTotal}>Rs. {order?.total || 135}</Text>
          </View>
          
          <View style={styles.summaryTotals}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>Rs. {order?.total || 135}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryVal}>Free</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalVal}>Rs. {order?.total || 135}</Text>
            </View>
          </View>
        </View>

        {/* PAYMENT STATUS */}
        <View style={styles.card}>
           <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
             <View>
               <Text style={styles.sectionLabel}>PAYMENT STATUS</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                 <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                 <Text style={styles.paymentMethod}>{order?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Online (Paid)'}</Text>
               </View>
             </View>
             <View style={styles.collectionBadge}>
               <Text style={styles.collectionText}>{order?.paymentMethod === 'cod' ? 'COLLECT CASH' : 'NO CASH'}</Text>
             </View>
           </View>
        </View>

        {/* RETURN BUTTON */}
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/shop')}>
           <Text style={styles.homeBtnText}>Back to Active Orders</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ASSIGN MODAL */}
      <Modal visible={isAssignModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Agent</Text>
              <TouchableOpacity onPress={() => setAssignModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#707881" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              {deliveryAgents.map((agent) => (
                <TouchableOpacity 
                  key={agent.id} 
                  style={[styles.agentCard, agent.status !== 'active' && { opacity: 0.5 }]}
                  onPress={() => agent.status === 'active' && handleAssignAgent(agent.name)}
                >
                  <View style={styles.agentAvatar}>
                    <Text style={styles.agentAvatarText}>{agent.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentStatus}>{agent.status === 'active' ? 'Available' : 'Offline'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#707881" />
                </TouchableOpacity>
              ))}
              {deliveryAgents.length === 0 && (
                <Text style={{ textAlign: 'center', padding: 20, color: '#707881' }}>No agents onboarded yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  scrollContent: { padding: 24 },

  successBanner: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 6 },
  successIconWrap: { backgroundColor: 'white', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  successTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  successSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },

  card: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  customerName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  customerPhone: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0284c7', alignItems: 'center', justifyContent: 'center' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addressText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },

  accuracyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f9ff', padding: 12, borderRadius: 12, marginTop: 16 },
  accuracyTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accuracyLabel: { fontSize: 10, fontWeight: '800', color: '#0369a1', letterSpacing: 0.5 },
  coordText: { fontSize: 12, color: '#0c4a6e', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  directionsBtn: { backgroundColor: '#0ea5e9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, marginTop: 16, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  directionsText: { color: 'white', fontSize: 14, fontWeight: '800' },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  itemQtyWrap: { backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  itemQty: { color: '#0284c7', fontWeight: '900', fontSize: 14 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  itemSubName: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemTotal: { fontSize: 16, fontWeight: '800', color: '#0f172a' },

  summaryTotals: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  summaryVal: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  grandTotalLabel: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
  grandTotalVal: { color: '#0284c7', fontSize: 18, fontWeight: '900' },

  paymentMethod: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  collectionBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  collectionText: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  homeBtn: { backgroundColor: '#ffffff', paddingVertical: 18, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', marginTop: 12 },
  homeBtnText: { color: '#475569', fontSize: 15, fontWeight: '800' },

  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#005d90', paddingVertical: 14, borderRadius: 16, marginBottom: 16, shadowColor: '#005d90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  assignBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#181c20' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  agentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f7f9ff', borderRadius: 16 },
  agentAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  agentAvatarText: { fontSize: 16, fontWeight: '800', color: '#2e7d32' },
  agentName: { fontSize: 16, fontWeight: '800', color: '#181c20' },
  agentStatus: { fontSize: 13, color: '#707881', fontWeight: '500' },
});
