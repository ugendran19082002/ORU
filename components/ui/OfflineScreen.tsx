import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/providers/ThemeContext';
import { useAppSession } from '@/hooks/use-app-session';
import { roleAccent, roleSurface } from '@/constants/theme';

interface OfflineScreenProps {
  visible: boolean;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function OfflineScreen({ visible, onRetry, isRetrying = false }: OfflineScreenProps) {
  const { colors, isDark } = useAppTheme();
  const { user } = useAppSession();
  const role = (user?.role ?? 'guest') as keyof typeof roleAccent;
  const accent = roleAccent[role] ?? '#005d90';
  const softBg = roleSurface[role] ?? '#F1F3F5';
  const darkSoftBg = `${accent}22`;

  // Pulse animation for the wifi icon
  const pulse = useRef(new Animated.Value(1)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Slide + fade in card
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 420, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Continuous pulse on icon
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  // Spinning retry animation
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isRetrying) {
      Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true })
      ).start();
    } else {
      spin.setValue(0);
    }
  }, [isRetrying]);

  const spinInterpolate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(10,15,25,0.97)' : 'rgba(248,250,252,0.98)' }]}>

        {/* Decorative circles */}
        <View style={[styles.circleOuter, { borderColor: isDark ? `${accent}26` : `${accent}14` }]} />
        <View style={[styles.circleInner, { borderColor: isDark ? `${accent}40` : `${accent}26` }]} />

        <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

          {/* Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }] }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? darkSoftBg : softBg }]}>
              <Ionicons name="wifi-outline" size={42} color={accent} />
              <View style={styles.iconSlash}>
                <Ionicons name="remove-outline" size={28} color={accent} style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
            </View>
          </Animated.View>

          {/* Text */}
          <Text style={[styles.title, { color: colors.text }]}>No Internet Connection</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            You're offline. Check your Wi-Fi or mobile data, then tap Retry to reconnect.
          </Text>

          {/* Tips */}
          <View style={[styles.tipsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
            {[
              { icon: 'wifi-outline',       text: 'Toggle Wi-Fi off and on' },
              { icon: 'phone-portrait-outline', text: 'Check mobile data is enabled' },
              { icon: 'airplane-outline',   text: 'Turn off Airplane mode' },
            ].map(tip => (
              <View key={tip.text} style={styles.tipRow}>
                <Ionicons name={tip.icon as any} size={15} color={colors.muted} />
                <Text style={[styles.tipText, { color: colors.muted }]}>{tip.text}</Text>
              </View>
            ))}
          </View>

          {/* Retry button */}
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: accent }]}
            onPress={onRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
              <Ionicons name="refresh-outline" size={18} color="white" />
            </Animated.View>
            <Text style={styles.retryText}>{isRetrying ? 'Checking…' : 'Retry Connection'}</Text>
          </TouchableOpacity>

          {/* Footer hint */}
          <Text style={[styles.hint, { color: colors.muted }]}>
            ThanniGo requires an internet connection to show shops and place orders.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Decorative background rings
  circleOuter: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
  },
  circleInner: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
  },

  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },

  iconWrap: { marginBottom: 4 },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconSlash: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },

  tipsBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginVertical: 4,
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { fontSize: 13, fontWeight: '500' },

  retryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },

  hint: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.7,
  },
});
