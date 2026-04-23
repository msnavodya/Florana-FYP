import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { ProductCard } from "../components/ProductCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useCart } from "../context/CartContext";
import { createProduct, deleteProduct, getProducts } from "../lib/api/shop";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import type { Product } from "../types/shop";
import { seasons } from "../utils/shop";

type BuySellTab = "buy" | "sell";

const seasonImages = {
  Spring: brandAssets.spring,
  Summer: brandAssets.summer,
  Autumn: brandAssets.autumn,
  Winter: brandAssets.winter,
} as const;

export function CatalogScreen() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BuySellTab>("buy");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [newPlant, setNewPlant] = useState({
    name: "",
    price: "",
    season: "Spring",
    image: null as ImagePicker.ImagePickerAsset | null,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      setProducts(response);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(
    () => products.filter((product) => (product.name || "").toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatus("Photo library permission is required to upload a plant.");
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
    if (!newPlant.name || !newPlant.price || !newPlant.image) {
      setStatus("Add the plant name, price, season, and image first.");
      return;
    }

    const formData = new FormData();
    formData.append("name", newPlant.name);
    formData.append("price", newPlant.price);
    formData.append("season", newPlant.season);
    formData.append("file", {
      uri: newPlant.image.uri,
      name: newPlant.image.fileName || "plant.jpg",
      type: newPlant.image.mimeType || "image/jpeg",
    } as unknown as Blob);

    try {
      await createProduct(formData);
      setStatus("Plant listed successfully.");
      setNewPlant({ name: "", price: "", season: "Spring", image: null });
      setActiveTab("buy");
      await loadProducts();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert("Delete Plant", `Delete ${product.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(product.id);
            setStatus(`${product.name} deleted.`);
            await loadProducts();
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Delete failed.");
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <TopBar title="Season Catalog" subtitle="Florana Shop" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.toolbar}>
        <Pressable onPress={() => router.push("/cart")} style={styles.cartButton}>
          <Text style={styles.cartButtonText}>Cart {totalItems > 0 ? `(${totalItems})` : ""}</Text>
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Florana Shop</Text>
        <Text style={styles.heroTitle}>Browse plants, switch currency instantly, and manage what you want to buy or sell.</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaText}>{products.length} plants listed</Text>
        </View>
      </View>

      {status ? <View style={styles.statusCard}><Text style={styles.statusText}>{status}</Text></View> : null}

      <TextInput
        onChangeText={setSearch}
        placeholder="Search plants"
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        value={search}
      />

      <View style={styles.toggleBar}>
        <PrimaryButton label="Buy Plants" onPress={() => setActiveTab("buy")} variant={activeTab === "buy" ? "primary" : "secondary"} />
        <PrimaryButton label="Sell Plants" onPress={() => setActiveTab("sell")} variant={activeTab === "sell" ? "primary" : "secondary"} />
      </View>

      {activeTab === "buy" ? (
        <>
          <View style={styles.seasonGrid}>
            {seasons.map((item) => (
              <Pressable key={item} onPress={() => setSearch(item.toLowerCase())} style={styles.seasonCard}>
                <Image source={seasonImages[item as keyof typeof seasonImages]} style={styles.seasonImage} />
                <Text style={styles.seasonName}>{item}</Text>
              </Pressable>
            ))}

            <Pressable onPress={() => setSearch("")} style={[styles.seasonCard, styles.allCard]}>
              <Text style={styles.seasonName}>All Plants</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Plants</Text>
            <Text style={styles.sectionMeta}>{loading ? "Loading..." : `${filteredProducts.length} listed`}</Text>
          </View>

          {filteredProducts.length > 0 ? (
            <FlatList
              contentContainerStyle={styles.productList}
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ProductCard product={item} />}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No plants found for that search.</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.sellForm}>
          <Text style={styles.sectionTitle}>List a Plant for Sale</Text>

          <TextInput
            onChangeText={(value) => setNewPlant((current) => ({ ...current, name: value }))}
            placeholder="Plant Name"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={newPlant.name}
          />
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(value) => setNewPlant((current) => ({ ...current, price: value }))}
            placeholder="Price"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={newPlant.price}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonChipRow}>
            {seasons.map((item) => (
              <Pressable
                key={item}
                onPress={() => setNewPlant((current) => ({ ...current, season: item }))}
                style={[styles.seasonChip, newPlant.season === item ? styles.activeChip : null]}
              >
                <Text style={[styles.seasonChipText, newPlant.season === item ? styles.activeChipText : null]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <PrimaryButton label={newPlant.image ? "Change Photo" : "Choose Photo"} onPress={() => void pickImage()} variant="secondary" />
          {newPlant.image ? <Image source={{ uri: newPlant.image.uri }} style={styles.previewImage} /> : null}
          <PrimaryButton label="List Plant" onPress={() => void handleSell()} />

          <Text style={styles.sectionTitle}>Your Listed Plants</Text>
          <FlatList
            contentContainerStyle={styles.productList}
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.manageCard}>
                <Text style={styles.manageName}>{item.name}</Text>
                <Text style={styles.manageMeta}>{item.season}</Text>
                <PrimaryButton label="Delete" onPress={() => handleDelete(item)} variant="secondary" />
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cartButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 76,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  cartButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: "#6A52CB",
    borderRadius: radii.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
  },
  heroMeta: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.pill,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroMetaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
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
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  toggleBar: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  seasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  seasonCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 22,
    overflow: "hidden",
    width: "48%",
    ...shadows.soft,
  },
  seasonImage: {
    height: 124,
    width: "100%",
  },
  seasonName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    padding: spacing.md,
  },
  allCard: {
    alignItems: "center",
    backgroundColor: "#F7F8F2",
    justifyContent: "center",
    minHeight: 170,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  productList: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: radii.md,
    marginTop: spacing.sm,
    padding: spacing.lg,
    ...shadows.soft,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  sellForm: {
    gap: spacing.md,
  },
  seasonChipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  seasonChip: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  activeChip: {
    backgroundColor: "#FFFFFF",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 4,
  },
  seasonChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  activeChipText: {
    color: "#352456",
  },
  previewImage: {
    borderRadius: radii.md,
    height: 180,
    width: "100%",
  },
  manageCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  manageName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  manageMeta: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
