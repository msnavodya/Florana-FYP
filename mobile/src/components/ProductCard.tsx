import { MaterialIcons } from "@expo/vector-icons";
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
  actionLabel?: string;
  deleting?: boolean;
  onAdded?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductCard({ product, actionLabel = "Add to Cart", deleting = false, onAdded, onDelete }: ProductCardProps) {
  const { addItem, currency } = useCart();
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const imageUri = product.image ? buildApiUrl(product.image) : null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id, name: product.name, season: product.season, price: String(product.price), image: product.image || "" } })}
      style={[styles.card, compact ? styles.cardCompact : null]}
    >
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image resizeMode="cover" source={{ uri: imageUri }} style={[styles.image, compact ? styles.imageCompact : null]} />
        ) : (
          <View style={[styles.imageFallback, compact ? styles.imageCompact : null]}><Text style={styles.imageFallbackText}>No Image</Text></View>
        )}
        <View style={styles.seasonBadge}>
          <Text style={styles.seasonBadgeText}>{product.season}</Text>
        </View>
        {onDelete ? (
          <Pressable
            accessibilityLabel={`Delete ${product.name}`}
            disabled={deleting}
            onPress={(event) => {
              event.stopPropagation();
              onDelete(product);
            }}
            style={styles.deleteButton}
          >
            {deleting ? <Text style={styles.deleteBusy}>...</Text> : <MaterialIcons name="delete-outline" size={17} color="#B33D68" />}
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.name, compact ? styles.nameCompact : null]}>{product.name}</Text>
      <Text style={[styles.price, compact ? styles.priceCompact : null]}>{formatPrice(product.price, currency)}</Text>
      <PrimaryButton
        label={actionLabel}
        onPress={() => {
          void addItem(product).then(() => onAdded?.(product));
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  cardCompact: {
    borderRadius: 18,
    padding: 14,
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    height: 220,
    width: "100%",
  },
  imageCompact: {
    height: 190,
  },
  imageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    height: 220,
    justifyContent: "center",
  },
  imageFallbackText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  seasonBadge: {
    backgroundColor: "rgba(31,75,63,0.88)",
    borderRadius: radii.pill,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    position: "absolute",
    right: spacing.sm,
  },
  seasonBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,245,248,0.96)",
    borderColor: "rgba(179,61,104,0.18)",
    borderRadius: 16,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    width: 36,
  },
  deleteBusy: {
    color: "#B33D68",
    fontSize: 13,
    fontWeight: "800",
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
  },
  nameCompact: {
    fontSize: 16,
  },
  price: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "800",
  },
  priceCompact: {
    fontSize: 16,
  },
});
