import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function NoInternetBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const slideAnim = React.useRef(new Animated.Value(-300)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!NetInfo) return; 

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      // Only show if strictly false (not null or undefined)
      const offline = state.isConnected === false;
      setIsConnected(!offline);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: offline ? 0 : -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: offline ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    });

    return () => unsubscribe();
  }, []);

  return (
    <Animated.View style={[
      styles.banner, 
      { 
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }] 
      }
    ]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={20} color="white" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.title}>You are offline</Text>
          <Text style={styles.subtitle}>Check your connection to receive updates.</Text>
        </View>
        <TouchableOpacity style={styles.retryBtn} onPress={() => NetInfo.fetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#ba1a1a',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  content: { flexDirection: 'row', alignItems: 'center' },
  title: { color: 'white', fontWeight: '800', fontSize: 14 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: 'white', fontWeight: '800', fontSize: 12 },
});
