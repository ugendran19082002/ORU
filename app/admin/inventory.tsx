import React, { useState } from 'react';
import { View, Text, ScrollView,
  RefreshControl, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';

interface Category {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_1', name: '20L Normal Water Can', unit: '20L', isActive: true },
  { id: 'cat_2', name: '20L Bisleri Water', unit: '20L', isActive: true },
  { id: 'cat_3', name: '10L Bisleri Water', unit: '10L', isActive: false },
];

export default function AdminInventoryMasterScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatUnit, setNewCatUnit] = useState('');

  const toggleCategory = (id: string) => {
    setCategories(cats => cats.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleAddCategory = () => {
    if (!newCatName.trim() || !newCatUnit.trim()) return;
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCatName,
      unit: newCatUnit,
      isActive: true,
    };
    setCategories([newCat, ...categories]);
    setNewCatName('');
    setNewCatUnit('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.pageTitle}>Master Inventory</Text>
          <Text style={styles.pageSub}>Global category configurations for all shops</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addBtnText}>Add Category</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005d90']} tintColor="#005d90" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{categories.length}</Text>
            <Text style={styles.statLabel}>Total Categories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{categories.filter(c => c.isActive).length}</Text>
            <Text style={styles.statLabel}>Active Global</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>All Categories</Text>
            <Ionicons name="filter" size={18} color="#707881" />
          </View>

          {categories.map((cat, index) => (
            <View key={cat.id}>
              <View style={[styles.row, !cat.isActive && { opacity: 0.6 }]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="water" size={20} color="#005d90" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.catName, !cat.isActive && { textDecorationLine: 'line-through' }]}>
                    {cat.name}
                  </Text>
                  <Text style={styles.catUnit}>Unit: {cat.unit}</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.toggleBtn, cat.isActive ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text style={[styles.toggleText, cat.isActive ? styles.toggleTextActive : styles.toggleTextInactive]}>
                    {cat.isActive ? 'Active' : 'Disabled'}
                  </Text>
                </TouchableOpacity>
              </View>
              {index < categories.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ADD CATEGORY MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Master Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#707881" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput 
                style={styles.inputField} 
                placeholder="e.g. 20L Premium Bisleri" 
                value={newCatName}
                onChangeText={setNewCatName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit Measurement</Text>
              <TextInput 
                style={styles.inputField} 
                placeholder="e.g. 20L, 5L, 1L" 
                value={newCatUnit}
                onChangeText={setNewCatUnit}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddCategory}>
              <Text style={styles.submitBtnText}>Create Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f4f9' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 20, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#e0e2e8'
  },
  headerTextWrap: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#181c20', letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: '#707881', marginTop: 2 },
  addBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: '#005d90', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 
  },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },

  scrollContent: { padding: 24, paddingBottom: 100 },

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { 
    flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#e0e2e8', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 1
  },
  statVal: { fontSize: 28, fontWeight: '900', color: '#181c20', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#707881', textTransform: 'uppercase' },

  listContainer: { backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e0e2e8' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#181c20' },
  
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '800', color: '#181c20', marginBottom: 2 },
  catUnit: { fontSize: 13, color: '#707881', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 58 },

  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#e8f5e9' },
  toggleBtnInactive: { backgroundColor: '#ffebee' },
  toggleText: { fontSize: 11, fontWeight: '800' },
  toggleTextActive: { color: '#2e7d32' },
  toggleTextInactive: { color: '#c62828' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#181c20' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f4f9', alignItems: 'center', justifyContent: 'center' },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#707881', marginBottom: 8, marginLeft: 4 },
  inputField: { backgroundColor: '#f1f4f9', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, fontWeight: '600', color: '#181c20' },

  submitBtn: { backgroundColor: '#005d90', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
});
