import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { CurrencySwitcher } from "../components/CurrencySwitcher";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useCart } from "../context/CartContext";
import { buildApiUrl } from "../lib/api/config";
import { colors, radii, spacing } from "../theme/tokens";
import type { Product } from "../types/shop";
import { formatPrice } from "../utils/shop";

export function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string; season?: string; price?: string; image?: string }>();
  const { addItem, currency } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const product: Product = {
    id: params.id,
    name: params.name || "Plant",
    season: params.season || "Seasonal",
    price: Number(params.price || 0),
    image: params.image || null,
  };

  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.topRow}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.topCopy}>
          <Text style={styles.eyebrow}>Plant Details</Text>
          <Text style={styles.title}>{product.name}</Text>
        </View>
        <View style={styles.topActions}>
          <CurrencySwitcher />
          <Pressable accessibilityLabel="Open menu" onPress={() => setMenuOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {product.image ? <Image source={{ uri: buildApiUrl(product.image) }} style={styles.image} /> : <View style={styles.imageFallback}><Text style={styles.imageFallbackText}>No photo available</Text></View>}

      <View style={styles.card}>
        <Text style={styles.meta}>Season: {product.season}</Text>
        <Text style={styles.price}>{formatPrice(product.price, currency)}</Text>
        <Text style={styles.description}>
          View plant details, confirm the seasonal listing, and add it to your cart using the same shop data served to the web app.
        </Text>
        <PrimaryButton label="Add to Cart" onPress={() => void addItem(product)} />
        <PrimaryButton label="Back to Catalog" onPress={() => router.back()} variant="secondary" />
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md, justifyContent: "space-between", marginBottom: spacing.lg },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  topCopy: { flex: 1, marginRight: spacing.sm },
  topActions: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  menuButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  eyebrow: { color: colors.primary, fontSize: 13, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", marginTop: spacing.xs },
  image: { borderRadius: radii.lg, height: 260, marginBottom: spacing.lg, width: "100%" },
  imageFallback: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radii.lg, height: 260, justifyContent: "center", marginBottom: spacing.lg },
  imageFallbackText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  meta: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  price: { color: colors.primaryDark, fontSize: 28, fontWeight: "800" },
  description: { color: colors.text, fontSize: 15, lineHeight: 22 },
});
