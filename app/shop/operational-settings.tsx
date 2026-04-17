import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { BackButton } from '@/components/ui/BackButton';
import { shopApi } from '@/api/shopApi';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useAndroidBackHandler } from '@/hooks/use-back-handler';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { PanResponder } from 'react-native';

import { Shadow, thannigoPalette, roleAccent, roleSurface, roleGradients } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;
const SHOP_GRAD: [string, string] = [roleGradients.shop_owner.start, roleGradients.shop_owner.end];


export default function ShopOperationalSettingsScreen() {
  const router = useRouter();
  const { safeBack } = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [invoicePrefix, setInvoicePrefix] = useState('WD');

  // Distance-based fields
  const [perKmCharge, setPerKmCharge] = useState(0);
  const [freeKm, setFreeKm] = useState(0);
  const [maxRange, setMaxRange] = useState(5);
  const [floorCharge, setFloorCharge] = useState(0);

  useAndroidBackHandler(() => {
    safeBack('/shop/settings');
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settings = await shopApi.getShopSettings();
      if (settings) {
        setMinOrderAmount(String(settings.min_order_amount || '0'));
        setDeliveryCharge(String(settings.base_delivery_charge || '0'));
        setInvoicePrefix(settings.invoice_prefix || 'WD');
        
        // Load distance & floor fields
        setPerKmCharge(Number(settings.delivery_charge_per_km || 0));
        setFreeKm(Number(settings.free_delivery_upto_km || 0));
        setMaxRange(Number(settings.delivery_limit_per_km || 5));
        setFloorCharge(Number(settings.floor_charge_per_floor || 0));
      }
    } catch (error) {
      console.error('[OperationalSettings] Fetch failed:', error);
      Toast.show({ type: 'error', text1: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await shopApi.updateShopSettings({
        min_order_amount: parseFloat(minOrderAmount) || 0,
        base_delivery_charge: parseFloat(deliveryCharge) || 0,
        invoice_prefix: invoicePrefix,
        // Save distance & floor fields
        delivery_charge_per_km: perKmCharge,
        free_delivery_upto_km: freeKm,
        delivery_limit_per_km: maxRange,
        floor_charge_per_floor: floorCharge,
      });
      
      Toast.show({ type: 'success', text1: 'Settings Saved', text2: 'Your operational rules have been updated.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('[OperationalSettings] Save failed:', error);
      Toast.show({ type: 'error', text1: 'Save Failed' });
    } finally {
      setSaving(false);
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Operational Rules</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={SHOP_ACCENT} />
            <Text style={styles.infoText}>
              These rules define your shop's pricing and compliance standards. Updates apply immediately to all new orders.
            </Text>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={SHOP_ACCENT} />
              <Text style={styles.loadingText}>Loading configurations...</Text>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="cart-outline" size={16} color="#64748b" />
                  <Text style={styles.inputLabel}>Minimum Order Amount</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={minOrderAmount}
                  onChangeText={setMinOrderAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.hintText}>Orders below this amount will not be accepted. (₹)</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="bicycle-outline" size={16} color="#64748b" />
                  <Text style={styles.inputLabel}>Base Delivery Charge</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={deliveryCharge}
                  onChangeText={setDeliveryCharge}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Text style={styles.hintText}>Starting delivery fee added to every order. (₹)</Text>
              </View>

              {/* DISTANCE BASED CONTROLS */}
              <View style={styles.divider} />
              <Text style={styles.sectionHeader}>Distance Based Delivery</Text>
              
              <Stepper 
                label="Delivery Charge per KM" 
                value={perKmCharge} 
                onUpdate={setPerKmCharge} 
                unit="₹" 
              />
              <Text style={styles.hintText}>Additional cost for every KM beyond the free limit.</Text>

              <View style={{ marginTop: 16 }}>
                <DraggableSlider 
                  label="Free Delivery threshold" 
                  value={freeKm} 
                  onUpdate={setFreeKm} 
                  min={0} max={10} unit=" KM" step={0.5} 
                />
                <Text style={styles.hintText}>Orders within this distance only pay the base charge.</Text>
              </View>

              <View style={{ marginTop: 16 }}>
                <CustomDropdown 
                  label="Max Support Range" 
                  value={maxRange} 
                  onUpdate={setMaxRange} 
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 40, 50]} 
                  unit=" KM" 
                />
                <Text style={styles.hintText}>The widest radius your shop can fulfill.</Text>
              </View>


              <View style={styles.divider} />
              <Text style={styles.sectionHeader}>Floor Based Charges</Text>
              
              <Stepper 
                label="Floor Charge per Floor" 
                value={floorCharge} 
                onUpdate={setFloorCharge} 
                unit="₹" 
              />
              <Text style={styles.hintText}>Additional cost for carrying cans to higher floors (per floor).</Text>


              <View style={styles.divider} />
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="receipt-outline" size={16} color="#64748b" />
                  <Text style={styles.inputLabel}>Invoice Prefix</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={invoicePrefix}
                  onChangeText={setInvoicePrefix}
                  autoCapitalize="characters"
                  maxLength={10}
                  placeholder="WD"
                />
                <Text style={styles.hintText}>Custom prefix for your order numbers (e.g. TG). Default: WD</Text>
              </View>


              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="white" />
                    <Text style={styles.saveBtnText}>Update Rules</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface StepperProps {
  label: string;
  value: number;
  onUpdate: (value: number) => void;
  unit?: string;
}

const Stepper = ({ label, value, onUpdate, unit = '' }: StepperProps) => {
  const increment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(Number(value) + 1);
  };
  const decrement = () => {
    if (value <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(Math.max(0, Number(value) - 1));
  };

  return (
    <View style={styles.hybridRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <View style={styles.stepperContainer}>
        <TouchableOpacity onPress={decrement} style={styles.stepperBtn}>
          <Ionicons name="remove" size={20} color={SHOP_ACCENT} />
        </TouchableOpacity>
        <TextInput
          style={styles.stepperInput}
          value={String(value)}
          onChangeText={(v) => onUpdate(parseFloat(v) || 0)}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <TouchableOpacity onPress={increment} style={styles.stepperBtn}>
          <Ionicons name="add" size={20} color={SHOP_ACCENT} />
        </TouchableOpacity>
        <Text style={styles.stepperUnit}>{unit}</Text>
      </View>
    </View>
  );
};

interface DropdownProps {
  label: string;
  value: number;
  onUpdate: (value: number) => void;
  options: number[];
  unit?: string;
}

const CustomDropdown = ({ label, value, onUpdate, options: initialOptions, unit = '' }: DropdownProps) => {
  // Ensure the current value is in the options list so it always shows as selected
  const options = React.useMemo(() => {
    const list = [...initialOptions];
    if (value && !list.includes(value)) {
      list.push(value);
      list.sort((a, b) => a - b);
    }
    return list;
  }, [initialOptions, value]);

  return (
    <View style={styles.hybridColumn}>
      <View style={styles.labelRowHybrid}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Text style={styles.sliderValueHighlight}>{value}{unit}</Text>
      </View>
      <View style={styles.dropdownContainerHybrid}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ gap: 8, paddingRight: 24, paddingVertical: 4 }}
        >
          {options.map((opt: number) => (
            <TouchableOpacity 
              key={opt}
              activeOpacity={0.6}
              onPress={() => {
                console.log(`[Dropdown] Selected ${label}:`, opt);
                Haptics.selectionAsync();
                onUpdate(opt);
              }}
              style={[
                styles.chip,
                value === opt && styles.activeChip
              ]}
            >
              <Text style={[styles.chipText, value === opt && styles.activeChipText]}>
                {opt}{unit}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

interface SliderProps {
  label: string;
  value: number;
  onUpdate: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
  step?: number;
}

const DraggableSlider = ({ label, value, onUpdate, min, max, unit = '', step = 1 }: SliderProps) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = React.useRef(0);
  const isDragging = React.useRef(false);
  const valueRef = React.useRef(value);
  const startValue = React.useRef(value);

  // Sync valueRef whenever value changes
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  
  // Animated value for visual progress (0 to 1)
  const animProgress = React.useRef(new Animated.Value((value - min) / (max - min))).current;

  // Sync animation value when the prop 'value' changes (unless we are dragging)
  useEffect(() => {
    if (!isDragging.current) {
      Animated.spring(animProgress, {
        toValue: (value - min) / (max - min),
        useNativeDriver: false,
        tension: 100,
        friction: 12
      }).start();
    }
  }, [value, min, max]);

  const updateFromDelta = (dx: number) => {
    const width = sliderWidthRef.current;
    if (width <= 0) return;
    
    const deltaValue = (dx / width) * (max - min);
    let newVal = startValue.current + deltaValue;
    
    newVal = Math.max(min, Math.min(max, newVal));
    newVal = Math.round(newVal / step) * step;
    newVal = parseFloat(newVal.toFixed(2));
    
    if (newVal !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUpdate(newVal);
    }
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: any, gestureState: any) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) || Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        startValue.current = valueRef.current;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_: any, gestureState: any) => {
        const width = sliderWidthRef.current;
        if (width > 0) {
          const newProgress = ((startValue.current - min) / (max - min)) + (gestureState.dx / width);
          animProgress.setValue(Math.max(0, Math.min(1, newProgress)));
        }
        updateFromDelta(gestureState.dx);
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        // Final snap to ensure alignment
        Animated.spring(animProgress, {
          toValue: (valueRef.current - min) / (max - min),
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      }
    })
  ).current;

  const fillWidth = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.sliderGroup, { paddingHorizontal: 4 }]}>
      <View style={styles.sliderHeader}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.inputLabel}>{label}</Text>
        </View>
        <View style={styles.sliderInputContainer}>
          <TextInput
            style={styles.sliderInput}
            value={String(value)}
            onChangeText={(val) => {
              const num = parseFloat(val);
              if (!isNaN(num)) onUpdate(num);
              else if (val === '') onUpdate(0);
            }}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Text style={styles.sliderUnitDisplay}>{unit}</Text>
        </View>
      </View>
      
      <View 
        {...panResponder.panHandlers}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          sliderWidthRef.current = w;
          setSliderWidth(w);
        }}
        style={styles.sliderTrackContainer}
      >
        <View style={styles.sliderTrack}>
          <Animated.View style={[styles.sliderFill, { width: fillWidth }]} />
          {/* Draggable Thumb */}
          <Animated.View style={[styles.sliderThumb, { left: fillWidth }]}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.92)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  roleLabel: { fontSize: 9, fontWeight: '700', color: SHOP_ACCENT, letterSpacing: 1.5, marginTop: 3 },
  content: { paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 120 },
  titleRow: { marginBottom: 18 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  infoCard: {
    flexDirection: 'row', backgroundColor: '#e0f0ff', padding: 16, borderRadius: 16,
    marginBottom: 24, alignItems: 'center', gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: SHOP_ACCENT, lineHeight: 18, fontWeight: '600' },
  centered: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  form: { gap: 24 },
  inputGroup: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: thannigoPalette.neutral },
  input: {
    backgroundColor: 'white', borderRadius: 14, height: 56, paddingHorizontal: 16,
    fontSize: 18, fontWeight: '700', color: thannigoPalette.darkText,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  hintText: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginLeft: 4, marginTop: -4 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  sectionHeader: { fontSize: 16, fontWeight: '900', color: thannigoPalette.darkText, marginBottom: 4 },
  
  sliderGroup: { gap: 12, marginTop: 8 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sliderInputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#fff', borderRadius: 10, 
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#e2e8f0',
    minWidth: 80, justifyContent: 'flex-end'
  },
  sliderInput: { 
    fontSize: 16, fontWeight: '900', color: SHOP_ACCENT, 
    padding: 0, textAlign: 'right', minWidth: 40
  },
  sliderUnitDisplay: { fontSize: 13, fontWeight: '700', color: thannigoPalette.neutral, marginLeft: 4 },
  sliderTrackContainer: { gap: 12, paddingVertical: 12 },

  hybridRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  hybridColumn: { gap: 10, marginTop: 16 },
  labelRowHybrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sliderValueHighlight: { fontSize: 16, fontWeight: '900', color: SHOP_ACCENT },
  
  stepperContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#fff', borderRadius: 12, 
    borderWidth: 1, borderColor: '#e2e8f0',
    padding: 4
  },
  stepperBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  stepperInput: { 
    width: 50, textAlign: 'center', fontSize: 16, 
    fontWeight: '800', color: SHOP_ACCENT 
  },
  stepperUnit: { fontSize: 12, fontWeight: '700', color: thannigoPalette.neutral, marginRight: 10 },
  
  dropdownContainer: { flex: 2, marginLeft: 12 },
  dropdownContainerHybrid: { marginTop: 4 },
  chip: { 
    paddingHorizontal: 14, paddingVertical: 8, 
    borderRadius: 10, backgroundColor: thannigoPalette.borderSoft,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  activeChip: { backgroundColor: SHOP_ACCENT, borderColor: SHOP_ACCENT },
  chipText: { fontSize: 13, fontWeight: '700', color: thannigoPalette.neutral },
  activeChipText: { color: 'white' },
  sliderTrack: { height: 10, backgroundColor: '#e0f0ff', borderRadius: 5, position: 'relative' },
  sliderFill: { height: '100%', backgroundColor: SHOP_ACCENT, borderRadius: 5 },
  sliderThumb: { 
    position: 'absolute', top: -10, width: 30, height: 30, 
    borderRadius: 15, backgroundColor: 'white', 
    justifyContent: 'center', alignItems: 'center',
    marginLeft: -15, // Center the thumb on the point
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
    borderWidth: 2, borderColor: SHOP_ACCENT,
  },
  sliderThumbInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: SHOP_ACCENT },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  rangeLabelText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },

  saveBtn: {
    backgroundColor: SHOP_ACCENT, height: 60, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 20, shadowColor: SHOP_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
