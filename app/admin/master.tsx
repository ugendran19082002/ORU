import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, Alert, useWindowDimensions, RefreshControl, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSession } from '@/providers/AppSessionProvider';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

import { apiClient } from '@/api/client';

interface Category {
  id: number;
  name_en: string;
  name_ta: string;
  sort_order: number;
  Subcategories?: Subcategory[];
}

interface Subcategory {
  id: number;
  category_id: number;
  name_en: string;
  name_ta: string;
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
      // We'll use the system API since it already returns the tree
      const res = await apiClient.get('/system/categories');
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

  // --- Category Handlers ---
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
      <View style={[styles.header, isDesktop && { paddingHorizontal: 40, height: 100 }]}>
        <View>
          <Text style={[styles.title, isDesktop && { fontSize: 32 }]}>Master Menu</Text>
          <Text style={styles.subtitle}>Manage global categories and product hierarchy</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddCat} activeOpacity={0.8}>
           <LinearGradient colors={['#005d90', '#0077b6']} style={styles.addBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addBtnText}>New Category</Text>
           </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scroll, isDesktop && { paddingHorizontal: width * 0.1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMasterData(); }} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#005d90" style={{ marginTop: 100 }} />
        ) : categories.map((cat) => (
          <View key={cat.id} style={styles.catCard}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.catHeader} 
              onPress={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            >
              <View style={styles.catInfo}>
                <View style={styles.chevronWrap}>
                  <Ionicons name={expandedCat === cat.id ? "chevron-down" : "chevron-forward"} size={18} color="#005d90" />
                </View>
                <View>
                  <Text style={styles.catName}>{cat.name_en}</Text>
                  <Text style={styles.catSubText}>{cat.Subcategories?.length || 0} items configured</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditCat(cat)}>
                  <Ionicons name="pencil-outline" size={16} color="#005d90" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => deleteCategory(cat.id)}>
                  <Ionicons name="trash-outline" size={16} color="#ba1a1a" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {expandedCat === cat.id && (
              <View style={styles.subList}>
                {cat.Subcategories?.map((sub) => (
                  <View key={sub.id} style={styles.subItem}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={styles.subDot} />
                      <View>
                        <Text style={styles.subName}>{sub.name_en}</Text>
                        {sub.is_water_can && (
                          <View style={styles.waterBadge}>
                            <Ionicons name="water" size={8} color="#0369a1" />
                            <Text style={styles.waterText}>Water Logic</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditSub(sub)}>
                        <Ionicons name="pencil-outline" size={14} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => deleteSubcategory(sub.id)}>
                        <Ionicons name="trash-outline" size={14} color="#ba1a1a" />
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
                    <Ionicons name="add" size={16} color="#005d90" />
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
                  <Text style={styles.checkSub}>Enable deposit/return management for this item</Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, paddingBottom: 32, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  addBtn: { borderRadius: 16, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  
  scroll: { padding: 20, paddingBottom: 100 },
  catCard: { backgroundColor: 'white', borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2, overflow: 'hidden' },
  catHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chevronWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  catSubText: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 1 },
  
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  
  subList: { padding: 20, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f8fafc', backgroundColor: '#fafbfc' },
  subItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center' },
  subDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  subName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  waterBadge: { backgroundColor: '#e0f2fe', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  waterText: { fontSize: 10, color: '#0369a1', fontWeight: '800', textTransform: 'uppercase' },
  
  addSubBtn: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  addSubIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e0f2fe' },
  addSubText: { fontSize: 14, fontWeight: '800', color: '#005d90' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '92%', maxWidth: 440, backgroundColor: 'white', borderRadius: 32, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 24, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '600', color: '#1e293b', borderWidth: 1, borderColor: '#f1f5f9' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWeight: 2, borderColor: '#e2e8f0', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  checkLabel: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  checkSub: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontWeight: '800', color: '#94a3b8', fontSize: 15 },
  saveBtn: { flex: 1.5, backgroundColor: '#005d90', padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#005d90', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 },
  saveText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
