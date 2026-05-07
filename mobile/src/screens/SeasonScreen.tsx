import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { CurrencySwitcher } from "../components/CurrencySwitcher";
import { LanguageSelector } from "../components/LanguageSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api/config";
import { deleteProduct, getProducts } from "../lib/api/shop";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { Product } from "../types/shop";
import { formatPrice, seasons } from "../utils/shop";

const seasonTabs = [...seasons.map((season) => season.toLowerCase()), "all"] as const;
const seasonImages = {
  spring: brandAssets.spring,
  summer: brandAssets.summer,
  autumn: brandAssets.autumn,
  winter: brandAssets.winter,
} as const;

const seasonKeyMap = {
  spring: "season_spring",
  summer: "season_summer",
  autumn: "season_autumn",
  winter: "season_winter",
} as const;

export function SeasonScreen() {
  const params = useLocalSearchParams<{ season?: string }>();
  const routeSeason = typeof params.season === "string" ? params.season.toLowerCase() : "all";
  const safeSeason = seasonTabs.includes(routeSeason as (typeof seasonTabs)[number]) ? routeSeason : "all";
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { totalItems, currency, addItem, removeItem } = useCart();
  const { t } = useLanguage();
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const showStatus = (message: string) => {
    setStatus(message);
    if (statusTimer.current) {
      clearTimeout(statusTimer.current);
    }
    statusTimer.current = setTimeout(() => setStatus(""), 2400);
  };

  const loadProducts = useCallback(async () => {
    try {
      const response = await getProducts();
      setProducts(response);
    } catch {
      setProducts([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProducts();
    }, [loadProducts])
  );

  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
      }
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = !query || (product.name || "").toLowerCase().includes(query);
      const productSeason = (product.season || "").toLowerCase();
      const matchesSeason = safeSeason === "all" || productSeason === safeSeason;
      return matchesSearch && matchesSeason;
    });
  }, [products, safeSeason, search]);

  const handleAddToCart = async (product: Product) => {
    await addItem(product);
    showStatus(t("product_added_cart", { name: product.name }));
  };

  const handleDeleteProduct = async (product: Product) => {
    if (deletingProductId) {
      return;
    }

    try {
      setDeletingProductId(product.id);
      await deleteProduct(product.id);
      await removeItem(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      showStatus(t("product_deleted", { name: product.name }));
      await loadProducts();
    } catch (error) {
      showStatus(error instanceof Error ? error.message : t("product_remove_failed"));
    } finally {
      setDeletingProductId(null);
    }
  };

  const getSeasonLabel = (value: string) => t(seasonKeyMap[value as keyof typeof seasonKeyMap] || "catalog_all_plants");
  const title = safeSeason === "all" ? t("catalog_all_plants") : t("season_plants_title", { season: getSeasonLabel(safeSeason) });

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
          <Text style={styles.heroEyebrow}>{t("season_finder")}</Text>
          <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>{title}</Text>
          <Text style={[styles.heroSubtitle, compact ? styles.heroSubtitleCompact : null]}>{t("season_subtitle")}</Text>
        </View>

        <View style={styles.heroMetaCard}>
          <Text style={styles.heroMetaText}>{t("season_results", { count: filteredProducts.length })}</Text>
        </View>
      </View>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={styles.seasonNav}>
        {seasonTabs.map((item) => {
          const active = safeSeason === item;
          return (
            <Pressable
              key={item}
              onPress={() => router.push(`/season/${item}`)}
              style={[styles.seasonButton, active ? styles.seasonButtonActive : null]}
            >
              <Text style={[styles.seasonButtonText, active ? styles.seasonButtonTextActive : null]}>
                {item === "all" ? t("season_all") : getSeasonLabel(item)}
              </Text>
            </Pressable>
          );
        })}
      </View>

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

      {filteredProducts.length > 0 ? (
        <View style={styles.productGrid}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/product/[id]",
                    params: {
                      id: product.id,
                      name: product.name,
                      season: product.season,
                      price: String(product.price),
                      image: product.image || "",
                    },
                  })
                }
              >
                <View style={styles.productVisual}>
                  <Pressable
                    accessibilityLabel={t("remove_product", { name: product.name })}
                    disabled={deletingProductId === product.id}
                    onPress={(event) => {
                      event.stopPropagation();
                      void handleDeleteProduct(product);
                    }}
                    style={styles.deleteProductButton}
                  >
                    {deletingProductId === product.id ? (
                      <Text style={styles.deleteProductBusy}>...</Text>
                    ) : (
                      <MaterialIcons name="delete-outline" size={17} color="#B33D68" />
                    )}
                  </Pressable>
                  {product.image ? (
                    <Image resizeMode="cover" source={{ uri: buildApiUrl(product.image) }} style={styles.productImage} />
                  ) : (
                    <Image
                      resizeMode="cover"
                      source={seasonImages[(product.season || safeSeason).toLowerCase() as keyof typeof seasonImages] || brandAssets.spring}
                      style={styles.productImage}
                    />
                  )}
                <Text style={styles.productSeasonChip}>{product.season ? getSeasonLabel(product.season.toLowerCase()) : getSeasonLabel(safeSeason)}</Text>
                </View>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productMeta}>{product.season ? getSeasonLabel(product.season.toLowerCase()) : ""}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price, currency)}</Text>
              </Pressable>
              <View style={styles.productActions}>
                <PrimaryButton label={t("add_to_cart")} onPress={() => void handleAddToCart(product)} />
                <PrimaryButton
                  disabled={deletingProductId === product.id}
                  label={deletingProductId === product.id ? t("deleting") : t("delete")}
                  onPress={() => void handleDeleteProduct(product)}
                  variant="secondary"
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t("season_no_plants")}</Text>
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
  seasonNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  seasonButton: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  seasonButtonActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  seasonButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  seasonButtonTextActive: {
    color: colors.white,
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
  productGrid: {
    gap: spacing.md,
  },
  productCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  productVisual: {
    alignItems: "flex-start",
    borderRadius: 20,
    height: 220,
    justifyContent: "flex-end",
    marginBottom: spacing.sm,
    overflow: "hidden",
    padding: spacing.md,
    position: "relative",
  },
  productImage: {
    ...StyleSheet.absoluteFillObject,
    height: "100%",
    width: "100%",
  },
  productSeasonChip: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteProductButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,245,248,0.96)",
    borderColor: "rgba(179,61,104,0.18)",
    borderRadius: 16,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 36,
    zIndex: 2,
  },
  deleteProductBusy: {
    color: "#B33D68",
    fontSize: 13,
    fontWeight: "900",
  },
  productName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  productMeta: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  productPrice: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },
  productActions: {
    gap: spacing.sm,
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
