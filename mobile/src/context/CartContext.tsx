// Manage shared mobile state for Cart features.
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { fetchLatestExchangeRates } from "../lib/api/currency";
import { storageKeys } from "../lib/storage/keys";
import type { CartItem, Product } from "../types/shop";
import { defaultExchangeRates, formatPrice, type SupportedCurrency, convertPrice } from "../utils/shop";

interface CartContextValue {
  items: CartItem[];
  currency: SupportedCurrency;
  ready: boolean;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setCurrency: (value: SupportedCurrency) => Promise<void>;
  exchangeRates: Record<SupportedCurrency, number>;
  ratesUpdatedAt: string | null;
  ratesLoading: boolean;
  refreshExchangeRates: () => Promise<void>;
  convertAmount: (amount: number | string | undefined, targetCurrency?: SupportedCurrency) => number;
  formatMoney: (amount: number | string | undefined, targetCurrency?: SupportedCurrency) => string;
  totalItems: number;
  subtotal: number;
  convertedSubtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<SupportedCurrency>("LKR");
  const [exchangeRates, setExchangeRates] = useState<Record<SupportedCurrency, number>>(defaultExchangeRates);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate the cart, currency, and cached exchange rates from local storage in one pass.
    Promise.all([
      AsyncStorage.getItem(storageKeys.cart),
      AsyncStorage.getItem(storageKeys.currency),
      AsyncStorage.getItem(storageKeys.currencyRates),
      AsyncStorage.getItem(storageKeys.currencyRatesUpdatedAt),
    ])
      .then(([cartRaw, currencyRaw, ratesRaw, ratesUpdatedAtRaw]) => {
        if (cartRaw) {
          setItems(JSON.parse(cartRaw) as CartItem[]);
        }
        if (currencyRaw === "LKR" || currencyRaw === "USD" || currencyRaw === "EUR") {
          setCurrencyState(currencyRaw);
        }
        if (ratesRaw) {
          try {
            setExchangeRates({ ...defaultExchangeRates, ...(JSON.parse(ratesRaw) as Partial<Record<SupportedCurrency, number>>) });
          } catch {
            setExchangeRates(defaultExchangeRates);
          }
        }
        if (ratesUpdatedAtRaw) {
          setRatesUpdatedAt(ratesUpdatedAtRaw);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const refreshExchangeRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const latest = await fetchLatestExchangeRates();
      setExchangeRates(latest.rates);
      setRatesUpdatedAt(latest.updatedAt);
      await AsyncStorage.multiSet([
        [storageKeys.currencyRates, JSON.stringify(latest.rates)],
        [storageKeys.currencyRatesUpdatedAt, latest.updatedAt || ""],
      ]);
    } catch {
      // Keep cached/default rates if the live provider is temporarily unavailable.
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void refreshExchangeRates();
    const interval = setInterval(() => {
      void refreshExchangeRates();
    }, 1000 * 60 * 15);

    return () => clearInterval(interval);
  }, [ready, refreshExchangeRates]);

  const persistItems = async (next: CartItem[]) => {
    // Keep state and storage in sync through one shared write path.
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

  const setCurrency = async (value: SupportedCurrency) => {
    // Save the chosen display currency so totals stay consistent across app restarts.
    setCurrencyState(value);
    await AsyncStorage.setItem(storageKeys.currency, value);
  };

  // Derive totals once from the stored cart items so every consumer uses the same math.
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  const convertAmountForCurrency = useCallback(
    (amount: number | string | undefined, targetCurrency: SupportedCurrency = currency) =>
      convertPrice(amount, targetCurrency, exchangeRates),
    [currency, exchangeRates]
  );

  const formatMoney = useCallback(
    (amount: number | string | undefined, targetCurrency: SupportedCurrency = currency) =>
      formatPrice(amount, targetCurrency, exchangeRates),
    [currency, exchangeRates]
  );

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
      exchangeRates,
      ratesUpdatedAt,
      ratesLoading,
      refreshExchangeRates,
      convertAmount: convertAmountForCurrency,
      formatMoney,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      convertedSubtotal: convertAmountForCurrency(subtotal),
    }),
    [
      items,
      currency,
      ready,
      exchangeRates,
      ratesUpdatedAt,
      ratesLoading,
      refreshExchangeRates,
      convertAmountForCurrency,
      formatMoney,
      subtotal,
    ]
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
