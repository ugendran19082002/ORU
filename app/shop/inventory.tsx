import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';

// Simulated Master Categories fetched from Admin side
const MASTER_CATEGORIES = [
  { id: 'cat_1', name: '20L Normal Water Can', unit: '20L' },
  { id: 'cat_2', name: '20L Bisleri Water', unit: '20L' },
  { id: 'cat_3', name: '10L Bisleri Water', unit: '10L' },
  { id: 'cat_4', name: '5L Aquafina', unit: '5L' },
];

export default function ShopInventoryScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const router = useRouter();
  
  // Implicitly, this shop only carries cat_1 and cat_2 right now
  const [shopConfigs, setShopConfigs] = useState<Record<string, { price: string }>>({
    'cat_1': { price: '40' },
    'cat_2': { price: '85' },
  });

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const availableMasters = MASTER_CATEGORIES.filter(c => !shopConfigs[c.id]);
  const activeShopItems = MASTER_CATEGORIES.filter(c => shopConfigs[c.id]);

  const updatePrice = (id: string, price: string) => {
    setShopConfigs(prev => ({
      ...prev,
      [id]: { price }
    }));
  };

  const removeProduct = (id: string) => {
    setShopConfigs(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleAddProduct = () => {
    if (!selectedMasterId || !newPrice) return;
    setShopConfigs(prev => ({
      ...prev,
      [selectedMasterId]: { price: newPrice }
    }));
    setModalVisible(false);
    setSelectedMasterId(null);
    setNewPrice('');
  };

  const handleSave = () => {
    router.replace('/shop/settings' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/shop/settings' as any)}>
          <Ionicons name="arrow-back" size={20} color="#005d90" />
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <Logo size="sm" />
          <Text style={styles.brandName}>ThanniGo</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Shop Inventory</Text>
            <Text style={styles.pageSub}>Add products from the Master list and set your selling price.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.addBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {activeShopItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="layers-outline" size={32} color="#bfc7d1" />
              <Text style={styles.emptyText}>No products added yet. Tap Add Product to pull from the master list.</Text>
            </View>
          ) : (
            activeShopItems.map((cat) => {
              const config = shopConfigs[cat.id];
              return (
                <View key={cat.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="water" size={20} color="#006878" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catUnit}>{cat.unit}</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeProduct(cat.id)}>
                      <Ionicons name="trash-outline" size={16} color="#ba1a1a" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.dividerInner} />
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Selling Price:</Text>
                    <View style={styles.priceInputWrap}>
                      <Text style={styles.rupeeIcon}>₹</Text>
                      <TextInput 
                        style={styles.priceInput}
                        value={config.price}
                        onChangeText={(val) => updatePrice(cat.id, val)}
                        keyboardType="number-pad"
                        placeholder="0"
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
        {activeShopItems.length > 0 && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Pricing</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ADD MASTER PRODUCT MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add from Master List</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedMasterId(null); setNewPrice(''); }} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#707881" />
              </TouchableOpacity>
            </View>

            {availableMasters.length === 0 ? (
              <Text style={styles.emptyText}>You have added all available master categories.</Text>
            ) : (
              <>
                <Text style={styles.inputLabel}>Select Master Category</Text>
                <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} style={styles.masterList} showsVerticalScrollIndicator={false}>
                  {availableMasters.map(cat => (
                    <TouchableOpacity 
                      key={cat.id} 
                      style={[styles.masterCatRow, selectedMasterId === cat.id && styles.masterCatRowActive]}
                      onPress={() => setSelectedMasterId(cat.id)}
                    >
                      <Ionicons name={selectedMasterId === cat.id ? "radio-button-on" : "radio-button-off"} size={20} color={selectedMasterId === cat.id ? "#005d90" : "#bfc7d1"} />
                      <Text style={[styles.masterCatText, selectedMasterId === cat.id && { color: '#005d90', fontWeight: '800' }]}>{cat.name} ({cat.unit})</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedMasterId && (
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.inputLabel}>Set Your Shop Price</Text>
                    <View style={styles.modalPriceInputWrap}>
                      <Text style={styles.rupeeIcon}>₹</Text>
                      <TextInput 
                        style={styles.modalPriceInput}
                        value={newPrice}
                        onChangeText={setNewPrice}
                        keyboardType="number-pad"
                        placeholder="e.g. 45"
                        autoFocus
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.submitBtn, (!selectedMasterId || !newPrice) && { backgroundColor: '#e0e2e8', shadowOpacity: 0 }]} 
                  onPress={handleAddProduct}
                  disabled={!selectedMasterId || !newPrice}
                >
                  <Text style={[styles.submitBtnText, (!selectedMasterId || !newPrice) && { color: '#94a3b8' }]}>Add to My Shop</Text>
                </TouchableOpacity>
              </>
            )}
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
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)'
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#ebeef4', alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 20, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: '#707881', marginTop: 4, lineHeight: 18 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#006878', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  listContainer: { gap: 16, marginBottom: 24 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e0e2e8', shadowColor: '#003a5c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0f7fa', alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 16, fontWeight: '900', color: '#181c20', marginBottom: 2 },
  catUnit: { fontSize: 13, fontWeight: '600', color: '#707881' },
  removeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ffdad6', alignItems: 'center', justifyContent: 'center' },

  dividerInner: { height: 1, backgroundColor: '#f1f4f9', marginVertical: 16 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, fontWeight: '700', color: '#707881' },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f4f9', borderRadius: 12, paddingHorizontal: 12, width: 120, height: 48 },
  rupeeIcon: { fontSize: 16, fontWeight: '800', color: '#181c20', marginRight: 6 },
  priceInput: { flex: 1, fontSize: 18, fontWeight: '900', color: '#006878' },

  saveBtn: { backgroundColor: '#006878', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#006878', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },

  emptyCard: { backgroundColor: 'white', borderRadius: 20, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#e0e2e8', borderStyle: 'dashed' },
  emptyText: { textAlign: 'center', color: '#707881', marginTop: 10, lineHeight: 20, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#181c20' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#707881', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  
  masterList: { maxHeight: 200, backgroundColor: '#f7f9ff', borderRadius: 16, padding: 8 },
  masterCatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10 },
  masterCatRowActive: { backgroundColor: '#e0f0ff' },
  masterCatText: { fontSize: 15, fontWeight: '600', color: '#181c20' },

  modalPriceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f4f9', borderRadius: 14, paddingHorizontal: 16, height: 56 },
  modalPriceInput: { flex: 1, fontSize: 20, fontWeight: '900', color: '#006878' },

  submitBtn: { backgroundColor: '#005d90', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 30, shadowColor: '#005d90', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
