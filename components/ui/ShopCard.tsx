import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import { Button } from './Button';
import { Shadow, Typography, thannigoPalette } from '@/constants/theme';
import { useRoleTheme } from '@/hooks/use-role-theme';

export interface Shop {
  id: string;
  name: string;
  rating: number;
  distance: string;
  price: string;
  deliveryTime: string;
  image: string;
  isVerified?: boolean;
  tags?: string[];
}

interface ShopCardProps {
  shop: Shop;
  onPress?: (shop: Shop) => void;
  onOrder?: (shop: Shop) => void;
}

export function ShopCard({ shop, onPress, onOrder }: ShopCardProps) {
  const { accent } = useRoleTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(shop)}
      style={styles.wrapper}
    >
      <View style={[styles.card, Shadow.sm]}>
        {/* IMAGE */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: shop.image }} style={styles.image} resizeMode="cover" />
          {shop.isVerified && (
            <View style={styles.verifiedBadge}>
              <Badge label="Verified" variant="glass" icon="checkmark-circle" size="sm" />
            </View>
          )}
          <View style={styles.deliveryChip}>
            <Text style={[styles.deliveryText, { color: accent }]}>{shop.deliveryTime}</Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.details}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="star" size={13} color={thannigoPalette.warning} />
                <Text style={styles.rating}>{shop.rating}</Text>
                <Text style={styles.distance}> · {shop.distance}</Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              <Text style={[styles.price, { color: accent }]}>{shop.price}</Text>
              <Text style={styles.priceLabel}>PER CAN</Text>
            </View>
          </View>

          {/* TAGS + CTA */}
          <View style={styles.footer}>
            <View style={styles.tags}>
              {shop.tags?.map((tag, i) => (
                <Badge key={i} label={tag} variant="secondary" size="sm" />
              ))}
            </View>
            <Button title="Order" variant="primary" size="sm" onPress={() => onOrder?.(shop)} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageContainer: { height: 180, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', top: 12, left: 12 },
  deliveryChip: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deliveryText: { ...Typography.caption, fontWeight: '700' },
  details: { padding: 16, gap: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoLeft: { flex: 1, marginRight: 12, gap: 4 },
  shopName: { ...Typography.h4, color: thannigoPalette.darkText },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { ...Typography.caption, fontWeight: '700', color: thannigoPalette.darkText, marginLeft: 3 },
  distance: { ...Typography.caption, color: thannigoPalette.neutral },
  priceBlock: { alignItems: 'flex-end', gap: 2 },
  price: { ...Typography.h3, fontWeight: '900' },
  priceLabel: { ...Typography.overline, color: thannigoPalette.neutral },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: thannigoPalette.borderSoft,
    gap: 8,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, gap: 6 },
});
