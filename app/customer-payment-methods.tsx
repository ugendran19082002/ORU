import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';

const SAVED_UPI = [
  { id: '1', vpa: 'rahul.s@okicici', app: 'Google Pay', icon: 'logo-google' },
  { id: '2', vpa: '9876543210@paytm', app: 'Paytm', icon: 'card-outline' },
];

const SAVED_CARDS = [
  { id: 'c1', mask: '**** 4589', brand: 'Visa', default: true },
];

export default function CustomerPaymentMethodsScreen() {
  const { safeBack } = useAppNavigation();
  useAndroidBackHandler(() => { safeBack('/(tabs)/profile'); });
  const [upiList, setUpiList] = useState(SAVED_UPI);
  const [cardList, setCardList] = useState(SAVED_CARDS);

  const handleAddUPI = () => {
    require('react-native').Alert.prompt('Add UPI ID', 'Enter your VPA (e.g., name@bank)', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: (val?: string) => {
          if (val) setUpiList([...upiList, { id: Date.now().toString(), vpa: val, app: 'Other UPI', icon: 'phone-portrait-outline' }]);
        }
      }
    ]);
  };

  const removeUPI = (id: string) => {
    setUpiList(upiList.filter(u => u.id !== id));
  };

  const removeCard = (id: string) => {
    setCardList(cardList.filter(c => c.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton fallback="/(tabs)/profile" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <Text style={styles.headerSub}>Manage your saved payment options</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        


        {/* UPI IDs */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved UPI IDs</Text>
          <TouchableOpacity onPress={handleAddUPI}>
            <Text style={styles.addBtnText}>+ Add New</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listCard}>
          {upiList.length === 0 ? (
            <Text style={styles.emptyText}>No UPI IDs saved.</Text>
          ) : upiList.map((upi, i) => (
            <View key={upi.id}>
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Ionicons name={upi.icon as any} size={20} color="#005d90" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{upi.vpa}</Text>
                  <Text style={styles.itemSub}>{upi.app}</Text>
                </View>
                <TouchableOpacity onPress={() => removeUPI(upi.id)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                  <Ionicons name="trash-outline" size={18} color="#ba1a1a" />
                </TouchableOpacity>
              </View>
              {i < upiList.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* CARDS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved Cards</Text>
          <TouchableOpacity onPress={() => {
            const cc = ['Visa', 'MasterCard', 'Amex'][Math.floor(Math.random() * 3)];
            const last4 = Math.floor(1000 + Math.random() * 9000);
            setCardList([...cardList, { id: Date.now().toString(), mask: `**** ${last4}`, brand: cc, default: false }]);
            Toast.show({
              type: 'success',
              text1: 'Card Added',
              text2: `Your ${cc} ending in ${last4} was saved securely.`
            });
          }}>
            <Text style={styles.addBtnText}>+ Add New</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listCard}>
          {cardList.length === 0 ? (
            <Text style={styles.emptyText}>No cards saved.</Text>
          ) : cardList.map((card, i) => (
            <View key={card.id}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: '#f8fafc' }]}>
                  <Ionicons name="card" size={20} color="#181c20" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{card.brand} {card.mask}</Text>
                  {card.default && <Text style={styles.defaultBadge}>Default</Text>}
                </View>
                <TouchableOpacity onPress={() => removeCard(card.id)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                  <Ionicons name="trash-outline" size={18} color="#ba1a1a" />
                </TouchableOpacity>
              </View>
              {i < cardList.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  content: { padding: 20, gap: 20, paddingBottom: 60 },
  

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -10, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181c20' },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#005d90' },
  
  listCard: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  emptyText: { fontSize: 13, color: '#707881', fontStyle: 'italic', paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#181c20', marginBottom: 2 },
  itemSub: { fontSize: 12, color: '#707881', fontWeight: '500' },
  defaultBadge: { alignSelf: 'flex-start', backgroundColor: '#e8f5e9', color: '#2e7d32', fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f1f4f9', marginLeft: 54 },
});
