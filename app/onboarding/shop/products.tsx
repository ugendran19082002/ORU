import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, FlatList
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { BackButton } from '@/components/ui/BackButton';
import { useLogoutBackHandler } from '@/hooks/use-logout-back-handler';

export default function ShopProductsScreen() {
  const router = useRouter();
  const { user, status } = useAppSession();
  const { handleAuthBack } = useLogoutBackHandler();
  
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  // 1. Load context
  useEffect(() => {
    (async () => {
      try {
        const [shopRes, catRes, stepsRes] = await Promise.all([
          onboardingApi.getMerchantShop(),
          onboardingApi.getCategories(),
          onboardingApi.getShopSteps()
        ]);
        
        if (shopRes.data) setShopId(shopRes.data.id);
        if (catRes.data) setCategories(catRes.data);

        // Prepopulate from existing step metadata
        if (stepsRes.data?.steps) {
          const catStep = stepsRes.data.steps.find((s: any) => s.step_key === 'product_catalog');
          if (catStep?.metadata?.products) {
            setProducts(catStep.metadata.products.map((p: any) => ({
              ...p,
              price: String(p.price || ''),
              stock_quantity: String(p.stock_quantity || '')
            })));
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) return;
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const addProductFromSubcat = (subcat: any) => {
    // Check if already added
    if (products.find(p => p.subcategory_id === subcat.id)) return;

    setProducts(prev => [...prev, {
      subcategory_id: subcat.id,
      name: subcat.name_en, // Default name from subcat
      price: '40',
      stock_quantity: '50'
    }]);
  };

  const removeProduct = (subcatId: number) => {
    setProducts(prev => prev.filter(p => p.subcategory_id !== subcatId));
  };

  const updateProductData = (subcatId: number, field: string, val: string) => {
    setProducts(prev => prev.map(p => 
      p.subcategory_id === subcatId ? { ...p, [field]: val } : p
    ));
  };

  const handleContinue = async () => {
    if (!shopId) return;
    if (products.length === 0) {
      Toast.show({ type: 'error', text1: 'Selection Required', text2: 'Please add at least one product.' });
      return;
    }

    try {
      setLoading(true);

      await onboardingApi.completeShopStep('product_catalog', shopId, {
        products: products.map(p => {
          const price = parseFloat(p.price);
          const stock = parseInt(p.stock_quantity);

          return {
            subcategory_id: p.subcategory_id,
            name: p.name,
            price: isFinite(price) ? price : 0,
            stock_quantity: isFinite(stock) ? stock : 0
          };
        })
      });
      
      router.replace('/onboarding/shop');
    } catch (error: any) {
      if (error.response?.status === 404) return;
      
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to save products.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <BackButton fallback="/onboarding/shop" style={{ marginBottom: 16 }} onPress={handleAuthBack} />
              <Text style={styles.title}>Inventory Setup</Text>
              <Text style={styles.subtitle}>Select categories and add products. Admin-controlled price ranges ensure fair market rates.</Text>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#006878" style={{ marginTop: 40 }} />
            ) : (
                <View style={styles.main}>
                    {/* Category Selection */}
                    <Text style={styles.sectionLabel}>1. Select Category</Text>
                    <View style={styles.categoryGrid}>
                        {categories.map(cat => (
                            <TouchableOpacity 
                                key={cat.id} 
                                style={[styles.catCard, selectedCategory?.id === cat.id && styles.catCardActive]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Ionicons name={cat.id === 1 ? "water" : "cafe"} size={20} color={selectedCategory?.id === cat.id ? "white" : "#64748b"} />
                                <Text style={[styles.catName, selectedCategory?.id === cat.id && { color: 'white' }]}>{cat.name_en}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Subcategory Selection */}
                    {selectedCategory && (
                        <>
                            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>2. Add from {selectedCategory.name_en}</Text>
                            <View style={styles.subcatList}>
                                {selectedCategory.Subcategories?.map((sub: any) => {
                                    const isAdded = products.find(p => p.subcategory_id === sub.id);
                                    return (
                                        <TouchableOpacity 
                                            key={sub.id} 
                                            style={[styles.subcatItem, isAdded && styles.subcatItemAdded]}
                                            onPress={() => addProductFromSubcat(sub)}
                                        >
                                            <View style={styles.subcatInfo}>
                                                <Text style={[styles.subcatName, isAdded && { color: '#006878' }]}>{sub.name_en}</Text>
                                            </View>
                                            <Ionicons name={isAdded ? "checkmark-circle" : "add-circle-outline"} size={26} color={isAdded ? "#006878" : "#cbd5e1"} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* Added Products Logic */}
                    {products.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, { marginTop: 32 }]}>3. Your Selected Products</Text>
                            <View style={styles.productList}>
                                {products.map(prod => (
                                    <View key={prod.subcategory_id} style={styles.prodCard}>
                                        <View style={styles.prodHeader}>
                                            <Text style={styles.prodTitle}>{prod.name}</Text>
                                            <TouchableOpacity onPress={() => removeProduct(prod.subcategory_id)}>
                                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        <View style={styles.prodInputs}>
                                            <View style={styles.prodInputWrap}>
                                                <Text style={styles.prodInputLabel}>Price (₹)</Text>
                                                <TextInput 
                                                    style={styles.prodInput} 
                                                    keyboardType="number-pad" 
                                                    value={prod.price}
                                                    onChangeText={(v) => updateProductData(prod.subcategory_id, 'price', v)}
                                                />
                                            </View>
                                            <View style={styles.prodInputWrap}>
                                                <Text style={styles.prodInputLabel}>Stock</Text>
                                                <TextInput 
                                                    style={styles.prodInput} 
                                                    keyboardType="number-pad" 
                                                    value={prod.stock_quantity}
                                                    onChangeText={(v) => updateProductData(prod.subcategory_id, 'stock_quantity', v)}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleContinue} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#006878', '#134e4a']} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>Save and Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 40, paddingBottom: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#134e4a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },
  main: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 1 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  catCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    gap: 8 
  },
  catCardActive: { backgroundColor: '#006878', borderColor: '#006878' },
  catName: { fontSize: 15, fontWeight: '700', color: '#334155' },
  subcatList: { marginTop: 12, gap: 10 },
  subcatItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    borderColor: '#f1f5f9',
    gap: 12
  },
  subcatItemAdded: { borderColor: '#006878', backgroundColor: '#f0f9ff' },
  subcatInfo: { flex: 1 },
  subcatName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  subcatPriceBox: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 2 },
  productList: { marginTop: 16, gap: 16 },
  prodCard: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 22, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  prodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  prodTitle: { fontSize: 17, fontWeight: '900', color: '#134e4a' },
  prodInputs: { flexDirection: 'row', gap: 16 },
  prodInputWrap: { flex: 1, gap: 8 },
  prodInputLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  prodInput: { 
    height: 54, 
    backgroundColor: 'white', 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    paddingHorizontal: 16, 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1e293b' 
  },
  rangeHint: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 8 },
  footer: { padding: 32, backgroundColor: 'white' },
  cta: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '800' }
});
