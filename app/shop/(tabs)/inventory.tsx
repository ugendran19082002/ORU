import React, { useState } from 'react';
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
import { Logo } from '@/components/ui/Logo';
import { useAppSession } from '@/hooks/use-app-session';
import { onboardingApi } from '@/api/onboardingApi';
import { apiClient } from '@/api/client';
import { resolveApiUrl } from '@/api/client';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

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
  const [editingSubchainId, setEditingSubchainId] = useState<number | null>(null);

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
        setProducts(shopRes.data.Products.map((p: any) => ({
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
        })));
      } else if (stepsRes.data?.steps) {
        const catStep = stepsRes.data.steps.find((s: any) => s.step_key === 'product_catalog');
        if (catStep?.metadata?.products) {
          setProducts(catStep.metadata.products.map((p: any) => ({
            ...p,
            price: String(p.price || ''),
            stock_quantity: String(p.stock_quantity || ''),
            deposit_amount: String(p.deposit_amount || '0'),
            image_url: p.image_url || null,
            is_available: p.is_available !== undefined ? p.is_available : true,
            is_gst: !!p.is_gst,
            tax_percentage: String(p.tax_percentage || '0'),
            type: p.type || "water"
          })));
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

  const updatePrice = (subcatId: number, price: string) => {
    setProducts(prev => prev.map(p =>
      p.subcategory_id === subcatId ? { ...p, price } : p
    ));
  };

  const updateStocks = (subcatId: number, key: 'stock_quantity', val: string) => {
    setProducts(prev => prev.map(p =>
      p.subcategory_id === subcatId ? { ...p, [key]: val } : p
    ));
  };

  const removeProduct = (subcatId: number) => {
    setProducts(prev => prev.filter(p => p.subcategory_id !== subcatId));
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

    setEditingSubchainId(prod.subcategory_id);
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

  const handleAddProduct = () => {
    if (!selectedSubchainId || !newPrice) return;

    // Find subcategory info to get name
    let foundName = 'Water Product';
    for (const cat of categories) {
      const sub = cat.Subcategories?.find((s: any) => s.id === selectedSubchainId);
      if (sub) {
        foundName = sub.name_en;
        break;
      }
    }

    const newProd = {
      subcategory_id: selectedSubchainId,
      name: newName || foundName,
      price: newPrice,
      stock_quantity: newStock,
      deposit_amount: newDeposit,
      image_url: newImageUrl,
      is_available: newIsAvailable,
      is_gst: newIsGst,
      tax_percentage: newTaxPercentage,
      type: categories.find(c => c.id === selectedCategoryId)?.Subcategories?.find((s: any) => s.id === selectedSubchainId)?.is_water_can ? 'WATER_CAN' : 'NORMAL',
      is_water_can: !!categories.find(c => c.id === selectedCategoryId)?.Subcategories?.find((s: any) => s.id === selectedSubchainId)?.is_water_can
    };

    if (isEditing && editingSubchainId) {
      setProducts(prev => prev.map(p =>
        p.subcategory_id === editingSubchainId ? newProd : p
      ));
    } else {
      setProducts(prev => [...prev, newProd]);
    }

    setModalVisible(false);
    setIsEditing(false);
    setEditingSubchainId(null);
    setSelectedSubchainId(null);
    setSelectedCategoryId(null);
    setModalStep(0);
    setNewPrice('40'); // Senseful default to enable button
    setNewStock('100'); // Senseful default
    setNewDeposit('150'); // Senseful default for cans
    setNewImageUrl(null);
    setNewIsAvailable(true);
    setNewName('');
  };

  const handleSave = async () => {
    if (!shopId) return;

    try {
      setSaving(true);
      // Use the live product management API:
      // For each product — if it has a backend id, PATCH it; otherwise POST as new.
      const ops = products.map(async (p) => {
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
        if (p.id) {
          return apiClient.patch(`/shop-owner/products/${p.id}`, body);
        } else {
          return apiClient.post('/shop-owner/products', body);
        }
      });
      await Promise.all(ops);

      Toast.show({ type: 'success', text1: 'Success', text2: 'Inventory changes saved.' });
      await refreshShopStatus();
      loadData(true); // Refresh list so new IDs are populated
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error?.response?.data?.message || 'Failed to update inventory.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.brandRow}>
          <Logo size="sm" />
          <Text style={styles.brandName}>ThanniGo</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SHOP_ACCENT]} tintColor={SHOP_ACCENT} />} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Shop Inventory</Text>
            <Text style={styles.pageSub}>Add products from the Master list and set your selling price.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} disabled={loading}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={SHOP_ACCENT} style={{ marginTop: 60 }} />
        ) : (
          <>
            <View style={styles.listContainer}>
              {products.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="layers-outline" size={32} color="#bfc7d1" />
                  <Text style={styles.emptyText}>No products added yet. Click &apos;Add Product&apos; to pull from Master list.</Text>
                </View>
              ) : (
                products.map((prod) => {
                  const isAvailable = prod.is_available !== false;
                  return (
                    <View key={prod.subcategory_id} style={[styles.card, !isAvailable && styles.cardDisabled]}>
                      {!isAvailable && (
                        <View style={styles.disabledBadge}>
                          <Text style={styles.disabledBadgeText}>OFF</Text>
                        </View>
                      )}
                      <View style={styles.cardTop}>
                        <View style={styles.iconWrap}>
                          {prod.image_url ? (
                            <Image source={{ uri: resolveApiUrl(prod.image_url) }} style={styles.thumbnail} />
                          ) : (
                            <Ionicons name="water" size={20} color={SHOP_ACCENT} />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.catName}>{prod.name}</Text>
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
                            return (
                              <Text style={styles.catUnit}>{catName} • {subName}</Text>
                            );
                          })()}
                        </View>

                        <View style={styles.actionRow}>
                          <Switch
                            value={isAvailable}
                            onValueChange={(v) => {
                              setProducts(prev => prev.map(p =>
                                p.subcategory_id === prod.subcategory_id ? { ...p, is_available: v } : p
                              ));
                            }}
                            trackColor={{ false: thannigoPalette.borderSoft, true: '#a7edff' }}
                            thumbColor={isAvailable ? SHOP_ACCENT : thannigoPalette.neutral}
                            style={{ marginHorizontal: 8, transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                          />
                          <TouchableOpacity style={styles.editCardBtn} onPress={() => handleEditProduct(prod)}>
                            <Ionicons name="pencil-outline" size={16} color={SHOP_ACCENT} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.removeBtn} onPress={() => removeProduct(prod.subcategory_id)}>
                            <Ionicons name="trash-outline" size={16} color="#ba1a1a" />
                          </TouchableOpacity>
                        </View>
                      </View>



                      <View style={styles.stockSection}>
                        <View style={styles.stockCol}>
                          <Text style={styles.stockLabel}>Stock Level</Text>
                          <View style={[styles.stockInputWrap, parseInt(prod.stock_quantity) < 20 && styles.lowStockBorder]}>
                            <TextInput
                              style={styles.stockInput}
                              value={prod.stock_quantity.toString()}
                              onChangeText={(v) => updateStocks(prod.subcategory_id, 'stock_quantity', v)}
                              keyboardType="number-pad"
                            />
                            {parseInt(prod.stock_quantity) < 20 && (
                              <Ionicons name="alert-circle" size={14} color="#ba1a1a" />
                            )}
                          </View>
                        </View>
                        <View style={styles.stockCol} />
                      </View>

                      <View style={styles.dividerInner} />

                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Selling Price:</Text>
                        <View style={styles.priceInputWrap}>
                          <Text style={styles.rupeeIcon}>₹</Text>
                          <TextInput
                            style={styles.priceInput}
                            value={prod.price.toString()}
                            onChangeText={(val) => updatePrice(prod.subcategory_id, val)}
                            keyboardType="number-pad"
                            placeholder="0"
                          />
                        </View>
                      </View>

                      {parseFloat(prod.deposit_amount) > 0 && (
                        <View style={styles.depositRowList}>
                          <Text style={styles.depositLabelList}>Container Charge:</Text>
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
                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
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
                  {isEditing ? 'Edit Product' : (modalStep === 0 ? 'Select Category' : modalStep === 1 ? 'Select Subcategory' : 'Product Details')}
                </Text>
                <Text style={styles.modalStepText}>{isEditing ? 'Update your product configuration' : `Step ${modalStep + 1} of 3`}</Text>
              </View>
              <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedSubchainId(null); setModalStep(0); setIsEditing(false); setEditingSubchainId(null); setNewPrice(''); }} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#707881" />
              </TouchableOpacity>
            </View>

            {(() => {
              if (modalStep === 0) {
                return (
                  <View style={styles.gridContainer}>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catGridCard, selectedCategoryId === cat.id && styles.catGridCardActive]}
                        onPress={() => {
                          setSelectedCategoryId(cat.id);
                          setModalStep(1);
                        }}
                      >
                        <View style={[styles.catIconBox, selectedCategoryId === cat.id && { backgroundColor: 'white' }]}>
                          <Ionicons name={cat.id === 1 ? "water" : "cafe"} size={24} color={selectedCategoryId === cat.id ? SHOP_ACCENT : '#94a3b8'} />
                        </View>
                        <Text style={[styles.catGridLabel, selectedCategoryId === cat.id && { color: 'white' }]}>{cat.name_en}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              }

              if (modalStep === 1) {
                const category = categories.find(c => c.id === selectedCategoryId);
                return (
                  <View>
                    <TouchableOpacity style={styles.backLink} onPress={() => setModalStep(0)}>
                      <Ionicons name="arrow-back" size={14} color={SHOP_ACCENT} />
                      <Text style={styles.backLinkText}>Change Category</Text>
                    </TouchableOpacity>
                    <ScrollView style={styles.masterList} showsVerticalScrollIndicator={false}>
                      {category?.Subcategories?.map((sub: any) => (
                        <TouchableOpacity
                          key={sub.id}
                          style={[styles.masterCatRow, selectedSubchainId === sub.id && styles.masterCatRowActive]}
                          onPress={() => {
                            setSelectedSubchainId(sub.id);
                            setNewName(sub.name_en);
                            setNewDeposit(sub.is_water_can ? '150' : '0');
                            setModalStep(2);
                          }}
                        >
                          <Ionicons
                            name={selectedSubchainId === sub.id ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={selectedSubchainId === sub.id ? SHOP_ACCENT : '#bfc7d1'}
                          />
                          <Text style={[styles.masterCatText, selectedSubchainId === sub.id && { color: SHOP_ACCENT, fontWeight: '800' }]}>
                            {sub.name_en}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              }

              if (modalStep === 2) {
                return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.backLink} onPress={() => setModalStep(1)}>
                      <Ionicons name="arrow-back" size={14} color={SHOP_ACCENT} />
                      <Text style={styles.backLinkText}>Change Subcategory</Text>
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>Product Photo</Text>
                    <TouchableOpacity style={styles.imagePickerCard} onPress={pickImage} disabled={uploadingImage}>
                      {newImageUrl ? (
                        <Image source={{ uri: resolveApiUrl(newImageUrl) }} style={styles.pickerPreview} />
                      ) : (
                        <View style={styles.pickerPlaceholder}>
                          {uploadingImage ? (
                            <ActivityIndicator color={SHOP_ACCENT} />
                          ) : (
                            <>
                              <Ionicons name="camera-outline" size={32} color="#94a3b8" />
                              <Text style={styles.pickerText}>Tap to upload image</Text>
                            </>
                          )}
                        </View>
                      )}
                      {newImageUrl && !uploadingImage && (
                        <View style={styles.editBadge}>
                          <Ionicons name="pencil" size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={{ marginBottom: 20 }}>
                      <Text style={styles.inputLabel}>Product Name</Text>
                      <View style={styles.modalPriceInputWrap}>
                        <TextInput
                          style={[styles.modalPriceInput, { fontSize: 16 }]}
                          value={newName}
                          onChangeText={setNewName}
                          placeholder="Enter product name"
                        />
                      </View>
                    </View>

                    <View style={styles.formSplit}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Price (₹)</Text>
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
                      const subcat = category?.Subcategories?.find((s: any) => s.id === (isEditing ? editingSubchainId : selectedSubchainId));
                      if (subcat?.is_water_can) {
                        return (
                          <View style={{ marginTop: 20 }}>
                            <Text style={styles.inputLabel}>Container Charge (₹)</Text>
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

                    <View style={styles.dividerInner} />

                    <View style={styles.promoRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>GST Applicable</Text>
                        <Text style={styles.hintText}>Enable if this product includes tax</Text>
                      </View>
                      <Switch
                        value={newIsGst}
                        onValueChange={setNewIsGst}
                        trackColor={{ false: '#e0e2e8', true: '#a7edff' }}
                        thumbColor={newIsGst ? SHOP_ACCENT : thannigoPalette.neutral}
                      />
                    </View>

                    {newIsGst && (
                      <View style={{ marginTop: 20 }}>
                        <View style={styles.labelRow}>
                          <Ionicons name="calculator-outline" size={14} color="#64748b" />
                          <Text style={styles.inputLabel}>Tax Rate (%)</Text>
                        </View>
                        <View style={styles.modalPriceInputWrap}>
                          <TextInput
                            style={styles.modalPriceInput}
                            value={newTaxPercentage}
                            onChangeText={setNewTaxPercentage}
                            keyboardType="number-pad"
                            placeholder="18"
                          />
                          <Text style={styles.sliderUnitDisplay}>% GST</Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.submitBtn, (!selectedSubchainId || !newPrice) && { backgroundColor: '#e0e2e8', shadowOpacity: 0 }]}
                      onPress={handleAddProduct}
                      disabled={!selectedSubchainId || !newPrice || uploadingImage}
                    >
                      <Text style={[styles.submitBtnText, (!selectedSubchainId || !newPrice) && { color: '#94a3b8' }]}>{isEditing ? 'Update Product' : 'Add to My Shop'}</Text>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: thannigoPalette.surface,
    borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center', ...Shadow.xs },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: thannigoPalette.neutral, marginTop: 4, lineHeight: 18 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SHOP_ACCENT, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  listContainer: { gap: 16, marginBottom: 24 },
  card: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: thannigoPalette.borderSoft, ...Shadow.xs },

  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 16, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 2 },
  catUnit: { fontSize: 13, fontWeight: '600', color: thannigoPalette.neutral },
  removeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ffdad6', alignItems: 'center', justifyContent: 'center' },

  dividerInner: { height: 1, backgroundColor: thannigoPalette.borderSoft, marginVertical: 16 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, fontWeight: '700', color: thannigoPalette.neutral },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.background, borderRadius: 12, paddingHorizontal: 12, width: 120, height: 48 },
  rupeeIcon: { fontSize: 16, fontWeight: '800', color: thannigoPalette.darkText, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 18, fontWeight: '900', color: SHOP_ACCENT },

  saveBtn: { backgroundColor: SHOP_ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: SHOP_ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },

  stockSection: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  stockCol: { flex: 1, gap: 6 },
  stockLabel: { fontSize: 11, fontWeight: '800', color: thannigoPalette.neutral, textTransform: 'uppercase' },
  stockInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.background, borderRadius: 10, paddingHorizontal: 12, height: 42 },
  stockInput: { flex: 1, fontSize: 14, fontWeight: '800', color: thannigoPalette.darkText },
  lowStockBorder: { borderWidth: 1.5, borderColor: '#ba1a1a', backgroundColor: '#fff5f4' },

  depositRowList: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: thannigoPalette.borderSoft, borderStyle: 'dotted' },
  depositLabelList: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral },
  depositValueList: { fontSize: 14, fontWeight: '800', color: SHOP_ACCENT },

  emptyCard: { backgroundColor: thannigoPalette.surface, borderRadius: 20, padding: 30, alignItems: 'center', ...Shadow.xs, borderWidth: 1, borderColor: thannigoPalette.borderSoft, borderStyle: 'dashed' },
  emptyText: { textAlign: 'center', color: thannigoPalette.neutral, marginTop: 10, lineHeight: 20, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: thannigoPalette.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: thannigoPalette.darkText },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },

  inputLabel: { fontSize: 13, fontWeight: '800', color: thannigoPalette.neutral, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },

  masterList: { maxHeight: 200, backgroundColor: thannigoPalette.background, borderRadius: 16, padding: 8 },
  masterCatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10 },
  masterCatRowActive: { backgroundColor: SHOP_SURF },
  masterCatText: { fontSize: 15, fontWeight: '600', color: thannigoPalette.darkText },

  modalPriceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: thannigoPalette.background, borderRadius: 14, paddingHorizontal: 16, height: 56 },
  modalPriceInput: { flex: 1, fontSize: 20, fontWeight: '900', color: SHOP_ACCENT },

  submitBtn: { backgroundColor: SHOP_ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 30, shadowColor: SHOP_ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 15 },
  thumbnail: { width: '100%', height: '100%', borderRadius: 12, resizeMode: 'cover' },
  modalStepText: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral, marginTop: 2, textTransform: 'uppercase' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  catGridCard: { width: '30%', aspectRatio: 1, backgroundColor: thannigoPalette.background, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  catGridCardActive: { backgroundColor: SHOP_ACCENT, borderColor: SHOP_ACCENT },
  catIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center' },
  catGridLabel: { fontSize: 11, fontWeight: '800', color: thannigoPalette.neutral, textAlign: 'center' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backLinkText: { fontSize: 13, fontWeight: '700', color: SHOP_ACCENT },
  imagePickerCard: { height: 160, backgroundColor: thannigoPalette.background, borderRadius: 24, borderWidth: 2, borderColor: thannigoPalette.borderSoft, borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pickerPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  pickerPlaceholder: { alignItems: 'center', gap: 8 },
  pickerText: { fontSize: 13, fontWeight: '600', color: thannigoPalette.neutral },
  editBadge: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  formSplit: { flexDirection: 'row', gap: 16 },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  editCardBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: SHOP_SURF, alignItems: 'center', justifyContent: 'center' },
  cardDisabled: { opacity: 0.6, backgroundColor: thannigoPalette.background, borderColor: thannigoPalette.borderSoft },
  disabledBadge: { position: 'absolute', top: -10, left: 16, backgroundColor: thannigoPalette.neutral, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, zIndex: 10 },
  disabledBadgeText: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  promoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  sliderUnitDisplay: { fontSize: 13, fontWeight: '600', color: thannigoPalette.neutral, marginLeft: 8 },
  hintText: { fontSize: 13, color: thannigoPalette.neutral, marginTop: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
});


