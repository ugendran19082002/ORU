import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/use-app-state';

export default function CartScreen() {
  const router = useRouter();
  const { shopId = 'shop-1' } = useLocalSearchParams<{ shopId?: string }>();
  const {
    clearCart,
    getCartForShop,
    getDefaultAddress,
    getShopById,
    setCartItemQuantity,
  } = useAppState();

  const shop = getShopById(shopId) ?? getShopById('shop-1');
  const cartItems = getCartForShop(shop?.id ?? 'shop-1');
  const address = getDefaultAddress();
  const subtotal = cartItems.reduce((sum, entry) => sum + entry.lineTotal, 0);
  const deliveryFee = cartItems.length > 0 ? 20 : 0;
  const total = subtotal + deliveryFee;
  const itemCount = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);

  if (!shop) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0077B6" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSubtitle}>{shop.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, cartItems.length === 0 && styles.iconButtonDisabled]}
          disabled={cartItems.length === 0}
          onPress={() => clearCart(shop.id)}>
          <Ionicons name="trash-outline" size={20} color={cartItems.length === 0 ? '#CBD5E1' : '#C0392B'} />
        </TouchableOpacity>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bag-handle-outline" size={40} color="#0077B6" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCopy}>
            Add water cans from the shop catalog so we can move into checkout and place the order.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace(`/shop/${shop.id}` as any)}>
            <Text style={styles.primaryButtonText}>Browse Shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.addressCard}>
              <View style={styles.addressIconWrap}>
                <Ionicons name="location" size={18} color="#0077B6" />
              </View>
              <View style={styles.addressCopy}>
                <Text style={styles.sectionLabel}>DELIVER TO</Text>
                <Text style={styles.addressTitle}>{address.label}</Text>
                <Text style={styles.addressText}>
                  {address.line1}, {address.line2}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/addresses' as any)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemsCard}>
              <View style={styles.itemsHeader}>
                <Text style={styles.sectionTitle}>Cart Items</Text>
                <Text style={styles.itemCountText}>{itemCount} items</Text>
              </View>

              {cartItems.map(({ item, quantity, lineTotal }) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.volume}  •  {'\u20B9'}
                      {item.price} each
                    </Text>
                  </View>

                  <View style={styles.itemRight}>
                    <View style={styles.quantityWidget}>
                      <TouchableOpacity
                        style={styles.qtyControl}
                        onPress={() => setCartItemQuantity(shop.id, item.id, quantity - 1)}>
                        <Ionicons name="remove" size={14} color="#0077B6" />
                      </TouchableOpacity>
                      <Text style={styles.qtyNumber}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyControl}
                        onPress={() => setCartItemQuantity(shop.id, item.id, quantity + 1)}>
                        <Ionicons name="add" size={14} color="#0077B6" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.lineTotal}>
                      {'\u20B9'}
                      {lineTotal}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.billCard}>
              <Text style={styles.sectionTitle}>Bill Details</Text>
              <View style={styles.billRow}>
                <Text style={styles.billKey}>Item Total</Text>
                <Text style={styles.billValue}>
                  {'\u20B9'}
                  {subtotal}
                </Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billKey}>Delivery Fee</Text>
                <Text style={styles.billValue}>
                  {'\u20B9'}
                  {deliveryFee}
                </Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.billTotal}>Grand Total</Text>
                <Text style={styles.billTotal}>
                  {'\u20B9'}
                  {total}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/order/checkout?shopId=${shop.id}` as any)}>
              <LinearGradient colors={['#0077B6', '#34C4E5']} style={styles.checkoutButton}>
                <View>
                  <Text style={styles.checkoutLabel}>Proceed to Checkout</Text>
                  <Text style={styles.checkoutSubtext}>{itemCount} items ready</Text>
                </View>
                <Text style={styles.checkoutTotal}>
                  {'\u20B9'}
                  {total}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F4FD',
  },
  iconButtonDisabled: {
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 140,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  addressIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCopy: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  addressTitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  addressText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  changeText: {
    color: '#0077B6',
    fontSize: 13,
    fontWeight: '800',
  },
  itemsCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  itemRow: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemCopy: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
  quantityWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0077B6',
  },
  qtyControl: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  qtyNumber: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#0077B6',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  billCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 18,
  },
  billRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billKey: {
    fontSize: 14,
    color: '#64748B',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 16,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0077B6',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  checkoutButton: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  checkoutSubtext: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  checkoutTotal: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F4FD',
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  emptyCopy: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 24,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#0077B6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});
