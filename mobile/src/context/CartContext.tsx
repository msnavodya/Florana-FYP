import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { storageKeys } from "../lib/storage/keys";
import type { CartItem, Product } from "../types/shop";

type Currency = "LKR" | "USD" | "EUR";

interface CartContextValue {
  items: CartItem[];
  currency: Currency;
  ready: boolean;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setCurrency: (value: Currency) => Promise<void>;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<Currency>("LKR");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(storageKeys.cart),
      AsyncStorage.getItem(storageKeys.currency),
    ])
      .then(([cartRaw, currencyRaw]) => {
        if (cartRaw) {
          setItems(JSON.parse(cartRaw) as CartItem[]);
        }
        if (currencyRaw === "LKR" || currencyRaw === "USD" || currencyRaw === "EUR") {
          setCurrencyState(currencyRaw);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const persistItems = async (next: CartItem[]) => {
    setItems(next);
    await AsyncStorage.setItem(storageKeys.cart, JSON.stringify(next));
  };

  const addItem = async (product: Product) => {
    const existing = items.find((item) => item.id === product.id);
    if (existing) {
      await persistItems(
        items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      );
      return;
    }

    await persistItems([...items, { ...product, quantity: 1 }]);
  };

  const removeItem = async (productId: string) => {
    await persistItems(items.filter((item) => item.id !== productId));
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    await persistItems(
      items.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = async () => {
    await persistItems([]);
  };

  const setCurrency = async (value: Currency) => {
    setCurrencyState(value);
    await AsyncStorage.setItem(storageKeys.currency, value);
  };

  const value = useMemo(
    () => ({
      items,
      currency,
      ready,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setCurrency,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
    }),
    [items, currency, ready]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }

  return value;
}
