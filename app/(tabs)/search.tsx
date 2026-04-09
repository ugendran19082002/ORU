import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/use-app-state';

const filters = ['Open now', 'Top rated', 'Within 3km'];

export default function SearchScreen() {
  const router = useRouter();
  const { shops } = useAppState();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const filteredShops = shops.filter((shop) => {
    const matchesQuery =
      query.length === 0 ||
      shop.name.toLowerCase().includes(query.toLowerCase()) ||
      shop.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

    if (!matchesQuery) {
      return false;
    }

    if (activeFilter === 'Open now') {
      return shop.status !== 'closed';
    }

    if (activeFilter === 'Top rated') {
      return shop.rating >= 4.7;
    }

    return shop.distanceKm <= 3;
  });

  const markers = JSON.stringify(
    shops.map((shop) => ({
      latitude: shop.latitude,
      longitude: shop.longitude,
      title: shop.name,
      color: shop.status === 'busy' ? '#0f766e' : '#005d90',
      iconType: shop.status === 'busy' ? 'shop' : 'pin',
    }))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Search & Map</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/map-preview',
              params: {
                lat: shops[0].latitude.toString(),
                lng: shops[0].longitude.toString(),
                title: 'Nearby ThanniGo shops',
                markers,
              },
            } as any)
          }
          style={styles.mapButton}>
          <Ionicons name="map-outline" size={18} color="#005d90" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search shops, offers, water types"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((filter) => {
            const selected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterChip, selected && styles.filterChipActive]}>
                <Text style={[styles.filterText, selected && styles.filterTextActive]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredShops.map((shop) => (
          <TouchableOpacity
            key={shop.id}
            onPress={() => router.push(`/order/${shop.id}` as any)}
            style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardTitle}>{shop.name}</Text>
                <Text style={styles.cardSubtitle}>{shop.description}</Text>
              </View>
              <View style={[styles.statusBadge, shop.status === 'busy' && styles.busyBadge]}>
                <Text style={[styles.statusText, shop.status === 'busy' && styles.busyText]}>
                  {shop.status === 'busy' ? 'Busy' : 'Open'}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{shop.distanceKm.toFixed(1)} km</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>⭐ {shop.rating}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{shop.etaMinutes} mins</Text>
            </View>

            <View style={styles.tagRow}>
              {shop.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  mapButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f0ff',
  },
  searchBar: {
    marginHorizontal: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  filterRow: {
    gap: 10,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#005d90',
  },
  filterText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#64748b',
    lineHeight: 19,
    maxWidth: 250,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#d1fae5',
  },
  busyBadge: {
    backgroundColor: '#ccfbf1',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  busyText: {
    color: '#0f766e',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  metaDot: {
    marginHorizontal: 6,
    color: '#94a3b8',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338ca',
  },
});
