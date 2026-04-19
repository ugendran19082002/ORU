import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/providers/ThemeContext';
import { useAppSession } from '@/hooks/use-app-session';
import { roleAccent, roleSurface } from '@/constants/theme';
import type { MaintenanceConfig } from '@/hooks/use-maintenance';

interface Props {
  visible: boolean;
  config: MaintenanceConfig;
  onRecheck: () => void;
}

export function MaintenanceScreen({ visible, config, onRecheck }: Props) {
  const { colors, isDark } = useAppTheme();
  const { user } = useAppSession();
  const role = (user?.role ?? 'guest') as keyof typeof roleAccent;
  const accent = roleAccent[role] ?? '#006878';
  const softBg = roleSurface[role] ?? '#F1F3F5';
  const darkSoftBg = `${accent}22`;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(60)).current;
  const gearSpin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [rechecking, setRechecking] = React.useState(false);

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 450, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.timing(gearSpin, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    return () => { loop.stop(); pulseLoop.stop(); };
  }, [visible]);

  const spinDeg = gearSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleRecheck = async () => {
    setRechecking(true);
    await onRecheck();
    setTimeout(() => setRechecking(false), 1000);
  };

  const hasWindow = config.startTime && config.endTime;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(5,12,20,0.98)' : 'rgba(245,250,255,0.98)' }]}>

        {/* Decorative rings */}
        <View style={[styles.ringOuter, { borderColor: isDark ? `${accent}20` : `${accent}12` }]} />
        <View style={[styles.ringInner, { borderColor: isDark ? `${accent}35` : `${accent}22` }]} />

        <Animated.View style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeIn, transform: [{ translateY: slideUp }] }
        ]}>

          {/* Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }] }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? darkSoftBg : softBg }]}>
              <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
                <Ionicons name="settings-outline" size={46} color={accent} />
              </Animated.View>
              <View style={[styles.iconBadge, { backgroundColor: accent }]}>
                <Ionicons name="construct" size={14} color="white" />
              </View>
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>Under Maintenance</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {config.message || "We're performing scheduled maintenance to improve your experience."}
          </Text>

          {/* Time window */}
          {hasWindow && (
            <View style={[styles.timeBox, { backgroundColor: isDark ? `${accent}18` : `${accent}10`, borderColor: isDark ? `${accent}40` : `${accent}25` }]}>
              <Ionicons name="time-outline" size={16} color={accent} />
              <Text style={[styles.timeLabel, { color: accent }]}>Maintenance window:</Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>{config.startTime} – {config.endTime}</Text>
            </View>
          )}

          {/* Info tips */}
          <View style={[styles.tipsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
            {[
              { icon: 'shield-checkmark-outline', text: 'Your data is safe and untouched' },
              { icon: 'flash-outline',            text: "We're working to finish quickly" },
              { icon: 'notifications-outline',    text: 'App will resume automatically' },
            ].map(tip => (
              <View key={tip.text} style={styles.tipRow}>
                <Ionicons name={tip.icon as any} size={15} color={accent} />
                <Text style={[styles.tipText, { color: colors.muted }]}>{tip.text}</Text>
              </View>
            ))}
          </View>

          {/* Recheck button */}
          <TouchableOpacity
            style={[styles.recheckBtn, { backgroundColor: accent }]}
            onPress={handleRecheck}
            disabled={rechecking}
            activeOpacity={0.8}
          >
            <Ionicons name={rechecking ? 'hourglass-outline' : 'refresh-outline'} size={18} color="white" />
            <Text style={styles.recheckText}>{rechecking ? 'Checking…' : 'Check Again'}</Text>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.muted }]}>ThanniGo · We'll be back soon</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  ringOuter: { position: 'absolute', width: 360, height: 360, borderRadius: 180, borderWidth: 1 },
  ringInner: { position: 'absolute', width: 230, height: 230, borderRadius: 115, borderWidth: 1 },
  card: {
    width: '100%', maxWidth: 380, borderRadius: 28, borderWidth: 1,
    padding: 28, alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10,
  },
  iconWrap: { marginBottom: 4 },
  iconCircle: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconBadge: { position: 'absolute', bottom: 6, right: 6, borderRadius: 10, padding: 4 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, fontWeight: '500' },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, width: '100%', flexWrap: 'wrap' },
  timeLabel: { fontSize: 12, fontWeight: '700' },
  timeValue: { fontSize: 13, fontWeight: '800' },
  tipsBox: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 14, gap: 10, marginVertical: 2 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { fontSize: 13, fontWeight: '500', flex: 1 },
  recheckBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 18, marginTop: 4 },
  recheckText: { color: 'white', fontSize: 16, fontWeight: '800' },
  hint: { fontSize: 11, textAlign: 'center', lineHeight: 16, opacity: 0.6 },
});
