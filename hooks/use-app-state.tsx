import React, { createContext, useContext, useState } from 'react';

import {
  type Address,
  type DeliveryType,
  type Order,
  type OrderLineItem,
  type PaymentMethod,
  type Shop,
  type ShopCustomer,
  type ShopInventoryItem,
  type UserRole,
  deliveryPartner,
  mockAddresses,
  mockOrders,
  mockShops,
  mockShopCustomers,
  mockUser,
  mockWalletTransactions,
} from '@/utils/mockData';

export type CheckoutDraftItem = {
  itemId: string;
  quantity: number;
};

export type CheckoutDraft = {
  shopId: string;
  items: CheckoutDraftItem[];
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  scheduledFor?: string;
  notes: string;
  addressId: string;
};

export type CartItem = {
  shopId: string;
  itemId: string;
  quantity: number;
};

export type CartLineItem = CartItem & {
  item: ShopInventoryItem;
  lineTotal: number;
};

type AppStateValue = {
  role: UserRole | null;
  pendingRole: UserRole;
  setPendingRole: (role: UserRole) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  user: typeof mockUser;
  shops: Shop[];
  addresses: Address[];
  orders: Order[];
  walletBalance: number;
  walletTransactions: typeof mockWalletTransactions;
  shopCustomers: ShopCustomer[];
  busyMode: boolean;
  cartItems: CartItem[];
  checkoutDraft: CheckoutDraft | null;
  loginAs: (role: UserRole) => Promise<void>;
  setCartItemQuantity: (shopId: string, itemId: string, quantity: number) => void;
  clearCart: (shopId?: string) => void;
  setCheckoutDraft: (draft: CheckoutDraft) => void;
  placeOrder: (draft?: CheckoutDraft) => Promise<Order | null>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason: string) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  updateOrderAddress: (orderId: string, addressId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  verifyDeliveryOtp: (orderId: string, otp: string) => Promise<boolean>;
  submitRating: (orderId: string, stars: number, comment: string) => Promise<void>;
  toggleBusyMode: () => void;
  getDefaultAddress: () => Address;
  getShopById: (shopId: string) => Shop | undefined;
  getInventoryForShop: (shopId: string) => ShopInventoryItem[];
  getCartForShop: (shopId: string) => CartLineItem[];
};

const AppStateContext = createContext<AppStateValue | null>(null);

const sleep = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export function AppStateProvider({ children }: React.PropsWithChildren) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole>('customer');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [shops, setShops] = useState<Shop[]>(mockShops);
  const [addresses] = useState<Address[]>(mockAddresses);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [walletBalance, setWalletBalance] = useState(420);
  const [walletTransactions, setWalletTransactions] = useState(mockWalletTransactions);
  const [shopCustomers] = useState<ShopCustomer[]>(mockShopCustomers);
  const [busyMode, setBusyMode] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft | null>(null);

  const getDefaultAddress = () =>
    addresses.find((address) => address.isDefault) ?? addresses[0];

  const getShopById = (shopId: string) => shops.find((shop) => shop.id === shopId);

  const getInventoryForShop = (shopId: string) =>
    getShopById(shopId)?.inventory ?? [];

  const getCartForShop = (shopId: string) => {
    const shop = getShopById(shopId);

    if (!shop) {
      return [];
    }

    return cartItems.flatMap((cartItem) => {
      if (cartItem.shopId !== shopId) {
        return [];
      }

      const item = shop.inventory.find((inventoryItem) => inventoryItem.id === cartItem.itemId);

      if (!item) {
        return [];
      }

      return [
        {
          ...cartItem,
          item,
          lineTotal: item.price * cartItem.quantity,
        },
      ];
    });
  };

  const completeOnboarding = () => setOnboardingComplete(true);

  const loginAs = async (nextRole: UserRole) => {
    await sleep(500);
    setRole(nextRole);
  };

  const setCartItemQuantity = (shopId: string, itemId: string, quantity: number) => {
    setCartItems((current) => {
      const withoutItem = current.filter(
        (entry) => !(entry.shopId === shopId && entry.itemId === itemId)
      );

      if (quantity <= 0) {
        return withoutItem;
      }

      return [...withoutItem, { shopId, itemId, quantity }];
    });
  };

  const clearCart = (shopId?: string) => {
    setCartItems((current) => {
      if (!shopId) {
        return [];
      }

      return current.filter((entry) => entry.shopId !== shopId);
    });
  };

  const placeOrder = async (draftOverride?: CheckoutDraft) => {
    const activeDraft = draftOverride ?? checkoutDraft;

    if (!activeDraft) {
      return null;
    }

    await sleep(700);

    const shop = getShopById(activeDraft.shopId);

    if (!shop) {
      return null;
    }

    const requestedItems = activeDraft.items.filter((entry) => entry.quantity > 0);

    if (requestedItems.length === 0 || shop.status !== 'open') {
      return null;
    }

    const normalizedItems: OrderLineItem[] = [];

    for (const requestedItem of requestedItems) {
      const item = shop.inventory.find((inventoryItem) => inventoryItem.id === requestedItem.itemId);

      if (!item || item.stock < requestedItem.quantity) {
        return null;
      }

      normalizedItems.push({
        itemId: item.id,
        name: item.name,
        volume: item.volume,
        quantity: requestedItem.quantity,
        pricePerUnit: item.price,
      });
    }

    const totalQuantity = normalizedItems.reduce((sum, entry) => sum + entry.quantity, 0);
    const subtotal = normalizedItems.reduce(
      (sum, entry) => sum + entry.pricePerUnit * entry.quantity,
      0
    );
    const total = subtotal + 20;

    if (activeDraft.paymentMethod === 'wallet' && walletBalance < total) {
      return null;
    }

    const primaryItem = normalizedItems[0];

    const nextOrder: Order = {
      id: `THN-${Math.floor(1000 + Math.random() * 9000)}`,
      shopId: shop.id,
      shopName: shop.name,
      customerName: mockUser.name,
      addressId: activeDraft.addressId,
      items: normalizedItems,
      itemName: normalizedItems.length === 1 ? primaryItem.name : `${normalizedItems.length} items`,
      quantity: totalQuantity,
      pricePerUnit: primaryItem.pricePerUnit,
      deliveryFee: 20,
      total,
      paymentMethod: activeDraft.paymentMethod,
      deliveryType: activeDraft.deliveryType,
      scheduledFor: activeDraft.scheduledFor,
      notes: activeDraft.notes,
      status: 'placed',
      etaLabel: activeDraft.deliveryType === 'scheduled' ? 'Scheduled order confirmed' : 'Shop will confirm shortly',
      createdAt: 'Just now',
      otp: '483921',
      deliveryPartner,
    };

    setOrders((current) => [nextOrder, ...current]);
    setShops((current) =>
      current.map((currentShop) => {
        if (currentShop.id !== shop.id) {
          return currentShop;
        }

        return {
          ...currentShop,
          inventory: currentShop.inventory.map((inventoryItem) => {
            const matchingItem = requestedItems.find((entry) => entry.itemId === inventoryItem.id);

            if (!matchingItem) {
              return inventoryItem;
            }

            return {
              ...inventoryItem,
              stock: Math.max(0, inventoryItem.stock - matchingItem.quantity),
            };
          }),
        };
      })
    );
    clearCart(shop.id);
    setCheckoutDraft(null);

    if (activeDraft.paymentMethod === 'wallet') {
      setWalletBalance((current) => current - total);
      setWalletTransactions((current) => [
        {
          id: `txn-${Date.now()}`,
          type: 'debit',
          title: `Order ${nextOrder.id}`,
          subtitle: `${shop.name} via wallet`,
          amount: total,
          createdAt: 'Just now',
        },
        ...current,
      ]);
    }

    return nextOrder;
  };

  const acceptOrder = async (orderId: string) => {
    await sleep();
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: 'accepted', etaLabel: 'Accepted by shop' }
          : order
      )
    );
  };

  const rejectOrder = async (orderId: string, reason: string) => {
    await sleep();
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: 'cancelled', cancelReason: reason, etaLabel: 'Cancelled by shop' }
          : order
      )
    );
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    await sleep();
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: 'cancelled', cancelReason: reason, etaLabel: 'Cancelled by customer' }
          : order
      )
    );
  };

  const updateOrderAddress = async (orderId: string, addressId: string) => {
    await sleep(300);
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, addressId, etaLabel: order.status === 'placed' ? 'Address updated before dispatch' : order.etaLabel }
          : order
      )
    );
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await sleep(400);

    const labels: Record<Order['status'], string> = {
      placed: 'Order placed',
      accepted: 'Accepted by shop',
      preparing: 'Preparing your cans',
      out_for_delivery: 'Driver is on the way',
      delivered: 'Delivered successfully',
      cancelled: 'Order cancelled',
    };

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status, etaLabel: labels[status] } : order
      )
    );
  };

  const verifyDeliveryOtp = async (orderId: string, otp: string) => {
    await sleep(350);
    const match = orders.find((order) => order.id === orderId)?.otp === otp;

    if (match) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: 'delivered', etaLabel: 'Delivered successfully' }
            : order
        )
      );
    }

    return match;
  };

  const submitRating = async (orderId: string, stars: number, comment: string) => {
    await sleep(400);
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, ratingReview: { stars, comment } } : order
      )
    );
  };

  const toggleBusyMode = () => {
    setBusyMode((current) => {
      const next = !current;
      setShops((shopList) =>
        shopList.map((shop) =>
          shop.id === 'shop-1'
            ? {
                ...shop,
                status: next ? 'busy' : 'open',
                tags: next
                  ? ['Busy mode', 'Try scheduled delivery', 'Limited hourly capacity']
                  : ['Open now', 'BIS certified', 'Fast delivery'],
              }
            : shop
        )
      );
      return next;
    });
  };

  return (
    <AppStateContext.Provider
      value={{
        role,
        pendingRole,
        setPendingRole,
        onboardingComplete,
        completeOnboarding,
        user: mockUser,
        shops,
        addresses,
        orders,
        walletBalance,
        walletTransactions,
        shopCustomers,
        busyMode,
        cartItems,
        checkoutDraft,
        loginAs,
        setCartItemQuantity,
        clearCart,
        setCheckoutDraft,
        placeOrder,
        acceptOrder,
        rejectOrder,
        cancelOrder,
        updateOrderAddress,
        updateOrderStatus,
        verifyDeliveryOtp,
        submitRating,
        toggleBusyMode,
        getDefaultAddress,
        getShopById,
        getInventoryForShop,
        getCartForShop,
      }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider.');
  }

  return context;
}
