import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useOrderStore } from '@/stores/orderStore';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  orderCount: number;
  isActive: boolean;
}

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Alok Nath', mobile: '+91 91234 56789', address: 'Plot 4, Indiranagar', orderCount: 12, isActive: true },
  { id: '2', name: 'Meera Nair', mobile: '+91 88776 65544', address: 'Apt 402, Serene Residency, Kormangala', orderCount: 5, isActive: true },
];

const PENDING_REQUESTS = [
  { id: 'req_1', name: 'Sanjay Reddy', mobile: '+91 99887 76655', address: 'Tower B, Tech Park, Whitefield' },
];

export default function ShopCustomersScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [pendingReqs, setPendingReqs] = useState(PENDING_REQUESTS);

  // Modals state
  const [isFormVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [fName, setFName] = useState('');
  const [fMobile, setFMobile] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fIsActive, setFIsActive] = useState(true);
  const { orders, setActiveOrder } = useOrderStore();

  const openAddForm = () => {
    setEditingId(null); setFName(''); setFMobile(''); setFAddress(''); setFIsActive(true);
    setFormVisible(true);
  };

  const openEditForm = (c: Customer) => {
    setEditingId(c.id); setFName(c.name); setFMobile(c.mobile); setFAddress(c.address); setFIsActive(c.isActive);
    setFormVisible(true);
  };

  const saveForm = () => {
    if (!fName || !fMobile) return;
    if (editingId) {
      setCustomers(custs => custs.map(c => c.id === editingId ? { ...c, name: fName, mobile: fMobile, address: fAddress, isActive: fIsActive } : c));
    } else {
      setCustomers(custs => [{ id: `c_${Date.now()}`, name: fName, mobile: fMobile, address: fAddress, orderCount: 0, isActive: true }, ...custs]);
    }
    setFormVisible(false);
  };

  const handleApprove = (reqId: string) => {
    const req = pendingReqs.find(r => r.id === reqId);
    if (!req) return;
    setCustomers(custs => [{ id: req.id, name: req.name, mobile: req.mobile, address: req.address, orderCount: 0, isActive: true }, ...custs]);
    setPendingReqs(prev => prev.filter(r => r.id !== reqId));
  };

  const handleReject = (reqId: string) => {
    setPendingReqs(prev => prev.filter(r => r.id !== reqId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Logo size="md" />
            <Text style={styles.brandName}>ThanniGo</Text>
          </View>
          <Text style={styles.roleLabel}>SHOP PANEL • CRM</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddForm}>
          <Ionicons name="person-add" size={16} color="white" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>My Customers</Text>

        {/* PENDING REQUESTS */}
        {pendingReqs.length > 0 && (
          <View style={styles.reqBlock}>
            <Text style={styles.sectionHeader}>Connection Requests ({pendingReqs.length})</Text>
            {pendingReqs.map(req => (
              <View key={req.id} style={styles.reqCard}>
                <View style={styles.reqInfo}>
                  <Text style={styles.reqName}>{req.name}</Text>
                  <Text style={styles.reqSub}>{req.mobile} • {req.address}</Text>
                </View>
                <View style={styles.reqActions}>
                  <TouchableOpacity style={styles.reqReject} onPress={() => handleReject(req.id)}>
                    <Ionicons name="close" size={18} color="#ba1a1a" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reqApprove} onPress={() => handleApprove(req.id)}>
                    <Text style={styles.reqApproveText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#005d90" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or number..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        {/* CUSTOMER LIST */}
        <View style={styles.listContainer}>
          {customers.length === 0 ? (
            <Text style={styles.emptyText}>No customers enrolled yet.</Text>
          ) : (
            customers.map((customer, index) => (
              <View key={customer.id}>
                <View style={[styles.customerRow, !customer.isActive && { opacity: 0.5 }]}>
                  <View style={styles.infoCol}>
                    <View style={styles.infoHeader}>
                      <View style={[styles.avatar, !customer.isActive && { backgroundColor: '#f1f4f9' }]}>
                        <Text style={[styles.avatarText, !customer.isActive && { color: '#707881' }]}>{customer.name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.custName}>{customer.name} {!customer.isActive && <Text style={{ color: '#ba1a1a', fontSize: 10 }}>(Inactive)</Text>}</Text>
                        <Text style={styles.custMobile}>{customer.mobile}</Text>
                      </View>
                    </View>
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={12} color="#707881" />
                      <Text style={styles.custAddress}>{customer.address}</Text>
                    </View>
                  </View>

                  <View style={styles.actionCol}>
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderVal}>{customer.orderCount}</Text>
                      <Text style={styles.orderLabel}>Orders</Text>
                    </View>
                    
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={styles.miniBtn} onPress={() => openEditForm(customer)}>
                        <Ionicons name="pencil-outline" size={16} color="#005d90" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.miniBtn, { width: 'auto', paddingHorizontal: 12 }]}
                        onPress={() => {
                          const customerOrder = orders.find((order) => order.customerName === customer.name);
                          if (customerOrder) {
                            setActiveOrder(customerOrder.id);
                            router.push(`/shop/order/${customerOrder.id}` as any);
                          }
                        }}
                      >
                        <Ionicons name="receipt-outline" size={14} color="#006878" style={{ marginRight: 4 }} />
                        <Text style={styles.miniBtnText}>History</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {index < customers.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ADD/EDIT MODAL */}
      <Modal visible={isFormVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Customer' : 'Add New Customer'}</Text>
              <TouchableOpacity onPress={() => setFormVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#707881" />
              </TouchableOpacity>
            </View>

            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput style={styles.inputField} value={fName} onChangeText={setFName} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput style={styles.inputField} value={fMobile} onChangeText={setFMobile} keyboardType="phone-pad" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Delivery Address</Text>
                <TextInput style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]} value={fAddress} onChangeText={setFAddress} multiline />
              </View>

              {/* Deactivate Toggle for Edit Mode */}
              {editingId && (
                <View style={styles.toggleRow}>
                  <Text style={styles.inputLabel}>Active Status</Text>
                  <TouchableOpacity 
                    style={[styles.statusBtn, fIsActive ? styles.statusBtnActive : styles.statusBtnInactive]}
                    onPress={() => setFIsActive(!fIsActive)}
                  >
                    <Text style={[styles.statusText, fIsActive ? { color: '#2e7d32' } : { color: '#c62828' }]}>
                      {fIsActive ? 'Active' : 'Deactivated'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={saveForm}>
                <Text style={styles.submitBtnText}>{editingId ? 'Save Changes' : 'Create Customer'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: '#006878', letterSpacing: 1.5, marginTop: 3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#006878', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5, marginTop: 10, marginBottom: 20 },

  sectionHeader: { fontSize: 13, fontWeight: '800', color: '#707881', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  
  reqBlock: { marginBottom: 24 },
  reqCard: { backgroundColor: '#e0f7fa', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#006878', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  reqInfo: { flex: 1, paddingRight: 12 },
  reqName: { fontSize: 15, fontWeight: '800', color: '#006878', marginBottom: 2 },
  reqSub: { fontSize: 12, color: '#004e5b', lineHeight: 16 },
  reqActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqReject: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  reqApprove: { backgroundColor: '#006878', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  reqApproveText: { color: 'white', fontWeight: '800', fontSize: 13 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ebeef4',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 10, marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#181c20' },

  listContainer: { backgroundColor: 'white', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  emptyText: { textAlign: 'center', color: '#707881', paddingVertical: 30, fontWeight: '500' },
  
  customerRow: { flex: 1, flexDirection: 'column', gap: 12, paddingVertical: 14 },
  
  infoCol: { flex: 1, gap: 8 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#005d90' },
  custName: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  custMobile: { fontSize: 13, color: '#707881', fontWeight: '600' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingLeft: 4 },
  custAddress: { fontSize: 12, color: '#707881', lineHeight: 16, flex: 1 },

  actionCol: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f4f9', borderStyle: 'dashed' },
  orderBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  orderVal: { fontSize: 18, fontWeight: '900', color: '#006878' },
  orderLabel: { fontSize: 10, color: '#707881', fontWeight: '600', textTransform: 'uppercase' },

  actionBtns: { flexDirection: 'row', gap: 8 },
  miniBtn: { height: 32, width: 32, borderRadius: 10, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  miniBtnText: { color: '#006878', fontSize: 11, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#f1f4f9' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#181c20' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#707881', marginBottom: 8, marginLeft: 4 },
  inputField: { backgroundColor: '#f1f4f9', borderRadius: 14, paddingHorizontal: 16, height: 50, fontSize: 16, fontWeight: '600', color: '#181c20' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  statusBtnActive: { backgroundColor: '#e8f5e9' },
  statusBtnInactive: { backgroundColor: '#ffebee' },
  statusText: { fontWeight: '800', fontSize: 14 },

  submitBtn: { backgroundColor: '#006878', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
});
