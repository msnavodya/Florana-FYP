import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useCart } from "../context/CartContext";
import { buildApiUrl } from "../lib/api/config";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { Product } from "../types/shop";
import { formatPrice } from "../utils/shop";
import { PrimaryButton } from "./PrimaryButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, currency } = useCart();
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const imageUri = product.image ? buildApiUrl(product.image) : null;

  return (
    <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id, name: product.name, season: product.season, price: String(product.price), image: product.image || "" } })} style={[styles.card, compact ? styles.cardCompact : null]}>
      {imageUri ? <Image source={{ uri: imageUri }} style={[styles.image, compact ? styles.imageCompact : null]} /> : <View style={[styles.imageFallback, compact ? styles.imageCompact : null]}><Text style={styles.imageFallbackText}>No Image</Text></View>}
      <Text style={[styles.name, compact ? styles.nameCompact : null]}>{product.name}</Text>
      <Text style={styles.meta}>{product.season}</Text>
      <Text style={[styles.price, compact ? styles.priceCompact : null]}>{formatPrice(product.price, currency)}</Text>
      <PrimaryButton label="Add to Cart" onPress={() => void addItem(product)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  cardCompact: {
    borderRadius: 18,
    padding: 14,
  },
  image: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    height: 160,
    width: "100%",
  },
  imageCompact: {
    height: 136,
  },
  imageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    height: 160,
    justifyContent: "center",
  },
  imageFallbackText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  nameCompact: {
    fontSize: 16,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  price: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  priceCompact: {
    fontSize: 16,
  },
});
