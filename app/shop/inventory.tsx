import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
  useWindowDimensions, KeyboardAvoidingView, Platform,
  Switch, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { inventoryApi, ProductPayload } from '@/api/inventoryApi';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import moment from 'moment';

interface Product extends ProductPayload {
  id: number | string;
}

export default function ShopInventoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    price: 30,
    stock_qty: 100,
    is_available: true,
    unit_label: '20L Can'
  });

  const isSmallScreen = width < 380;
  const horizontalPadding = isSmallScreen ? 16 : 24;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getMyProducts();
      setProducts(data);
    } catch (error) {
      console.error('[Inventory] Fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Failed to load inventory' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentProduct({
      name: '',
      price: 30,
      stock_qty: 100,
      is_available: true,
      unit_label: '20L Can'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setIsEditing(true);
    setCurrentProduct({ ...product });
    setShowModal(true);
  };

  const handleToggleActive = async (product: Product, val: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: val } : p));
      await inventoryApi.updateProduct(String(product.id), { is_available: val });
    } catch (error) {
      fetchProducts(); // Rollback
    }
  };

  const handleSave = async () => {
    if (!currentProduct.name || !currentProduct.price) {
      Alert.alert('Required', 'Product name and price are required.');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await inventoryApi.updateProduct(String(currentProduct.id), currentProduct);
        Toast.show({ type: 'success', text1: 'Product Updated' });
      } else {
        await inventoryApi.createProduct(currentProduct as ProductPayload);
        Toast.show({ type: 'success', text1: 'Product Added' });
      }
      setShowModal(false);
      fetchProducts();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#005d90" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <BackButton fallback="/shop/settings" />
          <View>
            <View style={styles.brandRow}>
              <Logo size="md" />
              <Text style={styles.brandName}>ThanniGo</Text>
            </View>
            <Text style={styles.roleLabel}>SHOP PANEL</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Inventory</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.addBtnText}>New Item</Text>
          </TouchableOpacity>
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySub}>Start by adding your first water can or accessory.</Text>
          </View>
        ) : (
          products.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.productCard, !item.is_available && styles.productCardDisabled]}
              onPress={() => handleOpenEdit(item)}
            >
              <View style={styles.productMain}>
                <View style={styles.productImgContainer}>
                   <Ionicons name="water" size={24} color="#005d90" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productSub}>{item.unit_label || '20L Can'}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statBadge}>
                      <Text style={styles.statLabel}>Price</Text>
                      <Text style={styles.statVal}>₹{item.price}</Text>
                    </View>
                    <View style={[styles.statBadge, item.stock_qty < 10 && styles.lowStockBadge]}>
                      <Text style={styles.statLabel}>Stock</Text>
                      <Text style={styles.statVal}>{item.stock_qty}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.productActions}>
                <Switch
                  value={item.is_available}
                  onValueChange={(val) => handleToggleActive(item, val)}
                  trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
                  thumbColor={item.is_available ? '#006878' : '#707881'}
                  style={{ transform: [{ scale: 0.8 }] }}
                />
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {showModal && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={[styles.modalContent, { padding: isSmallScreen ? 20 : 24, borderRadius: 24 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#707881" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Product Name</Text>
              <TextInput 
                style={styles.input}
                value={currentProduct.name}
                onChangeText={(v) => setCurrentProduct({...currentProduct, name: v})}
                placeholder="e.g. Purified 20L Can"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Price (₹)</Text>
                  <TextInput 
                    style={styles.input}
                    value={String(currentProduct.price)}
                    onChangeText={(v) => setCurrentProduct({...currentProduct, price: parseFloat(v) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Stock Qty</Text>
                  <TextInput 
                    style={styles.input}
                    value={String(currentProduct.stock_qty)}
                    onChangeText={(v) => setCurrentProduct({...currentProduct, stock_qty: parseInt(v) || 0})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Unit Label</Text>
              <TextInput 
                style={styles.input}
                value={currentProduct.unit_label}
                onChangeText={(v) => setCurrentProduct({...currentProduct, unit_label: v})}
                placeholder="e.g. 20L Can"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="white" /> : <Text style={styles.confirmText}>{isEditing ? 'Update' : 'Create'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 24, paddingVertical: 14, 
    backgroundColor: 'rgba(255,255,255,0.92)' 
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: '#003a5c', letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: '#006878', letterSpacing: 1.5, marginTop: 3 },
  
  scrollContent: { paddingVertical: 10, paddingBottom: 120 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  addBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: '#005d90', 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 
  },
  addBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },

  productCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', padding: 16, borderRadius: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  productCardDisabled: { opacity: 0.6, backgroundColor: '#f8fafc' },
  productMain: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  productImgContainer: { 
    width: 60, height: 60, borderRadius: 16, 
    backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' 
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  productSub: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBadge: { backgroundColor: '#f1f4f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  lowStockBadge: { backgroundColor: '#fee2e2' },
  statLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
  statVal: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  productActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.6)', padding: 20 },
  modalContent: { backgroundColor: 'white' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  
  label: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { 
    backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, fontSize: 16, 
    fontWeight: '700', color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' 
  },
  row: { flexDirection: 'row', gap: 16 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  cancelBtn: { flex: 1, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  cancelText: { fontWeight: '800', color: '#444' },
  confirmBtn: { flex: 1, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#005d90' },
  confirmText: { fontWeight: '800', color: 'white' },
});
