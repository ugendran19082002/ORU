import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView,
  RefreshControl, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator, Image, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppNavigation } from '@/hooks/use-app-navigation';

import { StitchScreenNote } from '@/components/stitch/StitchScreenNote';
import { RoleHeader } from '@/components/ui/RoleHeader';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { apiClient } from '@/api/client';
import { resolveApiUrl } from '@/api/client';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { Shadow, thannigoPalette, roleAccent, roleSurface, Radius, Spacing } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;



export default function ShopInventoryScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const { refreshShopStatus } = useAppSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shopId, setShopId] = useState<number | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [isModalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<0 | 1 | 2>(0); // 0: Category, 1: Subcat, 2: Details
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubchainId, setSelectedSubchainId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [newName, setNewName] = useState('');
  const [newDeposit, setNewDeposit] = useState('0');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [newIsAvailable, setNewIsAvailable] = useState(true);
  const [newIsGst, setNewIsGst] = useState(false);
  const [newTaxPercentage, setNewTaxPercentage] = useState('0');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | number | null>(null);
  const [selectedSubchainIds, setSelectedSubchainIds] = useState<number[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [shopRes, catRes, stepsRes] = await Promise.all([
        onboardingApi.getMerchantShop(),
        onboardingApi.getCategories(),
        onboardingApi.getShopSteps()
      ]);

      if (shopRes.data) setShopId(shopRes.data.id);
      if (catRes.data) setCategories(catRes.data);

      if (shopRes.data?.Products && shopRes.data.Products.length > 0) {
        const uniqueItemsMap = new Map();
        shopRes.data.Products.forEach((p: any) => {
          uniqueItemsMap.set(p.subcategory_id, {
            id: p.id,
            subcategory_id: p.subcategory_id,
            name: p.name,
            price: String(p.price || ''),
            stock_quantity: String(p.stock_quantity || ''),
            deposit_amount: String(p.deposit_amount || '0'),
            image_url: p.image_url || null,
            is_available: p.is_available !== undefined ? p.is_available : true,
            is_gst: !!p.is_gst,
            tax_percentage: String(p.tax_percentage || '0'),
            type: p.type || "water",
            is_water_can: !!p.Subcategory?.is_water_can
          });
        });
        setProducts(Array.from(uniqueItemsMap.values()));
      } else if (stepsRes.data?.steps) {
        const catStep = stepsRes.data.steps.find((s: any) => s.step_key === 'product_catalog');
        if (catStep?.metadata?.products) {
          const uniqueItemsMap = new Map();
          catStep.metadata.products.forEach((p: any) => {
            uniqueItemsMap.set(p.subcategory_id, {
              ...p,
              price: String(p.price || ''),
              stock_quantity: String(p.stock_quantity || ''),
              deposit_amount: String(p.deposit_amount || '0'),
              image_url: p.image_url || null,
              is_available: p.is_available !== undefined ? p.is_available : true,
              is_gst: !!p.is_gst,
              tax_percentage: String(p.tax_percentage || '0'),
              type: p.type || "water"
            });
          });
          setProducts(Array.from(uniqueItemsMap.values()));
        }
      }
    } catch (err) {
      console.error('[Inventory] Load Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, []);

  const updatePrice = (prod: any, price: string) => {
    setProducts(prev => prev.map(p => {
      const isMatch = p.id ? p.id === prod.id : p.subcategory_id === prod.subcategory_id;
      return isMatch ? { ...p, price } : p;
    }));
  };

  const updateStocks = (prod: any, key: 'stock_quantity', val: string) => {
    setProducts(prev => prev.map(p => {
      const isMatch = p.id ? p.id === prod.id : p.subcategory_id === prod.subcategory_id;
      return isMatch ? { ...p, [key]: val } : p;
    }));
  };



  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Need camera roll access to upload photos.' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // 5MB Client-side validation
        if (asset.fileSize && asset.fileSize > 5000000) {
          Toast.show({ type: 'error', text1: 'File Too Large', text2: 'Please select an image smaller than 5MB.' });
          return;
        }

        setUploadingImage(true);
        try {
          const uploadRes = await onboardingApi.uploadShopDocument('product_catalog', shopId!, {
            uri: asset.uri,
            name: 'product_image.jpg',
            type: 'image/jpeg'
          });
          if (uploadRes.data?.document_url) {
            setNewImageUrl(uploadRes.data.document_url);
            Toast.show({ type: 'success', text1: 'Image Uploaded', text2: 'Product photo is ready.' });
          }
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Could not upload product image.' });
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err) {
      console.error('[Inventory] PickImage Error:', err);
    }
  };

  const handleEditProduct = (prod: any) => {
    // Determine category ID from categories list
    let catId = null;
    for (const cat of categories) {
      if (cat.Subcategories?.find((s: any) => s.id === prod.subcategory_id)) {
        catId = cat.id;
        break;
      }
    }

    setEditingProdId(prod.id || `temp-${prod.subcategory_id}`);
    setSelectedCategoryId(catId);
    setSelectedSubchainId(prod.subcategory_id);
    setNewPrice(String(prod.price || '40'));
    setNewStock(String(prod.stock_quantity || '0'));
    setNewDeposit(String(prod.deposit_amount || '0'));
    setNewImageUrl(prod.image_url || null);
    setNewIsAvailable(prod.is_available !== false);
    setNewIsGst(!!prod.is_gst);
    setNewTaxPercentage(String(prod.tax_percentage || '0'));
    setNewName(prod.name || '');
    setIsEditing(true);
    setModalStep(2); // Jump to details by default
    setModalVisible(true);
  };

  const handleAddProduct = (bulkIds?: number[]) => {
    const idsToAdd = bulkIds || (selectedSubchainId ? [selectedSubchainId] : []);
    const existingIds = new Set(products.map(p => p.subcategory_id));
    const uniqueIdsToAdd = idsToAdd.filter(id => !existingIds.has(id));

    if (uniqueIdsToAdd.length === 0 && !isEditing) {
      Toast.show({ type: 'info', text1: 'Already in Draft', text2: 'Selected products are already in your inventory list.' });
      return;
    }

    const newItems: any[] = [];

    (isEditing ? idsToAdd : uniqueIdsToAdd).forEach(id => {
      // Find subcategory info to get name
      let foundName = 'Water Product';
      let isWaterCan = false;
      for (const cat of categories) {
        const sub = cat.Subcategories?.find((s: any) => s.id === id);
        if (sub) {
          foundName = sub.name_en;
          isWaterCan = !!sub.is_water_can;
          break;
        }
      }

      const newItem = {
        id: `draft-${Math.random().toString(36).substring(7)}`,
        subcategory_id: id,
        name: idsToAdd.length > 1 ? foundName : (newName || foundName),
        price: newPrice || '40',
        stock_quantity: newStock || '100',
        deposit_amount: newDeposit || (isWaterCan ? '150' : '0'),
        image_url: newImageUrl,
        is_available: newIsAvailable,
        is_gst: newIsGst,
        tax_percentage: newTaxPercentage,
        type: isWaterCan ? 'WATER_CAN' : 'NORMAL',
        is_water_can: isWaterCan
      };
      newItems.push(newItem);
    });

    if (isEditing && editingProdId) {
      setProducts(prev => prev.map(p => {
        const pUid = p.id || `temp-${p.subcategory_id}`;
        return pUid === editingProdId ? newItems[0] : p;
      }));
      setModalVisible(false);
    } else {
      setProducts(prev => [...prev, ...newItems]);
      // Show feedback but don't close modal if it's a new add
      setLastAddedId(idsToAdd[idsToAdd.length - 1]);
      Toast.show({ type: 'success', text1: 'Added to Draft', text2: `${newItems.length} product(s) added.` });
      
      // If was in details step, go back to subcat list to add more
      if (modalStep === 2) {
        setModalStep(1);
      }
      // Clear selections but keep category
      setSelectedSubchainId(null);
      setSelectedSubchainIds([]);
    }

    setIsEditing(false);
    setEditingProdId(null);
    setNewPrice('40');
    setNewStock('100');
    setNewImageUrl(null);
    setNewIsAvailable(true);
    setNewName('');
  };

  const handleSave = async () => {
    if (!shopId || saving) return;

    try {
      setSaving(true);
      
      // Strong Deduplication: Latest entry for each subcategory wins
      const map = new Map();
      products.forEach(p => {
        map.set(p.subcategory_id, p);
      });
      const uniqueProducts = Array.from(map.values());

      // Initialize unsynced items to pending, skip successful ones
      const initialStatuses = { ...syncStatus };
      uniqueProducts.forEach(p => {
        if (initialStatuses[p.id] !== 'success') {
          initialStatuses[p.id] = 'pending';
        }
      });
      setSyncStatus(initialStatuses);

      for (const p of uniqueProducts) {
        if (initialStatuses[p.id] === 'success') continue; 
        
        const isDraft = String(p.id).startsWith('draft-');
        const body = {
          subcategory_id: p.subcategory_id,
          name: p.name,
          price: parseFloat(p.price) || 0,
          stock_quantity: parseInt(p.stock_quantity) || 0,
          deposit_amount: parseFloat(p.deposit_amount) || 0,
          image_url: p.image_url || null,
          is_available: p.is_available !== false,
          is_gst: !!p.is_gst,
          tax_percentage: parseFloat(p.tax_percentage) || 0,
          type: p.is_water_can ? 'WATER_CAN' : 'NORMAL',
        };

        try {
          // Check if already exists in local list with a real numeric ID (from server)
          // This prevents duplicates if user re-adds a product that they already own.
          const existingRealProduct = products.find(
            item => item.subcategory_id === p.subcategory_id && item.id && !String(item.id).startsWith('draft-')
          );

          if (!isDraft || existingRealProduct) {
            const targetId = isDraft ? existingRealProduct.id : p.id;
            await apiClient.patch(`/shop-owner/products/${targetId}`, body);
            
            // If it was a draft but we matched an existing real product, sync the ID
            if (isDraft) {
               setProducts(curr => curr.map(item => 
                (item.id === p.id) ? { ...item, id: targetId } : item
              ));
            }
          } else {
            const res = await apiClient.post('/shop-owner/products', body);
            // Convert draft ID to real database ID
            if (res.data?.id) {
              setProducts(curr => curr.map(item => 
                (item.id === p.id) ? { ...item, id: res.data.id } : item
              ));
            }
          }
          setSyncStatus(prev => ({ ...prev, [p.id]: 'success' }));
        } catch (err) {
          console.error(`Failed to sync product ${p.id}:`, err);
          setSyncStatus(prev => ({ ...prev, [p.id]: 'error' }));
        }
      }

      Toast.show({ type: 'success', text1: 'Stock Synced', text2: 'All valid changes have been saved.' });
      await refreshShopStatus();
      loadData(true); 
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong during sync.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <RoleHeader
        role="shop_owner"
        title="Shop Panel"
        hasNotif
        onNotif={() => router.push("/notifications" as any)}
      />

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SHOP_ACCENT]} tintColor={SHOP_ACCENT} />} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Inventory</Text>
            <Text style={styles.pageSub}>Manage your shop catalog and stock levels.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} disabled={loading}>
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.addBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ marginTop: 100, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={SHOP_ACCENT} />
            <Text style={{ marginTop: 16, color: thannigoPalette.neutral, fontWeight: '600' }}>Syncing catalog...</Text>
          </View>
        ) : (
          <>
            <View style={styles.listContainer}>
              {products.length === 0 ? (
                <View style={[styles.emptyCard, { marginTop: 40 }]}>
                  <View style={{ backgroundColor: SHOP_SURF, width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Ionicons name="cube-outline" size={40} color={SHOP_ACCENT} />
                  </View>
                  <Text style={[styles.pageTitle, { fontSize: 22, textAlign: 'center' }]}>No Products Yet</Text>
                  <Text style={styles.emptyText}>Start by adding products from the master list to showcase them in your shop.</Text>
                  <TouchableOpacity style={[styles.addBtn, { marginTop: 24 }]} onPress={() => setModalVisible(true)}>
                    <Text style={styles.addBtnText}>Add Your First Product</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                products.map((prod, index) => {
                  const isAvailable = prod.is_available !== false;
                  // Use real ID if available, else fallback to subcategory_id + index for uniqueness guarantee
                  const itemKey = prod.id ? `prod-${prod.id}` : `sub-${prod.subcategory_id}-${index}`;
                  const status = syncStatus[prod.id || `temp-${prod.subcategory_id}`];
                  
                  return (
                    <View key={itemKey} style={[styles.card, !isAvailable && styles.cardDisabled]}>
                      {status === 'error' && (
                        <View style={[styles.statusBadge, { backgroundColor: '#ffeceb' }]}>
                          <Ionicons name="alert-circle" size={12} color="#ba1a1a" />
                          <Text style={[styles.statusBadgeText, { color: '#ba1a1a' }]}>SYNC ERROR</Text>
                        </View>
                      )}
                      {status === 'pending' && (
                        <View style={[styles.statusBadge, { backgroundColor: '#fff8e1' }]}>
                          <ActivityIndicator size="small" color="#fbc02d" style={{ transform: [{ scale: 0.6 }] }} />
                          <Text style={[styles.statusBadgeText, { color: '#fbc02d' }]}>SYNCING...</Text>
                        </View>
                      )}
                      {!isAvailable && (
                        <View style={styles.disabledBadge}>
                          <Text style={styles.disabledBadgeText}>INACTIVE</Text>
                        </View>
                      )}
                      
                      <View style={styles.cardTop}>
                        <View style={styles.iconWrap}>
                          {prod.image_url ? (
                            <Image source={{ uri: resolveApiUrl(prod.image_url) }} style={styles.thumbnail} />
                          ) : (
                            <Ionicons name="water-outline" size={24} color={SHOP_ACCENT} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.catName} numberOfLines={1}>{prod.name}</Text>
                          {(() => {
                            let catName = '';
                            let subName = '';
                            for (const cat of categories) {
                              const sub = cat.Subcategories?.find((s: any) => s.id === prod.subcategory_id);
                              if (sub) {
                                catName = cat.name_en;
                                subName = sub.name_en;
                                break;
                              }
                            }
                            return <Text style={styles.catUnit}>{catName} • {subName}</Text>;
                          })()}
                        </View>

                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.editCardBtn} onPress={() => handleEditProduct(prod)}>
                            <Ionicons name="create-outline" size={18} color={SHOP_ACCENT} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.stockSection}>
                        <View style={styles.stockCol}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                             <Text style={styles.stockLabel}>Stock Level</Text>
                             {parseInt(prod.stock_quantity) < 20 && <Ionicons name="alert-circle" size={12} color="#ba1a1a" />}
                          </View>
                          <View style={[styles.stockInputWrap, parseInt(prod.stock_quantity) < 20 && styles.lowStockBorder]}>
                            <TextInput
                              style={styles.stockInput}
                              value={prod.stock_quantity.toString()}
                              onChangeText={(v) => updateStocks(prod, 'stock_quantity', v)}
                              keyboardType="number-pad"
                            />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral }}>UNITS</Text>
                          </View>
                        </View>
                        <View style={styles.stockCol}>
                          <Text style={styles.stockLabel}>Live Status</Text>
                          <View style={[styles.stockInputWrap, { justifyContent: 'space-between' }]}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: isAvailable ? thannigoPalette.success : thannigoPalette.neutral }}>
                              {isAvailable ? 'ACTIVE' : 'HIDDEN'}
                            </Text>
                            <Switch
                              value={isAvailable}
                              onValueChange={(v) => {
                                setProducts(prev => prev.map(p => {
                                  const isMatch = p.id ? p.id === prod.id : p.subcategory_id === prod.subcategory_id;
                                  return isMatch ? { ...p, is_available: v } : p;
                                }));
                              }}
                              trackColor={{ false: thannigoPalette.borderSoft, true: '#a7edff' }}
                              thumbColor={isAvailable ? SHOP_ACCENT : thannigoPalette.neutral}
                              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                          </View>
                        </View>
                      </View>

                      {prod.is_gst && (
                        <View style={styles.taxRowList}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                             <Ionicons name="receipt-outline" size={14} color={thannigoPalette.neutral} />
                             <Text style={styles.taxLabelList}>GST Tax Rate</Text>
                          </View>
                          <View style={styles.taxBadge}>
                            <Text style={styles.taxValueList}>{prod.tax_percentage}% GST</Text>
                          </View>
                        </View>
                      )}

                      <View style={styles.dividerInner} />

                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Selling Price</Text>
                        <View style={styles.priceInputWrap}>
                          <Text style={styles.rupeeIcon}>₹</Text>
                          <TextInput
                            style={styles.priceInput}
                            value={prod.price.toString()}
                            onChangeText={(val) => updatePrice(prod, val)}
                            keyboardType="number-pad"
                            placeholder="0"
                          />
                        </View>
                      </View>

                      {parseFloat(prod.deposit_amount) > 0 && (
                        <View style={styles.depositRowList}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                             <Ionicons name="shield-outline" size={14} color={thannigoPalette.neutral} />
                             <Text style={styles.depositLabelList}>Secutity Deposit (per unit)</Text>
                          </View>
                          <Text style={styles.depositValueList}>₹{prod.deposit_amount}</Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
            {products.length > 0 && (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.saveBtnText}>Persisting Updates...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveBtnText}>Update Inventory</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* ADD MASTER PRODUCT MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Product' : (modalStep === 0 ? 'Select Category' : modalStep === 1 ? 'Select Size/Type' : 'Product Details')}
                </Text>
                <Text style={styles.modalStepText}>{isEditing ? 'Syncing with Master Catalog' : `Inventory Builder – Step ${modalStep + 1}`}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {!isEditing && (
                  <TouchableOpacity 
                    onPress={() => { setModalVisible(false); setSelectedSubchainId(null); setModalStep(0); setIsEditing(false); setEditingProdId(null); setNewPrice(''); }} 
                    style={styles.finishBtn}
                  >
                    <Text style={styles.finishBtnText}>Finish</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedSubchainId(null); setModalStep(0); setIsEditing(false); setEditingProdId(null); setNewPrice(''); }} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={thannigoPalette.neutral} />
                </TouchableOpacity>
              </View>
            </View>

            {(() => {
              if (modalStep === 0) {
                return (
                  <View>
                    <Text style={styles.inputLabel}>Choose a Category</Text>
                    <View style={styles.gridContainer}>
                      {categories.map(cat => {
                         const isActive = selectedCategoryId === cat.id;
                         return (
                          <TouchableOpacity
                            key={cat.id}
                            style={[styles.catGridCard, isActive && styles.catGridCardActive]}
                            onPress={() => {
                              setSelectedCategoryId(cat.id);
                              setModalStep(1);
                            }}
                          >
                            <View style={[styles.catIconBox, isActive && { backgroundColor: 'white' }]}>
                              <Ionicons 
                                name={cat.id === 1 ? "water-outline" : cat.id === 2 ? "cafe-outline" : "cube-outline"} 
                                size={28} 
                                color={isActive ? SHOP_ACCENT : thannigoPalette.neutral} 
                              />
                            </View>
                            <Text style={[styles.catGridLabel, isActive && { color: 'white' }]}>{cat.name_en}</Text>
                          </TouchableOpacity>
                         );
                      })}
                    </View>
                  </View>
                );
              }

              if (modalStep === 1) {
                const category = categories.find(c => c.id === selectedCategoryId);
                return (
                  <View>
                    <TouchableOpacity style={styles.backLink} onPress={() => setModalStep(0)}>
                      <Ionicons name="arrow-back" size={16} color={SHOP_ACCENT} />
                      <Text style={styles.backLinkText}>Back to Categories</Text>
                    </TouchableOpacity>
                    <Text style={styles.inputLabel}>Available in {category?.name_en}</Text>
                    <ScrollView style={styles.masterList} showsVerticalScrollIndicator={false}>
                      {category?.Subcategories?.map((sub: any) => {
                        const isItemSelected = selectedSubchainIds.includes(sub.id);
                        const isJustAdded = lastAddedId === sub.id;
                        const isAlreadyInCatalog = products.some(p => p.subcategory_id === sub.id && (!!p.id || p.id.startsWith('draft-')));

                        return (
                          <TouchableOpacity
                            key={sub.id}
                            disabled={isAlreadyInCatalog}
                            style={[
                              styles.masterCatRow, 
                              isItemSelected && styles.masterCatRowActive,
                              isAlreadyInCatalog && { opacity: 0.5, backgroundColor: thannigoPalette.borderSoft }
                            ]}
                            onPress={() => {
                              if (selectedSubchainIds.includes(sub.id)) {
                                setSelectedSubchainIds(prev => prev.filter(id => id !== sub.id));
                              } else {
                                setSelectedSubchainIds(prev => [...prev, sub.id]);
                                setSelectedSubchainId(sub.id);
                                setNewName(sub.name_en);
                                setNewDeposit(sub.is_water_can ? '150' : '0');
                              }
                            }}
                          >
                            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: isAlreadyInCatalog ? thannigoPalette.neutral : (isItemSelected ? SHOP_ACCENT : thannigoPalette.borderSoft), alignItems: 'center', justifyContent: 'center', backgroundColor: isItemSelected ? SHOP_ACCENT : 'transparent' }}>
                               {isItemSelected && <Ionicons name="checkmark" size={16} color="white" />}
                               {isAlreadyInCatalog && <Ionicons name="lock-closed" size={12} color={thannigoPalette.neutral} />}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={[styles.masterCatText, isItemSelected && { color: SHOP_ACCENT, fontWeight: '700' }, isAlreadyInCatalog && { color: thannigoPalette.neutral }]}>
                                {sub.name_en}
                              </Text>
                              {isJustAdded && <Text style={{ fontSize: 10, color: '#4caf50', fontWeight: 'bold' }}>ADDED ✓</Text>}
                              {isAlreadyInCatalog && <Text style={{ fontSize: 10, color: thannigoPalette.neutral }}>ALREADY IN SHOP</Text>}
                            </View>
                            {!isJustAdded && !isAlreadyInCatalog && (
                              <TouchableOpacity 
                                style={styles.quickAddBtn}
                                onPress={() => {
                                  setSelectedSubchainId(sub.id);
                                  setNewName(sub.name_en);
                                  setModalStep(2);
                                }}
                              >
                                <Text style={styles.quickAddText}>Setup</Text>
                              </TouchableOpacity>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {selectedSubchainIds.length > 0 && (
                      <TouchableOpacity 
                        style={styles.bulkAddFab} 
                        onPress={() => handleAddProduct(selectedSubchainIds)}
                      >
                        <Text style={styles.bulkAddFabText}>Add {selectedSubchainIds.length} Products to Shop</Text>
                        <Ionicons name="flash" size={18} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }

              if (modalStep === 2) {
                return (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    {!isEditing && (
                       <TouchableOpacity style={styles.backLink} onPress={() => setModalStep(1)}>
                        <Ionicons name="arrow-back" size={16} color={SHOP_ACCENT} />
                        <Text style={styles.backLinkText}>Change Product Type</Text>
                      </TouchableOpacity>
                    )}

                    <Text style={styles.inputLabel}>Product Presentation</Text>
                    <TouchableOpacity style={styles.imagePickerCard} onPress={pickImage} disabled={uploadingImage}>
                      {newImageUrl ? (
                        <Image source={{ uri: resolveApiUrl(newImageUrl) }} style={styles.pickerPreview} />
                      ) : (
                        <View style={styles.pickerPlaceholder}>
                          {uploadingImage ? (
                            <ActivityIndicator color={SHOP_ACCENT} />
                          ) : (
                            <>
                              <View style={{ backgroundColor: SHOP_SURF, padding: 12, borderRadius: 30 }}>
                                <Ionicons name="camera-outline" size={32} color={SHOP_ACCENT} />
                              </View>
                              <Text style={styles.pickerText}>Upload Product Photo</Text>
                              <Text style={{ fontSize: 11, color: thannigoPalette.neutral }}>Supports PNG, JPG (Max 5MB)</Text>
                            </>
                          )}
                        </View>
                      )}
                      {newImageUrl && !uploadingImage && (
                        <View style={styles.editBadge}>
                          <Ionicons name="pencil" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={{ marginBottom: 24 }}>
                      <Text style={styles.inputLabel}>Display Name</Text>
                      <View style={styles.modalPriceInputWrap}>
                        <TextInput
                          style={[styles.modalPriceInput, { fontSize: 16 }]}
                          value={newName}
                          onChangeText={setNewName}
                          placeholder="e.g. Kinley 20L Water Can"
                        />
                      </View>
                    </View>

                    <View style={styles.formSplit}>
                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.inputLabel}>Selling Price (₹)</Text>
                        <View style={styles.modalPriceInputWrap}>
                          <Text style={styles.rupeeIcon}>₹</Text>
                          <TextInput
                            style={styles.modalPriceInput}
                            value={newPrice}
                            onChangeText={setNewPrice}
                            keyboardType="number-pad"
                            placeholder="45"
                          />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Initial Stock</Text>
                        <View style={styles.modalPriceInputWrap}>
                          <TextInput
                            style={styles.modalPriceInput}
                            value={newStock}
                            onChangeText={setNewStock}
                            keyboardType="number-pad"
                            placeholder="100"
                          />
                        </View>
                      </View>
                    </View>

                    {(() => {
                      const category = categories.find(c => c.id === selectedCategoryId);
                      // Use subchain ID for logic if we found it, but for is_water_can check we need the subcat info
                      const subcat = category?.Subcategories?.find((s: any) => s.id === selectedSubchainId);
                      if (subcat?.is_water_can) {
                        return (
                          <View style={{ marginBottom: 24 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                               <Ionicons name="shield-checkmark" size={14} color={thannigoPalette.neutral} />
                               <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Bottle Security Deposit (₹)</Text>
                            </View>
                            <View style={styles.modalPriceInputWrap}>
                              <Text style={styles.rupeeIcon}>₹</Text>
                              <TextInput
                                style={styles.modalPriceInput}
                                value={newDeposit}
                                onChangeText={setNewDeposit}
                                keyboardType="number-pad"
                                placeholder="150"
                              />
                            </View>
                          </View>
                        );
                      }
                      return null;
                    })()}

                    <View style={[styles.dividerInner, { marginVertical: 24 }]} />

                    <View style={styles.promoRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Taxation (GST)</Text>
                        <Text style={styles.hintText}>Is GST applicable for this product?</Text>
                      </View>
                      <Switch
                        value={newIsGst}
                        onValueChange={setNewIsGst}
                        trackColor={{ false: thannigoPalette.borderSoft, true: '#a7edff' }}
                        thumbColor={newIsGst ? SHOP_ACCENT : thannigoPalette.neutral}
                      />
                    </View>

                    {newIsGst && (
                      <View style={{ marginTop: 24 }}>
                        <View style={styles.labelRow}>
                          <Ionicons name="receipt-outline" size={14} color={SHOP_ACCENT} />
                          <Text style={[styles.inputLabel, { marginBottom: 0 }]}>GST Tax Rate (%)</Text>
                        </View>
                        <View style={styles.modalPriceInputWrap}>
                          <TextInput
                            style={styles.modalPriceInput}
                            value={newTaxPercentage}
                            onChangeText={setNewTaxPercentage}
                            keyboardType="number-pad"
                            placeholder="18"
                          />
                          <Text style={styles.sliderUnitDisplay}>PERCENT</Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.submitBtn, (!selectedSubchainId || !newPrice) && { backgroundColor: thannigoPalette.borderSoft, shadowOpacity: 0 }]}
                      onPress={() => handleAddProduct()}
                      disabled={!selectedSubchainId || !newPrice || uploadingImage}
                    >
                      <Text style={[styles.submitBtnText, (!selectedSubchainId || !newPrice) && { color: thannigoPalette.neutral }]}>
                         {isEditing ? 'Save Product Sync' : 'Add to Shop Catalog'}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                );
              }
              return null;
            })()}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },

  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 20 },
  pageTitle: { fontSize: 30, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.8 },
  pageSub: { fontSize: 13, color: thannigoPalette.neutral, marginTop: 4, lineHeight: 18, fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SHOP_ACCENT, paddingHorizontal: 18, paddingVertical: 12, borderRadius: Radius.lg, ...Shadow.sm },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  listContainer: { gap: 18, marginBottom: 24 },
  card: { backgroundColor: thannigoPalette.surface, borderRadius: Radius.xl, padding: 18, borderWidth: 1, borderColor: thannigoPalette.borderSoft, ...Shadow.sm, position: 'relative' },

  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  catName: { fontSize: 17, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 1 },
  catUnit: { fontSize: 12, fontWeight: '600', color: thannigoPalette.neutral },
  removeBtn: { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: '#fff0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffdad6' },

  dividerInner: { height: 1, backgroundColor: thannigoPalette.borderSoft, marginVertical: 16 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  priceLabel: { fontSize: 13, fontWeight: '700', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.background, borderRadius: Radius.md, paddingHorizontal: 14, width: 130, height: 50, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  rupeeIcon: { fontSize: 18, fontWeight: '900', color: thannigoPalette.darkText, marginRight: 4 },
  priceInput: { flex: 1, fontSize: 20, fontWeight: '900', color: SHOP_ACCENT },

  saveBtn: { backgroundColor: SHOP_ACCENT, borderRadius: Radius.xl, paddingVertical: 18, alignItems: 'center', shadowColor: SHOP_ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 10, marginHorizontal: 20, marginBottom: 30 },
  saveBtnText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  stockSection: { flexDirection: 'row', gap: 14, marginTop: 4 },
  stockCol: { flex: 1, gap: 8 },
  stockLabel: { fontSize: 11, fontWeight: '800', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 0.8 },
  stockInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.background, borderRadius: Radius.md, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  stockInput: { flex: 1, fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText },
  lowStockBorder: { borderWidth: 2, borderColor: '#ba1a1a', backgroundColor: '#fff5f4' },

  depositRowList: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: thannigoPalette.borderSoft, borderStyle: 'dashed' },
  depositLabelList: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral },
  depositValueList: { fontSize: 15, fontWeight: '900', color: SHOP_ACCENT },

  taxRowList: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingHorizontal: 4 },
  taxLabelList: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '700' },
  taxBadge: { backgroundColor: '#f0f9ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#bae6ff' },
  taxValueList: { fontSize: 11, fontWeight: '900', color: SHOP_ACCENT, letterSpacing: 0.5 },

  emptyCard: { backgroundColor: thannigoPalette.surface, borderRadius: Radius.xl, padding: 40, alignItems: 'center', ...Shadow.sm, borderWidth: 2, borderColor: thannigoPalette.borderSoft, borderStyle: 'dashed' },
  emptyText: { textAlign: 'center', color: thannigoPalette.neutral, marginTop: 14, lineHeight: 22, fontWeight: '600', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: thannigoPalette.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '85%', ...Shadow.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },

  inputLabel: { fontSize: 12, fontWeight: '800', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginLeft: 2 },

  masterList: { maxHeight: 240, backgroundColor: thannigoPalette.background, borderRadius: Radius.lg, padding: 10, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  masterCatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.md, marginBottom: 4 },
  masterCatRowActive: { backgroundColor: SHOP_SURF, borderWidth: 1, borderColor: SHOP_ACCENT + '40' },
  masterCatText: { fontSize: 16, fontWeight: '700', color: thannigoPalette.darkText },

  modalPriceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.background, borderRadius: Radius.lg, paddingHorizontal: 16, height: 60, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  modalPriceInput: { flex: 1, fontSize: 22, fontWeight: '900', color: SHOP_ACCENT },

  submitBtn: { backgroundColor: SHOP_ACCENT, borderRadius: Radius.xl, paddingVertical: 18, alignItems: 'center', marginTop: 32, ...Shadow.md },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  thumbnail: { width: '100%', height: '100%', borderRadius: Radius.md, resizeMode: 'cover' },
  modalStepText: { fontSize: 11, fontWeight: '800', color: SHOP_ACCENT, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  catGridCard: { width: '30%', aspectRatio: 1, backgroundColor: thannigoPalette.background, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  catGridCardActive: { backgroundColor: SHOP_ACCENT, borderColor: SHOP_ACCENT, ...Shadow.sm },
  catIconBox: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },
  catGridLabel: { fontSize: 12, fontWeight: '800', color: thannigoPalette.neutral, textAlign: 'center', paddingHorizontal: 4 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backLinkText: { fontSize: 14, fontWeight: '800', color: SHOP_ACCENT },
  imagePickerCard: { height: 180, backgroundColor: thannigoPalette.background, borderRadius: Radius.xl, borderWidth: 2, borderColor: thannigoPalette.borderSoft, borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  pickerPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  pickerPlaceholder: { alignItems: 'center', gap: 10 },
  pickerText: { fontSize: 14, fontWeight: '700', color: thannigoPalette.neutral },
  editBadge: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  formSplit: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  editCardBtn: { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SHOP_ACCENT + '30' },
  cardDisabled: { opacity: 0.5, backgroundColor: '#f8fafc', borderColor: thannigoPalette.borderSoft },
  disabledBadge: { position: 'absolute', top: -12, left: 20, backgroundColor: thannigoPalette.neutral, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, zIndex: 10, ...Shadow.xs },
  disabledBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  promoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  sliderUnitDisplay: { fontSize: 14, fontWeight: '700', color: thannigoPalette.neutral, marginLeft: 8 },
  hintText: { fontSize: 12, color: thannigoPalette.neutral, marginTop: 4, fontWeight: '500' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  statusBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 10 },
  statusBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  quickAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md, borderWidth: 1, borderColor: SHOP_ACCENT + '40' },
  quickAddText: { fontSize: 11, fontWeight: '800', color: SHOP_ACCENT },
  bulkAddFab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: SHOP_ACCENT, paddingVertical: 14, borderRadius: Radius.lg, marginTop: 16, ...Shadow.md },
  bulkAddFabText: { color: 'white', fontWeight: '900', fontSize: 15 },
  finishBtn: { backgroundColor: '#4caf50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  finishBtnText: { color: 'white', fontWeight: '900', fontSize: 12 },
});


