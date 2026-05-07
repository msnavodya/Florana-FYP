import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { CurrencySwitcher } from "../components/CurrencySwitcher";
import { LanguageSelector } from "../components/LanguageSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api/config";
import { createProduct, deleteProduct, getProducts } from "../lib/api/shop";
import { appendImageAsset } from "../lib/api/upload";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { Product } from "../types/shop";
import { seasons } from "../utils/shop";

const seasonKeyMap: Record<(typeof seasons)[number], string> = {
  Spring: "season_spring",
  Summer: "season_summer",
  Autumn: "season_autumn",
  Winter: "season_winter",
};

export function SellScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { totalItems, removeItem, formatMoney } = useCart();
  const { t } = useLanguage();
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingListing, setSavingListing] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [newPlant, setNewPlant] = useState({
    name: "",
    price: "",
    season: "Spring",
    image: null as ImagePicker.ImagePickerAsset | null,
  });

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

  const listingPrice = Number(newPlant.price);
  const listingReady = Boolean(newPlant.name.trim() && Number.isFinite(listingPrice) && listingPrice > 0 && newPlant.image);
  const listedCount = products.length;
  const totalValue = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.price || 0), 0),
    [products]
  );

  const resetListingForm = () => {
    setNewPlant({ name: "", price: "", season: "Spring", image: null });
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showStatus(t("catalog_photo_permission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPlant((current) => ({ ...current, image: result.assets[0] }));
    }
  };

  const handleSell = async () => {
    const trimmedName = newPlant.name.trim();
    const price = Number(newPlant.price);

    if (!trimmedName) {
      showStatus(t("catalog_name_required"));
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      showStatus(t("catalog_price_required"));
      return;
    }

    if (!newPlant.image) {
      showStatus(t("catalog_photo_required"));
      return;
    }

    const formData = new FormData();
    formData.append("name", trimmedName);
    formData.append("price", String(price));
    formData.append("season", newPlant.season);

    try {
      setSavingListing(true);
      await appendImageAsset(formData, "file", newPlant.image, "plant");
      const savedProduct = await createProduct(formData);
      setProducts((current) => [savedProduct, ...current.filter((product) => product.id !== savedProduct.id)]);
      resetListingForm();
      showStatus(
        t("catalog_product_saved", {
          name: savedProduct.name,
          season: t(seasonKeyMap[savedProduct.season as keyof typeof seasonKeyMap] || "catalog_season"),
        })
      );
      await loadProducts();
    } catch (error) {
      showStatus(error instanceof Error ? error.message : t("catalog_upload_failed"));
    } finally {
      setSavingListing(false);
    }
  };

  const handleDelete = async (product: Product) => {
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
      showStatus(error instanceof Error ? error.message : t("product_delete_failed"));
    } finally {
      setDeletingProductId(null);
    }
  };

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
          <View style={styles.heroBadge}>
            <MaterialIcons name="storefront" size={16} color={colors.white} />
            <Text style={styles.heroBadgeText}>{t("catalog_sell_plants")}</Text>
          </View>
          <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>{t("catalog_list_for_sale")}</Text>
          <Text style={styles.heroSubtitle}>{t("catalog_saved_immediately")}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{listedCount}</Text>
              <Text style={styles.heroStatLabel}>{t("listed")}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{formatMoney(totalValue)}</Text>
              <Text style={styles.heroStatLabel}>{t("price")}</Text>
            </View>
          </View>
        </View>

        {status ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}

        <View style={styles.sellForm}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>{t("catalog_list_for_sale")}</Text>
              <Text style={styles.formSubtitle}>{t("catalog_photo_help")}</Text>
            </View>
            <View style={styles.formIconShell}>
              <MaterialIcons name="sell" size={22} color={colors.primaryDark} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t("catalog_plant_name")}</Text>
            <View style={styles.fieldShell}>
              <MaterialIcons name="local-florist" size={18} color={colors.textMuted} />
              <TextInput
                onChangeText={(value) => setNewPlant((current) => ({ ...current, name: value }))}
                placeholder={t("catalog_plant_name")}
                placeholderTextColor={colors.textMuted}
                style={styles.fieldInput}
                value={newPlant.name}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t("price")}</Text>
            <View style={styles.fieldShell}>
              <MaterialIcons name="payments" size={18} color={colors.textMuted} />
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={(value) => setNewPlant((current) => ({ ...current, price: value }))}
                placeholder={t("price")}
                placeholderTextColor={colors.textMuted}
                style={styles.fieldInput}
                value={newPlant.price}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>{t("catalog_season")}</Text>
          <View style={styles.seasonChipWrap}>
            {seasons.map((season) => {
              const active = newPlant.season === season;
              return (
                <Pressable
                  key={season}
                  onPress={() => setNewPlant((current) => ({ ...current, season }))}
                  style={[styles.seasonChip, active ? styles.seasonChipActive : null]}
                >
                  <Text style={[styles.seasonChipText, active ? styles.seasonChipTextActive : null]}>{t(seasonKeyMap[season])}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={() => void pickImage()} style={[styles.photoPicker, newPlant.image ? styles.photoPickerSelected : null]}>
            {newPlant.image ? (
              <Image resizeMode="cover" source={{ uri: newPlant.image.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoIconShell}>
                  <MaterialIcons name="cloud-upload" size={24} color={colors.primaryDark} />
                </View>
                <Text style={styles.photoPlaceholderTitle}>{t("catalog_choose_photo")}</Text>
                <Text style={styles.photoPlaceholderText}>{t("catalog_photo_help")}</Text>
              </View>
            )}
          </Pressable>

          {newPlant.image ? (
            <View style={styles.photoActions}>
              <PrimaryButton label={t("catalog_change_photo")} onPress={() => void pickImage()} variant="secondary" />
              <Pressable onPress={() => setNewPlant((current) => ({ ...current, image: null }))} style={styles.removePhotoButton}>
                <MaterialIcons name="close" size={16} color="#B33D68" />
                <Text style={styles.removePhotoText}>{t("catalog_remove_photo")}</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>{t("catalog_listing_preview")}</Text>
            <View style={styles.previewRow}>
              <View style={styles.previewAvatar}>
                <MaterialIcons name="spa" size={22} color={colors.primaryDark} />
              </View>
              <View style={styles.previewCopy}>
                <Text style={styles.previewName}>{newPlant.name.trim() || t("catalog_plant_name_preview")}</Text>
                <Text style={styles.previewMeta}>{t("catalog_preview_catalog", { season: t(seasonKeyMap[newPlant.season as keyof typeof seasonKeyMap]) })}</Text>
              </View>
            </View>
            <Text style={styles.previewPrice}>{formatMoney(Number.isFinite(listingPrice) && listingPrice > 0 ? listingPrice : 0)}</Text>
          </View>

          <View style={styles.sellActions}>
            <PrimaryButton
              disabled={savingListing || !listingReady}
              label={savingListing ? t("catalog_saving_listing") : t("catalog_list_plant")}
              onPress={() => void handleSell()}
            />
            <PrimaryButton disabled={savingListing} label={t("clear_form")} onPress={resetListingForm} variant="secondary" />
          </View>
        </View>

        <View style={styles.manageSection}>
          <View style={styles.manageHeader}>
            <Text style={styles.manageTitle}>{t("catalog_your_listed_plants")}</Text>
            <Pressable onPress={() => router.replace("/catalog")} style={styles.catalogLink}>
              <Text style={styles.catalogLinkText}>{t("nav_catalog")}</Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.primaryDark} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t("loading")}</Text>
            </View>
          ) : (
            <View style={styles.manageList}>
              {products.map((product) => {
                const imageUri = product.image ? buildApiUrl(product.image) : null;

                return (
                  <View key={product.id} style={styles.manageCard}>
                    {imageUri ? (
                      <Image resizeMode="cover" source={{ uri: imageUri }} style={styles.manageImage} />
                    ) : (
                      <View style={styles.manageImageFallback}>
                        <Text style={styles.manageImageFallbackText}>{t("no_image")}</Text>
                      </View>
                    )}

                    <View style={styles.manageContent}>
                      <Text style={styles.manageName}>{product.name}</Text>
                      <Text style={styles.manageMeta}>{t(seasonKeyMap[product.season as keyof typeof seasonKeyMap] || "catalog_season")}</Text>
                    </View>

                    <PrimaryButton
                      disabled={deletingProductId === product.id}
                      label={deletingProductId === product.id ? t("removing") : t("delete")}
                      onPress={() => void handleDelete(product)}
                      variant="secondary"
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

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
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroCard: {
    backgroundColor: "#21493A",
    borderRadius: 30,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    borderRadius: 24,
    padding: spacing.md,
  },
  heroBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  heroBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 32,
  },
  heroTitleCompact: {
    fontSize: 21,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroStatCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    flex: 1,
    padding: spacing.md,
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "uppercase",
  },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: "#24513B",
    fontSize: 13,
    fontWeight: "700",
  },
  sellForm: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 26,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  formHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  formTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  formSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  formIconShell: {
    alignItems: "center",
    backgroundColor: "#F4EEF9",
    borderRadius: 18,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  fieldShell: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  fieldInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
  },
  seasonChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  seasonChip: {
    backgroundColor: "#F4EEF9",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  seasonChipActive: {
    backgroundColor: colors.primaryDark,
  },
  seasonChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  seasonChipTextActive: {
    color: colors.white,
  },
  photoPicker: {
    alignItems: "center",
    backgroundColor: "#F9F6FF",
    borderColor: colors.border,
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 1.5,
    justifyContent: "center",
    minHeight: 250,
    overflow: "hidden",
  },
  photoPickerSelected: {
    borderStyle: "solid",
    borderColor: "rgba(124,92,255,0.28)",
  },
  photoPlaceholder: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  photoIconShell: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
    ...shadows.soft,
  },
  photoPlaceholderTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  photoPlaceholderText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  previewImage: {
    height: 250,
    width: "100%",
  },
  photoActions: {
    gap: spacing.sm,
  },
  removePhotoButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  removePhotoText: {
    color: "#B33D68",
    fontSize: 13,
    fontWeight: "800",
  },
  previewCard: {
    backgroundColor: "#F7F8F2",
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  previewLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  previewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  previewAvatar: {
    alignItems: "center",
    backgroundColor: "#E8F7EF",
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  previewCopy: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  previewMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  previewPrice: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "900",
  },
  sellActions: {
    gap: spacing.sm,
  },
  manageSection: {
    gap: spacing.md,
  },
  manageHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  manageTitle: {
    color: colors.white,
    fontSize: 21,
    fontWeight: "900",
    flex: 1,
  },
  catalogLink: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  catalogLinkText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
  },
  manageList: {
    gap: spacing.md,
  },
  manageCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
    ...shadows.soft,
  },
  manageImage: {
    borderRadius: 18,
    height: 210,
    width: "100%",
  },
  manageImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    height: 210,
    justifyContent: "center",
  },
  manageImageFallbackText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  manageContent: {
    gap: spacing.xs,
  },
  manageMeta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  manageName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    padding: spacing.lg,
    ...shadows.soft,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
});
