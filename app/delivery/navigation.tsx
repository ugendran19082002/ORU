import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { ExpoMap } from '@/components/maps/ExpoMap';

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useDeliveryStore } from '@/stores/deliveryStore';

export default function DeliveryNavigationScreen() {
  const router = useRouter();
  const { tasks, currentTaskId, updateTaskStatus } = useDeliveryStore();
  const task = tasks.find((item) => item.id === currentTaskId) ?? tasks[0];
  const [navStarted, setNavStarted] = React.useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Real Interactive Map */}
      <View style={styles.mapContainer}>
        <ExpoMap
          hideControls={true}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: task?.lat ?? 12.9716,
            longitude: task?.lng ?? 80.2210,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showRoute={true}
          markers={[
            {
              latitude: task?.lat ?? 12.9716,
              longitude: task?.lng ?? 80.2210,
              title: 'Customer Location',
              color: '#ba1a1a',
              iconType: 'home' as const
            }
          ]}
          onMarkerDragEnd={(coords) => {
             Alert.alert('Location Tapped', `Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`);
          }}
        />
      </View>

      {/* Floating Header */}
      <View style={styles.header}>
        <BackButton fallback="/delivery" />

        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="help-buoy-outline" size={24} color="#181c20" />
        </TouchableOpacity>
      </View>

      {/* Navigation Card */}
      <View style={styles.sheetContent}>
        <View style={styles.sheetPill} />
        
        <View style={styles.tripHeaderRow}>
          <View>
            <Text style={styles.tripTime}>12 min</Text>
            <Text style={styles.tripDistance}>4.2 km • Dropoff</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaBadgeText}>ON TIME</Text>
          </View>
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerTop}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#005d90" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.custName}>{task?.customerName ?? 'Karthik Rajan'}</Text>
              <Text style={styles.custOrder}>Order #9830 • 2 Cans</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={18} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="location-sharp" size={18} color="#ba1a1a" />
            <Text style={styles.addressText}>{task?.address ?? 'Plot 12, Green View Colony, Sector 42'}</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.btnDanger}
            onPress={() => Alert.alert('Cancel Trip', 'Are you sure you want to cancel this trip?')}
          >
            <Ionicons name="close" size={20} color="#ba1a1a" />
          </TouchableOpacity>
          
          <TouchableOpacity
            activeOpacity={0.9}
            style={{ flex: 1 }}
            onPress={() => {
              if (task?.status === 'accepted') {
                updateTaskStatus(task.id, 'picked');
                Alert.alert('Picked up', 'Order items successfully picked up from shop.');
              } else if (task?.status === 'picked') {
                updateTaskStatus(task.id, 'delivered');
                router.push('/delivery/complete' as any);
              }
            }}
          >
            <LinearGradient
              colors={['#005d90', '#0077b6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.arriveBtn}
            >
              <Text style={styles.arriveBtnText}>
                {task?.status === 'accepted' ? 'Confirm Pickup' : 'Slide When Arrived'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f4f9', position: 'relative' },
  
  mapContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#fdfdfd' },
  mapText: { fontSize: 20, fontWeight: '900', color: '#bfdbf7', marginTop: 10, letterSpacing: -0.5 },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: 60, position: 'absolute', top: 0, left: 0, right: 0 
  },
  iconBtn: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', 
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 
  },

  sheetContent: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 
  },
  sheetPill: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e2e8', alignSelf: 'center', marginBottom: 20 },
  
  tripHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  tripTime: { fontSize: 28, fontWeight: '900', color: '#2e7d32', letterSpacing: -0.5 },
  tripDistance: { fontSize: 13, color: '#707881', fontWeight: '600', marginTop: 2 },
  etaBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  etaBadgeText: { color: '#2e7d32', fontWeight: '800', fontSize: 11 },

  customerCard: { backgroundColor: '#f7f9ff', borderRadius: 20, padding: 16, marginBottom: 20 },
  customerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  custName: { fontSize: 16, fontWeight: '900', color: '#181c20' },
  custOrder: { fontSize: 12, color: '#707881', fontWeight: '500' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#005d90', alignItems: 'center', justifyContent: 'center' },
  
  addressRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: '#e0e2e8', paddingTop: 12 },
  addressText: { flex: 1, fontSize: 13, color: '#181c20', lineHeight: 18, fontWeight: '500' },

  actionGrid: { flexDirection: 'row', gap: 12 },
  btnDanger: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#ffdad6', alignItems: 'center', justifyContent: 'center' },
  arriveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 20, height: 56, shadowColor: '#005d90', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  arriveBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
});
