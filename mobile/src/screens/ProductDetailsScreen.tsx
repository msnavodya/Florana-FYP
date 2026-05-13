// Render the mobile Product Details screen.
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
import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api/config";
import { colors, radii, spacing } from "../theme/tokens";
import type { Product } from "../types/shop";

export function ProductDetailsScreen() {
  // Rebuild the product object from the route params so the screen can render even from a lightweight link.
  const params = useLocalSearchParams<{ id: string; name?: string; season?: string; price?: string; image?: string }>();
  const { addItem, formatMoney } = useCart();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const product: Product = {
    id: params.id,
    name: params.name || t("plant_label"),
    season: params.season || "Seasonal",
    price: Number(params.price || 0),
    image: params.image || null,
  };

  // Render the mobile Product Details screen and its main interactive sections.
  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.topRow}>
        <Pressable accessibilityLabel={t("go_back")} onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.topCopy}>
          <Text style={styles.eyebrow}>{t("product_details_title")}</Text>
          <Text style={styles.title}>{product.name}</Text>
        </View>
        <View style={styles.topActions}>
          <CurrencySwitcher />
          <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {product.image ? (
        <Image resizeMode="cover" source={{ uri: buildApiUrl(product.image) }} style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>{t("no_photo_available")}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.meta}>{t("product_details_season", { season: product.season })}</Text>
        <Text style={styles.price}>{formatMoney(product.price)}</Text>
        <Text style={styles.description}>{t("product_details_description")}</Text>
        <PrimaryButton label={t("add_to_cart")} onPress={() => void addItem(product)} />
        <PrimaryButton label={t("back_to_catalog")} onPress={() => router.back()} variant="secondary" />
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Header row and icon buttons.
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
  // Hero image and detail card.
  image: { borderRadius: radii.lg, height: 340, marginBottom: spacing.lg, width: "100%" },
  imageFallback: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radii.lg, height: 340, justifyContent: "center", marginBottom: spacing.lg },
  imageFallbackText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  meta: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  price: { color: colors.primaryDark, fontSize: 28, fontWeight: "800" },
  description: { color: colors.text, fontSize: 15, lineHeight: 22 },
});
