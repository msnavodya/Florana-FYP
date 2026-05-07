import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { CurrencySwitcher } from "../components/CurrencySwitcher";
import { LanguageSelector } from "../components/LanguageSelector";
import { ProductCard } from "../components/ProductCard";
import { Screen } from "../components/Screen";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { getProducts } from "../lib/api/shop";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { Product } from "../types/shop";
import { seasons } from "../utils/shop";

const seasonImages = {
  Spring: brandAssets.spring,
  Summer: brandAssets.summer,
  Autumn: brandAssets.autumn,
  Winter: brandAssets.winter,
} as const;

const seasonKeyMap: Record<(typeof seasons)[number], string> = {
  Spring: "season_spring",
  Summer: "season_summer",
  Autumn: "season_autumn",
  Winter: "season_winter",
};

export function CatalogScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { totalItems } = useCart();
  const { t } = useLanguage();
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const showStatus = (message: string) => {
    setStatus(message);
    if (statusTimer.current) {
      clearTimeout(statusTimer.current);
    }
    statusTimer.current = setTimeout(() => setStatus(""), 2500);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      setProducts(response);
    } catch (error) {
      showStatus(error instanceof Error ? error.message : t("catalog_load_failed"));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();

    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
      }
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => !query || (product.name || "").toLowerCase().includes(query));
  }, [products, search]);

  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.topBar, compact ? styles.topBarCompact : null]}>
        <Pressable accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.topActions}>
          <LanguageSelector />
          <CurrencySwitcher />

          <Pressable accessibilityLabel={t("open_cart")} onPress={() => router.push("/cart")} style={styles.cartButton}>
            <MaterialIcons name="shopping-cart" size={18} color={colors.text} />
            {totalItems > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroEyebrow}>{t("catalog_shop")}</Text>
          <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>{t("catalog_title")}</Text>
          <Text style={[styles.heroSubtitle, compact ? styles.heroSubtitleCompact : null]}>{t("catalog_subtitle")}</Text>
        </View>

        <View style={styles.heroActionRow}>
          <View style={styles.heroMetaCard}>
            <Text style={styles.heroMetaText}>{t("catalog_plants_listed", { count: products.length })}</Text>
          </View>

          <Pressable onPress={() => router.push("/sell")} style={styles.sellShortcut}>
            <View style={styles.sellShortcutIcon}>
              <MaterialIcons name="add-business" size={18} color={colors.white} />
            </View>
            <View style={styles.sellShortcutCopy}>
              <Text style={styles.sellShortcutTitle}>{t("catalog_sell_plants")}</Text>
              <Text style={styles.sellShortcutMeta}>{t("catalog_list_for_sale")}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={styles.searchShell}>
        <MaterialIcons name="search" size={18} color={colors.textMuted} />
        <TextInput
          onChangeText={setSearch}
          placeholder={t("search_placeholder")}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={search}
        />
      </View>

      <Pressable onPress={() => router.push("/sell")} style={[styles.sellBanner, compact ? styles.sellBannerCompact : null]}>
        <View style={styles.sellBannerIcon}>
          <MaterialIcons name="storefront" size={24} color={colors.white} />
        </View>
        <View style={styles.sellBannerCopy}>
          <Text style={styles.sellBannerTitle}>{t("catalog_sell_plants")}</Text>
          <Text style={styles.sellBannerText}>{t("catalog_saved_immediately")}</Text>
        </View>
        <View style={styles.sellBannerArrow}>
          <MaterialIcons name="chevron-right" size={22} color={colors.primaryDark} />
        </View>
      </Pressable>

      <Pressable
        onPress={() => router.push("/season/all")}
        style={[styles.allPlantsCard, compact ? styles.allPlantsCardCompact : null]}
      >
        <View style={[styles.allPlantsIcon, compact ? styles.allPlantsIconCompact : null]}>
          <MaterialIcons name="local-florist" size={26} color={colors.white} />
        </View>
        <View style={styles.allPlantsCopy}>
          <Text style={[styles.allPlantsText, compact ? styles.allPlantsTextCompact : null]}>{t("catalog_all_plants")}</Text>
          <Text style={[styles.allPlantsMeta, compact ? styles.allPlantsMetaCompact : null]}>{t("catalog_browse_all")}</Text>
        </View>
        <View style={styles.allPlantsArrow}>
          <MaterialIcons name="chevron-right" size={22} color={colors.primaryDark} />
        </View>
      </Pressable>

      <View style={styles.seasonGrid}>
        {seasons.map((season) => (
          <Pressable
            key={season}
            onPress={() => router.push(`/season/${season.toLowerCase()}`)}
            style={styles.seasonHeroCard}
          >
            <Image resizeMode="cover" source={seasonImages[season]} style={styles.seasonHeroImage} />
            <View style={styles.seasonHeroScrim} />
            <View style={styles.seasonHeroCopy}>
              <Text style={styles.seasonName}>{t(seasonKeyMap[season])}</Text>
              <Text style={styles.seasonMeta}>{t("catalog_browse_season", { season: t(seasonKeyMap[season]) })}</Text>
            </View>
            <View style={styles.seasonHeroIcon}>
              <MaterialIcons name="chevron-right" size={22} color={colors.white} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBlock}>
          <Text style={styles.sectionEyebrow}>{t("catalog_live_marketplace")}</Text>
          <Text style={styles.sectionTitle}>{t("catalog_available_plants")}</Text>
        </View>
        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCountValue}>{loading ? "..." : filteredProducts.length}</Text>
          <Text style={styles.sectionCountLabel}>{loading ? t("loading") : t("listed")}</Text>
        </View>
      </View>

      {filteredProducts.length > 0 ? (
        <View style={styles.productList}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              actionLabel={t("add_to_cart")}
              onAdded={(savedProduct) => showStatus(t("product_saved_cart", { name: savedProduct.name }))}
              product={product}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t("catalog_no_plants_search")}</Text>
        </View>
      )}

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  topBarCompact: {
    alignItems: "flex-start",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  cartButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    position: "relative",
    width: 42,
    ...shadows.soft,
  },
  cartBadge: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 5,
    position: "absolute",
    right: -4,
    top: -4,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  heroCard: {
    backgroundColor: "#6A52CB",
    borderRadius: 30,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    borderRadius: 24,
    padding: spacing.md,
  },
  heroTextBlock: {
    gap: spacing.xs,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },
  heroTitleCompact: {
    fontSize: 21,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
  },
  heroSubtitleCompact: {
    lineHeight: 20,
  },
  heroActionRow: {
    gap: spacing.sm,
  },
  heroMetaCard: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroMetaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  sellShortcut: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 22,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  sellShortcutIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sellShortcutCopy: {
    flex: 1,
  },
  sellShortcutTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  sellShortcutMeta: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: "#24513B",
    fontSize: 13,
    fontWeight: "700",
  },
  searchShell: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
  },
  sellBanner: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(124,92,255,0.18)",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  sellBannerCompact: {
    borderRadius: 20,
  },
  sellBannerIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  sellBannerCopy: {
    flex: 1,
  },
  sellBannerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sellBannerText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  sellBannerArrow: {
    alignItems: "center",
    backgroundColor: "#F4EEF9",
    borderRadius: 18,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  seasonGrid: {
    gap: 12,
  },
  seasonHeroCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    height: 104,
    overflow: "hidden",
    position: "relative",
    ...shadows.soft,
  },
  seasonHeroImage: {
    ...StyleSheet.absoluteFillObject,
    height: "100%",
    width: "100%",
  },
  seasonHeroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 10, 29, 0.38)",
  },
  seasonHeroCopy: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  seasonName: {
    color: colors.white,
    fontSize: 21,
    fontWeight: "900",
  },
  seasonMeta: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  seasonHeroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
    height: 40,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 40,
    zIndex: 1,
  },
  allPlantsCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(44,122,87,0.16)",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    height: 104,
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  allPlantsCardCompact: {
    borderRadius: 20,
    gap: spacing.sm,
    height: 96,
    paddingHorizontal: spacing.md,
  },
  allPlantsIcon: {
    alignItems: "center",
    backgroundColor: "#2C7A57",
    borderRadius: 20,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  allPlantsIconCompact: {
    borderRadius: 18,
    height: 42,
    width: 42,
  },
  allPlantsCopy: {
    flex: 1,
    justifyContent: "center",
  },
  allPlantsText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
  },
  allPlantsTextCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  allPlantsMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
  },
  allPlantsMetaCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  allPlantsArrow: {
    alignItems: "center",
    backgroundColor: "#E8F7EF",
    borderRadius: 18,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  sectionHeader: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    minHeight: 104,
    padding: spacing.lg,
    ...shadows.soft,
  },
  sectionTitleBlock: {
    flex: 1,
    gap: 4,
  },
  sectionEyebrow: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  sectionCountBadge: {
    alignItems: "center",
    backgroundColor: "#F4EEF9",
    borderColor: "rgba(106,82,203,0.12)",
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 76,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sectionCountValue: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  sectionCountLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  productList: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    marginTop: spacing.sm,
    padding: spacing.lg,
    ...shadows.soft,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
});
