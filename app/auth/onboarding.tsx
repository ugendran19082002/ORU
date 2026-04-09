import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/use-app-state';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'location-outline' as const,
    title: 'Find Fresh Water Near You',
    description: 'Discover verified water suppliers in your area with real-time availability',
    accent: '#0077BE',
  },
  {
    icon: 'layers-outline' as const,
    title: 'Order in Seconds',
    description: 'Choose your quantity, schedule delivery, and relax - we handle the rest',
    accent: '#2DD4BF',
  },
  {
    icon: 'bicycle-outline' as const,
    title: 'Real-Time Tracking',
    description: 'Know exactly when your water arrives with live delivery updates',
    accent: '#0077BE',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAppState();
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  const handleNext = () => {
    if (index === slides.length - 1) {
      completeOnboarding();
      router.replace('/auth/role');
      return;
    }

    setIndex((current) => current + 1);
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/auth/role');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={styles.illustrationContainer}>
            <View style={[styles.orb, { backgroundColor: slide.accent + '1A' }]} />
            <View style={[styles.iconCard, { backgroundColor: slide.accent }]}>
              <Ionicons name={slide.icon} size={64} color="white" />
            </View>
          </View>
          
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {slides.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[
                  styles.dot,
                  dotIndex === index ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleNext} activeOpacity={0.8} style={{ width: '100%' }}>
            <LinearGradient
              colors={['#0077BE', '#4EC2E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>
                {index === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#6B7C8C',
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    width: width * 0.8,
    height: width * 0.8,
  },
  orb: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  iconCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0077BE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E4049',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7C8C',
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    alignItems: 'center',
    gap: 32,
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0077BE',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#E5E9EC',
  },
  ctaButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0077BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
