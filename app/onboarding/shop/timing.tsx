import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView
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
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ShopTimingScreen() {
  const router = useRouter();
  const { user } = useAppSession();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  const [openingTime, setOpeningTime] = useState(new Date(2021, 0, 1, 9, 0)); // Default 9 AM
  const [closingTime, setClosingTime] = useState(new Date(2021, 0, 1, 21, 0)); // Default 9 PM
  
  const [showPicker, setShowPicker] = useState<'open' | 'close' | null>(null);

  // 1. Resolve actual Shop ID
  React.useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
        } else {
          router.replace('/onboarding/shop/create');
        }
      } catch (err: any) {
        if (err.response?.status === 404) router.replace('/onboarding/shop/create');
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleSave = async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      
      // Convert to HH:mm:ss for backend
      const openStr = openingTime.toTimeString().split(' ')[0];
      const closeStr = closingTime.toTimeString().split(' ')[0];

      const res = await onboardingApi.updateStoreTiming(shopId, {
        opening_time: openStr,
        closing_time: closeStr,
      });

      if (res.status === 1) {
        router.replace('/onboarding/shop');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Could not save timing.'
      });
    } finally {
      setLoading(false);
    }
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(null);
    if (selectedDate) {
      if (showPicker === 'open') setOpeningTime(selectedDate);
      else if (showPicker === 'close') setClosingTime(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <BackButton fallback="/onboarding/shop" />
              <View style={{ marginTop: 24 }}>
                <Text style={styles.title}>Shop Timing</Text>
                <Text style={styles.subtitle}>Define when your store is open for business. Orders can only be placed during these hours.</Text>
              </View>
            </View>

            {fetchingShop ? (
              <ActivityIndicator size="large" color="#006878" style={{ marginTop: 60 }} />
            ) : (
              <View style={styles.flow}>
                
                {/* TIMING SELECTORS */}
                <View style={[styles.timeCard, showPicker === 'open' && styles.timeCardActive]}>
                  <View style={styles.timeInfo}>
                    <View style={[styles.iconWrap, { backgroundColor: '#e0f7fa' }]}>
                      <Ionicons name="sunny" size={24} color="#006878" />
                    </View>
                    <View>
                      <Text style={styles.timeLabel}>Opening Time</Text>
                      <Text style={styles.timeValue}>{formatTime(openingTime)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.changeBtn} onPress={() => setShowPicker('open')}>
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.timeCard, showPicker === 'close' && styles.timeCardActive]}>
                  <View style={styles.timeInfo}>
                    <View style={[styles.iconWrap, { backgroundColor: '#fff3e0' }]}>
                      <Ionicons name="moon" size={24} color="#e65100" />
                    </View>
                    <View>
                      <Text style={styles.timeLabel}>Closing Time</Text>
                      <Text style={styles.timeValue}>{formatTime(closingTime)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.changeBtn} onPress={() => setShowPicker('close')}>
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* PICKER (Inline for iOS, Modal for Android) */}
                {showPicker && (
                  <View style={styles.pickerWrap}>
                    <Text style={styles.pickerTitle}>Select {showPicker === 'open' ? 'Opening' : 'Closing'} Time</Text>
                    <DateTimePicker
                      value={showPicker === 'open' ? openingTime : closingTime}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onPickerChange}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity style={styles.closePicker} onPress={() => setShowPicker(null)}>
                        <Text style={styles.closePickerText}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.tipBox}>
                  <Ionicons name="bulb-outline" size={20} color="#006878" />
                  <Text style={styles.tipText}>Most water suppliers open between 8:00 AM and 9:00 PM. You can change these anytime from settings.</Text>
                </View>

              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSave} disabled={loading || fetchingShop} activeOpacity={0.8}>
              <LinearGradient
                colors={['#006878', '#134e4a']}
                style={styles.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.ctaText}>Save Schedule</Text>
                    <Ionicons name="time" size={20} color="white" />
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingBottom: 40 },
  
  header: { marginBottom: 30, paddingTop: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#134e4a', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 },

  flow: { gap: 16 },
  timeCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  timeCardActive: { borderColor: '#006878', backgroundColor: '#f0fdfa' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  timeLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  timeValue: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  
  changeBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  changeBtnText: { color: '#006878', fontWeight: '800', fontSize: 13 },

  pickerWrap: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  pickerTitle: { textAlign: 'center', fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  closePicker: { backgroundColor: '#006878', padding: 12, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  closePickerText: { color: 'white', fontWeight: '800' },

  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#ccfbf1',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    marginTop: 10,
    alignItems: 'flex-start'
  },
  tipText: { flex: 1, fontSize: 13, color: '#134e4a', lineHeight: 20, fontWeight: '600' },

  footer: { padding: 32, backgroundColor: '#f8fafc' },
  cta: {
    height: 64,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#134e4a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  ctaText: { color: 'white', fontSize: 18, fontWeight: '800' }
});
