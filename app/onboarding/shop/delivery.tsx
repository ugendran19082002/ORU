import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Animated, PanResponder, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSession } from '@/hooks/use-app-session';
import { useStepBackHandler } from '@/hooks/use-step-back-handler';
import { onboardingApi } from '@/api/onboardingApi';
import { BackButton } from '@/components/ui/BackButton';
import { useAppTheme } from '@/providers/ThemeContext';

export default function ShopDeliveryConfigScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [shopId, setShopId] = useState<number | null>(null);

  useStepBackHandler('/onboarding/shop');

  const [minOrder, setMinOrder] = useState('0');
  const [baseCharge, setBaseCharge] = useState('0');
  const [invoicePrefix, setInvoicePrefix] = useState('WD');
  const [perKmCharge, setPerKmCharge] = useState(0);
  const [freeKm, setFreeKm] = useState(0);
  const [maxRange, setMaxRange] = useState(5);
  const [floorCharge, setFloorCharge] = useState(0);
  const [freeFloor, setFreeFloor] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await onboardingApi.getMerchantShop();
        if (res.data) {
          setShopId(res.data.id);
          const d = res.data.metadata?.delivery_setup ?? res.data;
          setMinOrder(String(d.min_order_value ?? res.data.min_order_value ?? '0'));
          setBaseCharge(String(d.base_delivery_charge ?? res.data.base_delivery_charge ?? '0'));
          setInvoicePrefix(d.invoice_prefix ?? res.data.invoice_prefix ?? 'WD');
          setPerKmCharge(Number(d.delivery_charge_per_km ?? res.data.delivery_charge_per_km ?? 0));
          setFreeKm(Number(d.free_delivery_upto_km ?? res.data.free_delivery_upto_km ?? 0));
          setMaxRange(Number(d.delivery_limit_per_km ?? res.data.delivery_limit_per_km ?? 5));
          setFloorCharge(Number(d.floor_charge_per_floor ?? res.data.floor_charge_per_floor ?? 0));
          setFreeFloor(Number(d.free_delivery_upto_floor ?? res.data.free_delivery_upto_floor ?? 0));
        } else {
          router.replace('/onboarding/shop/basic-details');
        }
      } catch (err: any) {
        if (err.response?.status === 404) router.replace('/onboarding/shop/basic-details');
      } finally {
        setFetchingShop(false);
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (!shopId) {
      Toast.show({ type: 'info', text1: 'Complete Basic Details First' });
      router.replace('/onboarding/shop/basic-details');
      return;
    }
    try {
      setLoading(true);
      const res = await onboardingApi.updateDeliverySetup(shopId, {
        is_self_delivery: true,
        min_order_value: parseFloat(minOrder) || 0,
        base_delivery_charge: parseFloat(baseCharge) || 0,
        invoice_prefix: invoicePrefix || 'WD',
        delivery_charge_per_km: perKmCharge,
        free_delivery_upto_km: freeKm,
        delivery_limit_per_km: maxRange,
        floor_charge_per_floor: floorCharge,
        free_delivery_upto_floor: freeFloor,
      });
      if (res.status === 1) router.replace('/onboarding/shop');
    } catch (error: any) {
      if (error.response?.status === 404) return;
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Could not save delivery settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <BackButton fallback="/onboarding/shop" style={{ marginBottom: 16 }} />
            <Text style={[styles.title, { color: colors.text }]}>Delivery Pricing</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Set your delivery fees and service range. You can update these anytime later from your settings.</Text>
          </View>

          {fetchingShop ? (
            <ActivityIndicator size="large" color="#006878" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.content}>

              {/* Base Charges */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="cart-outline" size={16} color="#64748b" />
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Minimum Order Amount</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={minOrder}
                  onChangeText={setMinOrder}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.hintText}>Orders below this amount will not be accepted. (₹)</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="bicycle-outline" size={16} color="#64748b" />
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Base Delivery Charge</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={baseCharge}
                  onChangeText={setBaseCharge}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.hintText}>Starting delivery fee added to every order. (₹)</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Distance Based Delivery</Text>

              <Stepper label="Delivery Charge per KM" value={perKmCharge} onUpdate={setPerKmCharge} unit="₹" colors={colors} />
              <Text style={[styles.hintText, { marginTop: 4 }]}>Additional cost for every KM beyond the free limit.</Text>

              <View style={{ marginTop: 16 }}>
                <DraggableSlider label="Free Delivery Threshold" value={freeKm} onUpdate={setFreeKm} min={0} max={10} unit=" KM" step={0.5} colors={colors} />
                <Text style={styles.hintText}>Orders within this distance only pay the base charge.</Text>
              </View>

              <View style={{ marginTop: 16 }}>
                <CustomDropdown
                  label="Max Support Range"
                  value={maxRange}
                  onUpdate={setMaxRange}
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 40, 50]}
                  unit=" KM"
                  colors={colors}
                />
                <Text style={styles.hintText}>The widest radius your shop can fulfill.</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Floor Based Charges</Text>

              <Stepper label="Floor Charge per Floor" value={floorCharge} onUpdate={setFloorCharge} unit="₹" colors={colors} />
              <Text style={[styles.hintText, { marginTop: 4 }]}>Additional cost for carrying cans to higher floors (per floor).</Text>

              <View style={{ marginTop: 16 }}>
                <Stepper label="Free Delivery Upto Floor" value={freeFloor} onUpdate={setFreeFloor} colors={colors} />
                <Text style={[styles.hintText, { marginTop: 4 }]}>Floors up to this limit will not incur any floor charges.</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="receipt-outline" size={16} color="#64748b" />
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Invoice Prefix</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={invoicePrefix}
                  onChangeText={setInvoicePrefix}
                  autoCapitalize="characters"
                  maxLength={10}
                  placeholder="WD"
                  placeholderTextColor={colors.placeholder}
                />
                <Text style={styles.hintText}>Custom prefix for your order numbers (e.g. TG). Default: WD</Text>
              </View>

              <View style={[styles.featureCard, { backgroundColor: isDark ? '#0A1929' : '#f0f9ff', borderColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
                  <Ionicons name="bicycle" size={24} color="#006878" />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Self-Managed Delivery</Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>You or your staff will deliver the orders. You have full control over the delivery experience.</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
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
      </SafeAreaView>
    </View>
  );
}

// ─── Sub Components ───────────────────────────────────────────

const Stepper = ({ label, value, onUpdate, unit = '', colors }: any) => {
  const increment = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpdate(Number(value) + 1); };
  const decrement = () => { if (value <= 0) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpdate(Math.max(0, Number(value) - 1)); };
  return (
    <View style={styles.hybridRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>{label}</Text>
      </View>
      <View style={[styles.stepperContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <TouchableOpacity onPress={decrement} style={styles.stepperBtn}>
          <Ionicons name="remove" size={20} color="#006878" />
        </TouchableOpacity>
        <TextInput
          style={[styles.stepperInput, { color: colors.text }]}
          value={String(value)}
          onChangeText={(v) => onUpdate(parseFloat(v) || 0)}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <TouchableOpacity onPress={increment} style={styles.stepperBtn}>
          <Ionicons name="add" size={20} color="#006878" />
        </TouchableOpacity>
        {unit ? <Text style={styles.stepperUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
};

const DraggableSlider = ({ label, value, onUpdate, min, max, unit = '', step = 1, colors }: any) => {
  const sliderWidthRef = useRef(0);
  const isDragging = useRef(false);
  const valueRef = useRef(value);
  const startValue = useRef(value);
  const animProgress = useRef(new Animated.Value((value - min) / (max - min))).current;

  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    if (!isDragging.current) {
      Animated.spring(animProgress, { toValue: (value - min) / (max - min), useNativeDriver: false, tension: 100, friction: 12 }).start();
    }
  }, [value, min, max]);

  const updateFromDelta = (dx: number) => {
    const width = sliderWidthRef.current;
    if (width <= 0) return;
    let newVal = Math.max(min, Math.min(max, startValue.current + (dx / width) * (max - min)));
    newVal = parseFloat((Math.round(newVal / step) * step).toFixed(2));
    if (newVal !== value) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpdate(newVal); }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: any, g: any) => Math.abs(g.dx) > Math.abs(g.dy) || Math.abs(g.dx) > 5,
      onPanResponderGrant: () => {
        isDragging.current = true;
        startValue.current = valueRef.current;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_: any, g: any) => {
        const w = sliderWidthRef.current;
        if (w > 0) {
          const p = ((startValue.current - min) / (max - min)) + (g.dx / w);
          animProgress.setValue(Math.max(0, Math.min(1, p)));
        }
        updateFromDelta(g.dx);
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        Animated.spring(animProgress, { toValue: (valueRef.current - min) / (max - min), useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => { isDragging.current = false; },
    })
  ).current;

  const fillWidth = animProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.inputLabel, { color: colors.muted, flex: 1, marginRight: 12 }]}>{label}</Text>
        <View style={[styles.sliderInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <TextInput
            style={[styles.sliderInput, { color: '#006878' }]}
            value={String(value)}
            onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onUpdate(n); else if (v === '') onUpdate(0); }}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Text style={[styles.sliderUnitDisplay, { color: colors.muted }]}>{unit}</Text>
        </View>
      </View>
      <View
        {...panResponder.panHandlers}
        onLayout={(e) => { sliderWidthRef.current = e.nativeEvent.layout.width; }}
        style={styles.sliderTrackContainer}
      >
        <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.sliderFill, { width: fillWidth }]} />
          <Animated.View style={[styles.sliderThumb, { backgroundColor: colors.surface }, { left: fillWidth }]}>
            <View style={styles.sliderThumbInner} />
          </Animated.View>
        </View>
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabelText}>{min}{unit}</Text>
          <Text style={styles.rangeLabelText}>{max}{unit}</Text>
        </View>
      </View>
    </View>
  );
};

const CustomDropdown = ({ label, value, onUpdate, options: initialOptions, unit = '', colors }: any) => {
  const options = React.useMemo(() => {
    const list = [...initialOptions];
    if (value && !list.includes(value)) { list.push(value); list.sort((a: number, b: number) => a - b); }
    return list;
  }, [initialOptions, value]);

  return (
    <View style={styles.hybridColumn}>
      <View style={styles.labelRowHybrid}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={styles.sliderValueHighlight}>{value}{unit}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 24, paddingVertical: 4 }}>
        {options.map((opt: number) => (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.6}
            onPress={() => { Haptics.selectionAsync(); onUpdate(opt); }}
            style={[styles.chip, { backgroundColor: colors.inputBg, borderColor: colors.border }, value === opt && styles.activeChip]}
          >
            <Text style={[styles.chipText, { color: colors.muted }, value === opt && styles.activeChipText]}>{opt}{unit}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 40, paddingBottom: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 12, lineHeight: 22 },
  content: { gap: 24, marginBottom: 40 },

  inputGroup: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  inputLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  input: { borderRadius: 18, height: 60, paddingHorizontal: 16, fontSize: 18, fontWeight: '700', borderWidth: 1.5 },
  hintText: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginLeft: 4 },
  divider: { height: 1, marginVertical: 8 },
  sectionHeader: { fontSize: 16, fontWeight: '900', marginBottom: 4 },

  hybridRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, padding: 4 },
  stepperBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  stepperInput: { width: 50, textAlign: 'center', fontSize: 16, fontWeight: '800' },
  stepperUnit: { fontSize: 12, fontWeight: '700', color: '#64748b', marginRight: 10 },

  sliderGroup: { gap: 12 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, minWidth: 80, justifyContent: 'flex-end' },
  sliderInput: { fontSize: 16, fontWeight: '900', padding: 0, textAlign: 'right', minWidth: 40 },
  sliderUnitDisplay: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
  sliderTrackContainer: { gap: 12, paddingVertical: 8 },
  sliderTrack: { height: 8, borderRadius: 4, position: 'relative' },
  sliderFill: { height: '100%', backgroundColor: '#006878', borderRadius: 4 },
  sliderThumb: {
    position: 'absolute', top: -11, width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginLeft: -15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderWidth: 2, borderColor: '#006878'
  },
  sliderThumbInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006878' },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeLabelText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },

  hybridColumn: { gap: 12 },
  labelRowHybrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderValueHighlight: { fontSize: 16, fontWeight: '900', color: '#006878' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  activeChip: { backgroundColor: '#006878', borderColor: '#006878' },
  chipText: { fontSize: 13, fontWeight: '700' },
  activeChipText: { color: 'white' },

  featureCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1.5, gap: 16, marginTop: 12 },
  iconCircle: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSub: { fontSize: 12, marginTop: 2, lineHeight: 18 },

  footer: { padding: 32 },
  cta: { height: 64, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '800' },
});
