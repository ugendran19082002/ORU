import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { apiClient } from '@/api/client';
import Toast from 'react-native-toast-message';

type Feature = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  role: string;
  is_free: boolean;
  pricing_type: 'free' | 'plan_only' | 'pay_per_use';
  default_enabled: boolean;
  globally_enabled: boolean;
  category: string | null;
  is_beta: boolean;
};

const PRICING_COLORS: Record<string, { bg: string; text: string }> = {
  free: { bg: '#e8f5e9', text: '#2e7d32' },
  plan_only: { bg: '#e0f0ff', text: '#005d90' },
  pay_per_use: { bg: '#fef3c7', text: '#b45309' },
};

export default function AdminFeaturesScreen() {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/features');
      if (res.data?.status === 1) setFeatures(res.data.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load features' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeatures(); }, [fetchFeatures]);

  const handleToggle = async (feature: Feature, enabled: boolean) => {
    setToggling(feature.id);
    try {
      const res = await apiClient.patch(`/admin/features/${feature.id}/toggle`, { enabled });
      if (res.data?.status === 1) {
        setFeatures((prev) =>
          prev.map((f) => f.id === feature.id ? { ...f, globally_enabled: enabled } : f)
        );
        Toast.show({
          type: 'success',
          text1: enabled ? 'Feature Enabled' : 'Feature Disabled',
          text2: `"${feature.name}" is now ${enabled ? 'globally enabled' : 'disabled for everyone'}`,
        });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Toggle failed', text2: e?.message });
    } finally {
      setToggling(null);
    }
  };

  const CATEGORIES = ['all', ...Array.from(new Set(features.map((f) => f.category ?? 'general')))];

  const filtered = filter === 'all'
    ? features
    : features.filter((f) => (f.category ?? 'general') === filter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton fallback="/admin" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Feature Management</Text>
          <Text style={styles.headerSub}>{features.length} features registered</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Toast.show({ type: 'info', text1: 'Coming soon', text2: 'Add feature via API body.' })}
        >
          <Ionicons name="add" size={22} color="#005d90" />
        </TouchableOpacity>
      </View>

      {/* CATEGORY TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, filter === cat && styles.tabActive]}
            onPress={() => setFilter(cat)}
          >
            <Text style={[styles.tabText, filter === cat && styles.tabTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeatures(); }} colors={['#005d90']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#005d90" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="toggle-outline" size={56} color="#94a3b8" />
            <Text style={styles.emptyText}>No features found</Text>
          </View>
        ) : filtered.map((feature) => {
          const pColor = PRICING_COLORS[feature.pricing_type] ?? PRICING_COLORS.free;
          return (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.featureTop}>
                <View style={styles.featureInfo}>
                  <View style={styles.featureNameRow}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                    {feature.is_beta && (
                      <View style={styles.betaBadge}><Text style={styles.betaText}>BETA</Text></View>
                    )}
                  </View>
                  <Text style={styles.featureKey}>{feature.key}</Text>
                </View>
                {toggling === feature.id ? (
                  <ActivityIndicator size="small" color="#005d90" />
                ) : (
                  <Switch
                    value={feature.globally_enabled}
                    onValueChange={(val) => {
                      Alert.alert(
                        val ? 'Enable Feature?' : 'Disable Feature?',
                        `"${feature.name}" will be ${val ? 'enabled for all eligible users' : 'disabled globally — even paid plan users lose access'}`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: val ? 'Enable' : 'Disable', onPress: () => handleToggle(feature, val) },
                        ]
                      );
                    }}
                    trackColor={{ false: '#e0e2e8', true: '#bbf7d0' }}
                    thumbColor={feature.globally_enabled ? '#16a34a' : '#94a3b8'}
                  />
                )}
              </View>

              {feature.description && (
                <Text style={styles.featureDesc}>{feature.description}</Text>
              )}

              <View style={styles.featureTags}>
                <View style={[styles.featureTag, { backgroundColor: pColor.bg }]}>
                  <Text style={[styles.featureTagText, { color: pColor.text }]}>
                    {feature.pricing_type.replace('_', ' ')}
                  </Text>
                </View>
                <View style={[styles.featureTag, { backgroundColor: '#f1f4f9' }]}>
                  <Text style={styles.featureTagText}>{feature.role}</Text>
                </View>
                {feature.category && (
                  <View style={[styles.featureTag, { backgroundColor: '#f0f7ff' }]}>
                    <Text style={[styles.featureTagText, { color: '#005d90' }]}>{feature.category}</Text>
                  </View>
                )}
                <View style={[styles.featureTag, { backgroundColor: feature.globally_enabled ? '#e8f5e9' : '#ffebee' }]}>
                  <Text style={[styles.featureTagText, { color: feature.globally_enabled ? '#2e7d32' : '#c62828' }]}>
                    {feature.globally_enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0f0ff', alignItems: 'center', justifyContent: 'center' },
  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e2e8' },
  tabActive: { backgroundColor: '#005d90', borderColor: '#005d90' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#707881' },
  tabTextActive: { color: 'white' },
  content: { padding: 16, gap: 12, paddingBottom: 100 },
  centered: { paddingTop: 80, alignItems: 'center' },
  emptyText: { marginTop: 14, color: '#64748b', fontWeight: '600', fontSize: 15 },
  featureCard: {
    backgroundColor: 'white', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  featureTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  featureInfo: { flex: 1, marginRight: 12 },
  featureNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  featureName: { fontSize: 15, fontWeight: '800', color: '#181c20' },
  betaBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  betaText: { fontSize: 9, fontWeight: '800', color: '#b45309', letterSpacing: 0.5 },
  featureKey: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', fontWeight: '600' },
  featureDesc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 10 },
  featureTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  featureTagText: { fontSize: 11, fontWeight: '700', color: '#707881' },
});
