import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { CurrencySwitcher } from "../components/CurrencySwitcher";
import { LanguageSelector } from "../components/LanguageSelector";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProductCard } from "../components/ProductCard";
import { Screen } from "../components/Screen";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api/config";
import { createProduct, deleteProduct, getProducts } from "../lib/api/shop";
import { appendImageAsset } from "../lib/api/upload";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { Product } from "../types/shop";
import { seasons } from "../utils/shop";

type BuySellTab = "buy" | "sell";
type LanguageCode = "en" | "si" | "ta";

const catalogCopy: Record<
  LanguageCode,
  {
    shop: string;
    title: string;
    subtitle: string;
    listed: string;
    buy: string;
    sell: string;
    allPlants: string;
    available: string;
    addToCart: string;
    noPlants: string;
    listForSale: string;
    plantName: string;
    price: string;
    listPlant: string;
    yourListed: string;
    remove: string;
  }
> = {
  en: {
    shop: "Florana Shop",
    title: "Season Catalog",
    subtitle: "Browse plants, switch currency instantly, and manage what you want to buy or sell.",
    listed: "{count} plants listed",
    buy: "Buy Plants",
    sell: "Sell Plants",
    allPlants: "All Plants",
    available: "Available Plants",
    addToCart: "Add to Cart",
    noPlants: "No plants found for that search.",
    listForSale: "List a Plant for Sale",
    plantName: "Plant Name",
    price: "Price",
    listPlant: "List Plant",
    yourListed: "Your Listed Plants",
    remove: "Delete",
  },
  si: {
    shop: "ෆ්ලෝරානා වෙළඳසැල",
    title: "සමය අනුව පැල එකතුව",
    subtitle: "පැල බලන්න, මුදල් ඒකකය වහාම මාරු කරන්න, සහ ඔබ මිලදී ගැනීමට හෝ විකිණීමට කැමති දේ කළමනාකරණය කරන්න.",
    listed: "පැල {count}ක් ලැයිස්තුගතයි",
    buy: "පැල මිලදී ගන්න",
    sell: "පැල විකුණන්න",
    allPlants: "සියලු පැල",
    available: "පවතින පැල",
    addToCart: "කරත්තයට දමන්න",
    noPlants: "එම සෙවුම සඳහා පැල හමු නොවීය.",
    listForSale: "විකිණීමට පැලයක් ලැයිස්තුගත කරන්න",
    plantName: "පැල නාමය",
    price: "මිල",
    listPlant: "පැලය ලැයිස්තුගත කරන්න",
    yourListed: "ඔබ ලැයිස්තුගත කළ පැල",
    remove: "මකන්න",
  },
  ta: {
    shop: "ஃப்ளோரானா கடை",
    title: "பருவ கால செடி தொகுப்பு",
    subtitle: "செடிகளை பாருங்கள், நாணயத்தை உடனே மாற்றுங்கள், நீங்கள் வாங்கவோ விற்கவோ விரும்பும்வற்றை நிர்வகிக்குங்கள்.",
    listed: "{count} செடிகள் பட்டியலிடப்பட்டுள்ளன",
    buy: "செடிகள் வாங்க",
    sell: "செடிகள் விற்க",
    allPlants: "அனைத்து செடிகள்",
    available: "கிடைக்கும் செடிகள்",
    addToCart: "வண்டியில் சேர்",
    noPlants: "அந்த தேடலுக்கு செடிகள் கிடைக்கவில்லை.",
    listForSale: "விற்பனைக்கு ஒரு செடியை பட்டியலிடுங்கள்",
    plantName: "செடி பெயர்",
    price: "விலை",
    listPlant: "செடியை பட்டியலிடு",
    yourListed: "நீங்கள் பட்டியலிட்ட செடிகள்",
    remove: "நீக்கு",
  },
};

const seasonImages = {
  Spring: brandAssets.spring,
  Summer: brandAssets.summer,
  Autumn: brandAssets.autumn,
  Winter: brandAssets.winter,
} as const;

export function CatalogScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { totalItems, removeItem } = useCart();
  const { t, languageCode } = useLanguage();
  const copy = catalogCopy[languageCode] || catalogCopy.en;
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BuySellTab>("buy");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
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
      showStatus(error instanceof Error ? error.message : "Unable to load products.");
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

  const listingPrice = Number(newPlant.price);
  const listingReady = Boolean(newPlant.name.trim() && Number.isFinite(listingPrice) && listingPrice > 0 && newPlant.image);

  const resetListingForm = () => {
    setNewPlant({ name: "", price: "", season: "Spring", image: null });
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showStatus("Photo library permission is required to upload a plant.");
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
      showStatus("Add the plant name first.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      showStatus("Enter a valid price greater than 0.");
      return;
    }

    if (!newPlant.image) {
      showStatus("Choose a clear plant photo before saving.");
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
      setActiveTab("buy");
      showStatus(`${savedProduct.name} saved to the ${savedProduct.season} catalog.`);
      await loadProducts();
    } catch (error) {
      showStatus(error instanceof Error ? error.message : "Upload failed.");
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
      showStatus(`Your ${product.name} deleted.`);
      await loadProducts();
    } catch (error) {
      showStatus(error instanceof Error ? error.message : "Delete failed.");
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

          <Pressable accessibilityLabel="Open cart" onPress={() => router.push("/cart")} style={styles.cartButton}>
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
          <Text style={styles.heroEyebrow}>{copy.shop}</Text>
          <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>{copy.title}</Text>
          <Text style={[styles.heroSubtitle, compact ? styles.heroSubtitleCompact : null]}>{copy.subtitle}</Text>
        </View>

        <View style={styles.heroMetaCard}>
          <Text style={styles.heroMetaText}>{copy.listed.replace("{count}", String(products.length))}</Text>
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

      <View style={styles.toggleBar}>
        <Pressable
          onPress={() => setActiveTab("buy")}
          style={[styles.toggleButton, activeTab === "buy" ? styles.toggleButtonActive : null]}
        >
          <Text style={[styles.toggleText, activeTab === "buy" ? styles.toggleTextActive : null]}>{copy.buy}</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("sell")}
          style={[styles.toggleButton, activeTab === "sell" ? styles.toggleButtonActive : null]}
        >
          <Text style={[styles.toggleText, activeTab === "sell" ? styles.toggleTextActive : null]}>{copy.sell}</Text>
        </Pressable>
      </View>

      {activeTab === "buy" ? (
        <>
          <Pressable
            onPress={() => router.push("/season/all")}
            style={[styles.allPlantsCard, compact ? styles.allPlantsCardCompact : null]}
          >
            <View style={[styles.allPlantsIcon, compact ? styles.allPlantsIconCompact : null]}>
              <MaterialIcons name="local-florist" size={26} color={colors.white} />
            </View>
            <View style={styles.allPlantsCopy}>
              <Text style={[styles.allPlantsText, compact ? styles.allPlantsTextCompact : null]}>{copy.allPlants}</Text>
              <Text style={[styles.allPlantsMeta, compact ? styles.allPlantsMetaCompact : null]}>Browse every saved listing</Text>
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
                  <Text style={styles.seasonName}>{season}</Text>
                  <Text style={styles.seasonMeta}>Browse {season.toLowerCase()} plant listings</Text>
                </View>
                <View style={styles.seasonHeroIcon}>
                  <MaterialIcons name="chevron-right" size={22} color={colors.white} />
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionEyebrow}>Live marketplace</Text>
              <Text style={styles.sectionTitle}>{copy.available}</Text>
            </View>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountValue}>{loading ? "..." : filteredProducts.length}</Text>
              <Text style={styles.sectionCountLabel}>{loading ? "Loading" : "Listed"}</Text>
            </View>
          </View>

          {filteredProducts.length > 0 ? (
            <View style={styles.productList}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  actionLabel={copy.addToCart}
                  deleting={deletingProductId === product.id}
                  onAdded={(savedProduct) => showStatus(`${savedProduct.name} saved to cart.`)}
                  onDelete={(productToDelete) => void handleDelete(productToDelete)}
                  product={product}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{copy.noPlants}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.sellSection}>
          <View style={styles.sellForm}>
            <View style={styles.sellHeader}>
              <View>
                <Text style={styles.sectionTitle}>{copy.listForSale}</Text>
                <Text style={styles.sellSubtitle}>Saved listings appear in the season catalog immediately.</Text>
              </View>
              <View style={styles.sellCountBadge}>
                <Text style={styles.sellCountValue}>{products.length}</Text>
                <Text style={styles.sellCountLabel}>Saved</Text>
              </View>
            </View>

            <TextInput
              onChangeText={(value) => setNewPlant((current) => ({ ...current, name: value }))}
              placeholder={copy.plantName}
              placeholderTextColor={colors.textMuted}
              style={styles.fieldInput}
              value={newPlant.name}
            />

            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(value) => setNewPlant((current) => ({ ...current, price: value }))}
              placeholder={copy.price}
              placeholderTextColor={colors.textMuted}
              style={styles.fieldInput}
              value={newPlant.price}
            />

            <Text style={styles.fieldLabel}>Catalog Season</Text>
            <View style={styles.seasonChipWrap}>
              {seasons.map((season) => {
                const active = newPlant.season === season;
                return (
                  <Pressable
                    key={season}
                    onPress={() => setNewPlant((current) => ({ ...current, season }))}
                    style={[styles.seasonChip, active ? styles.seasonChipActive : null]}
                  >
                    <Text style={[styles.seasonChipText, active ? styles.seasonChipTextActive : null]}>{season}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={() => void pickImage()} style={[styles.photoPicker, newPlant.image ? styles.photoPickerSelected : null]}>
              {newPlant.image ? (
                <Image resizeMode="cover" source={{ uri: newPlant.image.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={24} color={colors.primaryDark} />
                  <Text style={styles.photoPlaceholderTitle}>Choose Plant Photo</Text>
                  <Text style={styles.photoPlaceholderText}>Use a clear image for buyers and season pages.</Text>
                </View>
              )}
            </Pressable>

            {newPlant.image ? (
              <View style={styles.photoActions}>
                <PrimaryButton label="Change Photo" onPress={() => void pickImage()} variant="secondary" />
                <Pressable onPress={() => setNewPlant((current) => ({ ...current, image: null }))} style={styles.removePhotoButton}>
                  <MaterialIcons name="close" size={16} color="#B33D68" />
                  <Text style={styles.removePhotoText}>Remove Photo</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Listing Preview</Text>
              <Text style={styles.previewName}>{newPlant.name.trim() || "Plant name"}</Text>
              <Text style={styles.previewMeta}>{newPlant.season} catalog</Text>
              <Text style={styles.previewPrice}>Rs. {Number.isFinite(listingPrice) && listingPrice > 0 ? listingPrice.toFixed(2) : "0.00"}</Text>
            </View>

            <View style={styles.sellActions}>
              <PrimaryButton
                disabled={savingListing || !listingReady}
                label={savingListing ? "Saving Listing..." : copy.listPlant}
                onPress={() => void handleSell()}
              />
              <PrimaryButton
                disabled={savingListing}
                label="Clear Form"
                onPress={resetListingForm}
                variant="secondary"
              />
            </View>
          </View>

          <View style={styles.manageSection}>
            <Text style={styles.sectionTitle}>{copy.yourListed}</Text>

            <View style={styles.manageList}>
              {products.map((product) => {
                const imageUri = product.image ? buildApiUrl(product.image) : null;

                return (
                  <View key={product.id} style={styles.manageCard}>
                    {imageUri ? (
                      <Image resizeMode="cover" source={{ uri: imageUri }} style={styles.manageImage} />
                    ) : (
                      <View style={styles.manageImageFallback}>
                        <Text style={styles.manageImageFallbackText}>No Image</Text>
                      </View>
                    )}

                    <View style={styles.manageContent}>
                      <Text style={styles.manageName}>{product.name}</Text>
                      <Text style={styles.manageMeta}>{product.season}</Text>
                    </View>

                    <PrimaryButton
                      disabled={deletingProductId === product.id}
                      label={deletingProductId === product.id ? "Removing..." : copy.remove}
                      onPress={() => void handleDelete(product)}
                      variant="secondary"
                    />
                  </View>
                );
              })}
            </View>
          </View>
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
  toggleBar: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 20,
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: 4,
  },
  toggleButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  toggleText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  toggleTextActive: {
    color: colors.white,
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
  sellSection: {
    gap: spacing.lg,
  },
  sellForm: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  sellHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  sellSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  sellCountBadge: {
    alignItems: "center",
    backgroundColor: "#F4EEF9",
    borderRadius: 16,
    minWidth: 68,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sellCountValue: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900",
  },
  sellCountLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  fieldInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.md,
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
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
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
    gap: spacing.xs,
    padding: spacing.lg,
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
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  previewLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
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
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  sellActions: {
    gap: spacing.sm,
  },
  manageSection: {
    gap: spacing.md,
  },
  manageList: {
    gap: spacing.md,
  },
  manageCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
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
  manageName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  manageMeta: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
