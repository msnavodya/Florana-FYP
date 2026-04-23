import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useCart } from "../context/CartContext";
import { buildApiUrl } from "../lib/api/config";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import type { Product } from "../types/shop";
import { formatPrice } from "../utils/shop";
import { PrimaryButton } from "./PrimaryButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, currency } = useCart();
  const imageUri = product.image ? buildApiUrl(product.image) : null;

  return (
    <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id, name: product.name, season: product.season, price: String(product.price), image: product.image || "" } })} style={styles.card}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <View style={styles.imageFallback}><Text style={styles.imageFallbackText}>No Image</Text></View>}
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.meta}>{product.season}</Text>
      <Text style={styles.price}>{formatPrice(product.price, currency)}</Text>
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
  image: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    height: 160,
    width: "100%",
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
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  price: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
});
