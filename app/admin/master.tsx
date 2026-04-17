import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, Alert, useWindowDimensions, RefreshControl, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/providers/AppSessionProvider';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { apiClient } from '@/api/client';

import { Shadow, thannigoPalette, roleAccent, roleSurface } from '@/constants/theme';

const ADMIN_ACCENT = roleAccent.admin;
const ADMIN_SURF = roleSurface.admin;

interface Category {
  id: number;
  name_en: string;
  name_ta: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  Subcategories?: Subcategory[];
}

interface Subcategory {
  id: number;
  category_id: number;
  name_en: string;
  name_ta: string;
  is_active: boolean;
  is_water_can: boolean;
  sort_order: number;
}

export default function MasterMenuScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const { status, user } = useAppSession();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  // Form states
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameTa, setCatNameTa] = useState('');
  const [subNameEn, setSubNameEn] = useState('');
  const [subNameTa, setSubNameTa] = useState('');
  const [isWaterCan, setIsWaterCan] = useState(false);

  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);
      // Use the admin endpoint to see ALL categories including archived
      const res = await apiClient.get('/admin/categories');
      if (res.data.status === 1) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error('[Master] Load Error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load master data' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  if (status === 'authenticated' && (!user || user?.role !== 'admin')) {
    return null;
  }

   const toggleCategoryActive = async (cat: Category) => {
      try {
        const nextActive = !cat.is_active;
        const res = await (nextActive 
          ? apiClient.put(`/admin/categories/${cat.id}`, { is_active: true })
          : apiClient.delete(`/admin/categories/${cat.id}`) // DELETE is soft-delete archiving
        );

        if (res.data.status === 1) {
          Toast.show({ type: 'success', text1: nextActive ? 'Restored' : 'Archived' });
          fetchMasterData();
        }
      } catch (e) { Toast.show({ type: 'error', text1: 'Operation failed' }); }
   };

   const toggleSubcategoryActive = async (sub: Subcategory) => {
      try {
        const nextActive = !sub.is_active;
        const res = await (nextActive 
          ? apiClient.put(`/admin/subcategories/${sub.id}`, { is_active: true })
          : apiClient.delete(`/admin/subcategories/${sub.id}`)
        );

        if (res.data.status === 1) {
          Toast.show({ type: 'success', text1: nextActive ? 'Restored' : 'Archived' });
          fetchMasterData();
        }
      } catch (e) { Toast.show({ type: 'error', text1: 'Operation failed' }); }
   };
  const handleAddCat = () => {
    setEditingCat(null);
    setCatNameEn('');
    setCatNameTa('');
    setCatModalVisible(true);
  };

  const handleEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatNameEn(cat.name_en);
    setCatNameTa(cat.name_ta);
    setCatModalVisible(true);
  };

  const saveCategory = async () => {
     if (!catNameEn) return;
     try {
       const path = editingCat ? `/admin/categories/${editingCat.id}` : '/admin/categories';
       const body = { name_en: catNameEn, name_ta: catNameTa || catNameEn, sort_order: editingCat?.sort_order || 0 };
       
       const res = editingCat 
         ? await apiClient.put(path, body)
         : await apiClient.post(path, body);

       if (res.data.status === 1) {
         Toast.show({ type: 'success', text1: editingCat ? 'Updated' : 'Created' });
         setCatModalVisible(false);
         fetchMasterData();
       }
     } catch (e) { Toast.show({ type: 'error', text1: 'Failed to save category' }); }
  };

  const deleteCategory = (id: number) => {
    Alert.alert('Delete Category', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await apiClient.delete(`/admin/categories/${id}`);
          if (res.data.status === 1) fetchMasterData();
          else Toast.show({ type: 'error', text1: 'Error', text2: res.data.message });
        } catch (e: any) { 
          Toast.show({ type: 'error', text1: 'Delete failed', text2: e.response?.data?.message || 'Check for dependencies' }); 
        }
      }}
    ]);
  };

  // --- Subcategory Handlers ---
  const handleAddSub = (catId: number) => {
    setSelectedCatId(catId);
    setEditingSub(null);
    setSubNameEn('');
    setSubNameTa('');
    setIsWaterCan(false);
    setSubModalVisible(true);
  };

  const handleEditSub = (sub: Subcategory) => {
    setEditingSub(sub);
    setSubNameEn(sub.name_en);
    setSubNameTa(sub.name_ta);
    setIsWaterCan(sub.is_water_can);
    setSubModalVisible(true);
  };

  const saveSubcategory = async () => {
    if (!subNameEn) return;
    try {
      const path = editingSub ? `/admin/subcategories/${editingSub.id}` : '/admin/subcategories';
      const body = { 
        category_id: editingSub?.category_id || selectedCatId,
        name_en: subNameEn, 
        name_ta: subNameTa || subNameEn, 
        is_water_can: isWaterCan,
        sort_order: editingSub?.sort_order || 0 
      };

      const res = editingSub 
        ? await apiClient.put(path, body)
        : await apiClient.post(path, body);

      if (res.data.status === 1) {
        Toast.show({ type: 'success', text1: editingSub ? 'Updated' : 'Created' });
        setSubModalVisible(false);
        fetchMasterData();
      }
    } catch (e) { Toast.show({ type: 'error', text1: 'Failed to save subcategory' }); }
  };

  const deleteSubcategory = (id: number) => {
    Alert.alert('Delete Subcategory', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await apiClient.delete(`/admin/subcategories/${id}`);
          if (res.data.status === 1) fetchMasterData();
          else Toast.show({ type: 'error', text1: 'Error', text2: res.data.message });
        } catch (e: any) { 
          Toast.show({ type: 'error', text1: 'Delete failed', text2: e.response?.data?.message || 'Check for dependencies' }); 
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={ADMIN_ACCENT} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Master Menu</Text>
              <Text style={styles.headerSub}>Categories & Product Hierarchy</Text>
            </View>
            <TouchableOpacity style={styles.addBtnHeader} onPress={handleAddCat} activeOpacity={0.8}>
               <LinearGradient colors={[ADMIN_ACCENT, ADMIN_ACCENT]} style={styles.addBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addBtnText}>New</Text>
               </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.filterRowWrap, isDesktop && { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 1200 }}>
          <View style={styles.filterRowInside}>
            <TouchableOpacity 
              style={[styles.filterBtn, showArchived && styles.filterBtnActive]} 
              onPress={() => setShowArchived(!showArchived)}
            >
              <Ionicons name={showArchived ? "eye-outline" : "eye-off-outline"} size={16} color={showArchived ? "white" : "#64748b"} />
              <Text style={[styles.filterText, showArchived && { color: 'white' }]}>
                {showArchived ? "Hide Archived" : "Show Archived"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scroll, isDesktop && { paddingHorizontal: '5%', maxWidth: 1200, alignSelf: 'center', width: '100%' }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMasterData(); }} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={ADMIN_ACCENT} style={{ marginTop: 100 }} />
        ) : categories
            .filter(cat => showArchived || cat.is_active)
            .map((cat) => (
          <View key={cat.id} style={[styles.catCard, !cat.is_active && { opacity: 0.75 }]}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.catHeader} 
              onPress={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            >
              <View style={styles.catInfo}>
                <View style={[styles.chevronWrap, !cat.is_active && { backgroundColor: thannigoPalette.borderSoft }]}>
                  <Ionicons name={expandedCat === cat.id ? "chevron-down" : "chevron-forward"} size={18} color={cat.is_active ? "#ba1a1a" : "#94a3b8"} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Text style={[styles.catName, !cat.is_active && { color: thannigoPalette.neutral }]} numberOfLines={1}>
                      {cat.name_en}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: cat.is_active ? '#e0f2fe' : '#fee2e2' }]}>
                      <Text style={[styles.statusText, { color: cat.is_active ? thannigoPalette.success : ADMIN_ACCENT }]}>
                        {cat.is_active ? 'ACTIVE' : 'ARCHIVED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.catSubText}>{cat.Subcategories?.length || 0} items configured</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditCat(cat)}>
                  <Ionicons name="pencil-outline" size={16} color={ADMIN_ACCENT} />
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.archiveBtn, !cat.is_active && styles.restoreBtn]} 
                   onPress={() => toggleCategoryActive(cat)}
                >
                  <Ionicons 
                    name={cat.is_active ? "trash-outline" : "refresh-outline"} 
                    size={14} 
                    color={cat.is_active ? "#ba1a1a" : "white"} 
                  />
                  {!cat.is_active && <Text style={styles.restoreText}>Restore</Text>}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {expandedCat === cat.id && (
              <View style={styles.subList}>
                {cat.Subcategories
                  ?.filter(sub => showArchived || sub.is_active)
                  ?.map((sub) => (
                  <View key={sub.id} style={[styles.subItem, !sub.is_active && { opacity: 0.6 }]}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.subDot, !sub.is_active && { backgroundColor: '#e2e8f0' }]} />
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.subName, !sub.is_active && { color: '#94a3b8' }]}>{sub.name_en}</Text>
                          {!sub.is_active && (
                            <View style={styles.miniBadge}>
                              <Text style={styles.miniBadgeText}>Archived</Text>
                            </View>
                          )}
                        </View>
                        {sub.is_water_can && (
                          <View style={styles.waterBadge}>
                            <Ionicons name="water" size={8} color={ADMIN_ACCENT} />
                            <Text style={styles.waterText}>Water Logic</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditSub(sub)}>
                        <Ionicons name="pencil-outline" size={14} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.subArchiveBtn, !sub.is_active && styles.subRestoreBtn]} 
                        onPress={() => toggleSubcategoryActive(sub)}
                      >
                        <Ionicons 
                           name={sub.is_active ? "trash-outline" : "refresh-outline"} 
                           size={13} 
                           color={sub.is_active ? "#ba1a1a" : "white"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity 
                  style={styles.addSubBtn} 
                  onPress={() => handleAddSub(cat.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.addSubIcon}>
                    <Ionicons name="add" size={16} color={ADMIN_ACCENT} />
                  </View>
                  <Text style={styles.addSubText}>Create New Subcategory</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* CATEGORY MODAL */}
      <Modal visible={catModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setCatModalVisible(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCat ? 'Modify Category' : 'New Category'}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>English Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Beverages" 
                value={catNameEn} 
                onChangeText={setCatNameEn} 
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tamil Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="எ.கா. பானங்கள்" 
                value={catNameTa} 
                onChangeText={setCatNameTa} 
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCatModalVisible(false)}>
                <Text style={styles.cancelText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCategory}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* SUBCATEGORY MODAL */}
      <Modal visible={subModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSubModalVisible(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingSub ? 'Modify Subcategory' : 'New Subcategory'}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>English Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Mineral Water" 
                value={subNameEn} 
                onChangeText={setSubNameEn} 
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tamil Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="எ.கா. கனிம நீர்" 
                value={subNameTa} 
                onChangeText={setSubNameTa} 
              />
            </View>
            <TouchableOpacity style={styles.checkRow} onPress={() => setIsWaterCan(!isWaterCan)} activeOpacity={0.7}>
               <View style={[styles.checkbox, isWaterCan && styles.checkboxActive]}>
                 {isWaterCan && <Ionicons name="checkmark" size={14} color="white" />}
               </View>
               <View>
                  <Text style={styles.checkLabel}>Water Can Logic</Text>
                  <Text style={styles.checkSub}>Enable deposit management for this item</Text>
               </View>
            </TouchableOpacity>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSubModalVisible(false)}>
                <Text style={styles.cancelText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveSubcategory}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },

  headerSafe: { 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: thannigoPalette.borderSoft,
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: thannigoPalette.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 28, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '600', marginTop: 2 },
  addBtnHeader: { borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  
  filterRowWrap: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft, paddingVertical: 12 },
  filterRowInside: { paddingHorizontal: 24 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: thannigoPalette.borderSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e2e8f0' },
  filterBtnActive: { backgroundColor: ADMIN_ACCENT, borderColor: ADMIN_ACCENT },
  filterText: { fontSize: 13, fontWeight: '700', color: thannigoPalette.neutral },

  scroll: { padding: 20, paddingBottom: 100 },
  catCard: { backgroundColor: 'white', borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: thannigoPalette.borderSoft, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2, overflow: 'hidden' },
  catHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  catInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  chevronWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: ADMIN_SURF, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 17, fontWeight: '800', color: thannigoPalette.darkText, flexShrink: 1 },
  catSubText: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 1 },
  
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center', flexShrink: 0 },
  actionBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: thannigoPalette.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  archiveBtn: { height: 36, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  restoreBtn: { backgroundColor: ADMIN_ACCENT, borderColor: ADMIN_ACCENT },
  restoreText: { color: 'white', fontSize: 13, fontWeight: '800' },
  subArchiveBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, borderColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  subRestoreBtn: { backgroundColor: ADMIN_ACCENT, borderColor: ADMIN_ACCENT },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  miniBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  miniBadgeText: { fontSize: 9, color: ADMIN_ACCENT, fontWeight: '800', textTransform: 'uppercase' },
  
  subList: { padding: 20, paddingTop: 0, borderTopWidth: 1, borderTopColor: thannigoPalette.background, backgroundColor: '#fafbfc' },
  subItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft, flexDirection: 'row', alignItems: 'center' },
  subDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  subName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  waterBadge: { backgroundColor: '#e0f2fe', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  waterText: { fontSize: 10, color: ADMIN_ACCENT, fontWeight: '800', textTransform: 'uppercase' },
  
  addSubBtn: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  addSubIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: ADMIN_SURF, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ADMIN_SURF },
  addSubText: { fontSize: 14, fontWeight: '800', color: ADMIN_ACCENT },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '92%', maxWidth: 440, backgroundColor: 'white', borderRadius: 32, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 24, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: thannigoPalette.background, borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '600', color: thannigoPalette.darkText, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16, backgroundColor: thannigoPalette.background, borderRadius: 20, borderWidth: 1, borderColor: thannigoPalette.borderSoft },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: ADMIN_ACCENT, borderColor: ADMIN_ACCENT },
  checkLabel: { fontSize: 15, fontWeight: '800', color: thannigoPalette.darkText },
  checkSub: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontWeight: '800', color: '#94a3b8', fontSize: 15 },
  saveBtn: { flex: 1.5, backgroundColor: ADMIN_ACCENT, padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: ADMIN_ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 },
  saveText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
