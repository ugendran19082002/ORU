import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList,
  TouchableOpacity, Animated, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Pure Hydration,\n Delivered Fast',
    description: 'Get high-quality purified water delivered to your doorstep within 15 minutes. No more waiting.',
    icon: 'water',
    color1: '#005d90',
    color2: '#0077b6',
  },
  {
    id: '2',
    title: 'Trusted Local\n Water Shops',
    description: 'Connect with verified shops in your neighborhood. Real ratings, fair prices, and bulk order support.',
    icon: 'storefront',
    color1: '#006878',
    color2: '#008b9c',
  },
  {
    id: '3',
    title: 'Live Tracking &\n Seamless Payment',
    description: 'Track your delivery agent in real-time. Pay securely via UPI or choose Cash on Delivery.',
    icon: 'location',
    color1: '#003a5c',
    color2: '#005d90',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      router.replace('/auth' as any);
    }
  };

  const handleSkip = () => {
    router.replace('/auth' as any);
  };

  const renderItem = ({ item, index }: { item: typeof SLIDES[0], index: number }) => {
    const scale = scrollX.interpolate({
      inputRange: [(index - 1) * width, index * width, (index + 1) * width],
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange: [(index - 0.5) * width, index * width, (index + 0.5) * width],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={[item.color1, item.color2]}
          style={styles.slideBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.illustrationWrap, { transform: [{ scale }], opacity }]}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon as any} size={80} color="white" />
            </View>
            <View style={styles.iconRing} />
            <View style={[styles.iconRing, { width: 280, height: 280, opacity: 0.1 }]} />
          </Animated.View>

          <View style={styles.textContainer}>
            <Animated.Text style={[styles.title, { opacity }]}>
              {item.title}
            </Animated.Text>
            <Animated.Text style={[styles.description, { opacity }]}>
              {item.description}
            </Animated.Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      {/* TOP CONTROLS */}
      <SafeAreaView style={styles.topControls} edges={['top']}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* BOTTOM CONTROLS */}
      <View style={styles.bottomControls}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
          <LinearGradient
            colors={['#ffffff', '#f1f4f9']}
            style={styles.nextBtnGrad}
          >
            <Ionicons
              name={activeIndex === SLIDES.length - 1 ? "checkmark" : "arrow-forward"}
              size={24}
              color={SLIDES[activeIndex].color1}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#005d90' },
  slide: { width, height },
  slideBg: { flex: 1, paddingHorizontal: 40, justifyContent: 'center', alignItems: 'center' },
  
  illustrationWrap: { height: height * 0.45, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  iconRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', opacity: 0.2 },
  
  textContainer: { width: '100%', alignItems: 'flex-start' },
  title: { color: 'white', fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 42, marginBottom: 16 },
  description: { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 24, fontWeight: '500' },

  topControls: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 30, paddingVertical: 10, alignItems: 'flex-end' },
  skipBtn: { padding: 10 },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700' },

  bottomControls: { position: 'absolute', bottom: 60, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagination: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: 'white' },
  nextBtn: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  nextBtnGrad: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
