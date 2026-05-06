import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { GrowthChart } from "../components/GrowthChart";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { buildApiUrl } from "../lib/api/config";
import { addGrowth, getGrowth, getPlantByName } from "../lib/api/plants";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import type { GrowthRecord, Plant } from "../types/plants";
import { getHealthColor } from "../utils/format";

export function FlowerProfileScreen() {
  const { plantName } = useLocalSearchParams<{ plantName: string }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [growthData, setGrowthData] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHeight, setNewHeight] = useState("");
  const [newHealth, setNewHealth] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [savingGrowth, setSavingGrowth] = useState(false);
  const decodedName = decodeURIComponent(plantName || "");

  useEffect(() => {
    const load = async () => {
      try {
        const plantData = await getPlantByName(decodedName);
        setPlant(plantData);
        if (plantData._id) {
          const growthResult = await getGrowth(plantData._id);
          setGrowthData(growthResult.data || []);
        }
      } catch {
        setPlant({
          name: decodedName,
          species: "Unknown",
          sunlight: "N/A",
          wateringFrequency: "N/A",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [decodedName]);

  const sortedGrowth = useMemo(
    () => [...growthData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [growthData]
  );
  const imageUri = plant?.image_path ? buildApiUrl(plant.image_path) : null;
  const detailRows = plant
    ? [
        ["Species", plant.species],
        ["Flower ID", plant.flowerId],
        ["Catalog", plant.flowerCatalog],
        ["Location", plant.location],
        ["Specific location", plant.specificLocation],
        ["Climate", plant.climate],
        ["Sunlight", plant.sunlight],
        ["Soil", plant.soilType],
        ["Watering", plant.wateringFrequency],
        ["Fertilizer", plant.fertilizerSchedule],
        ["Last watered", plant.lastWatered],
        ["Initial size", plant.initialSize],
      ].filter(([, value]) => Boolean(value && String(value).trim()))
    : [];

  const handleAddGrowth = async () => {
    const heightValue = Number(newHeight);

    if (!plant?._id) {
      Alert.alert("Profile unavailable", "Open a saved plant profile before adding growth records.");
      return;
    }

    if (!Number.isFinite(heightValue) || heightValue <= 0) {
      Alert.alert("Invalid height", "Enter a height greater than 0 cm.");
      return;
    }

    try {
      setSavingGrowth(true);
      const formData = new FormData();
      formData.append("plant_id", plant._id);
      formData.append("height", String(heightValue));
      formData.append("health", newHealth.trim() || "Good");
      formData.append("notes", newNotes.trim());

      await addGrowth(formData);
      const growthResult = await getGrowth(plant._id);
      setGrowthData(growthResult.data || []);
      setNewHeight("");
      setNewHealth("");
      setNewNotes("");
      Alert.alert("Growth saved", "The plant profile has been updated.");
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Unable to add growth record.");
    } finally {
      setSavingGrowth(false);
    }
  };

  return (
    <Screen>
      <TopBar title={decodedName || "Plant"} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {loading ? <Text style={styles.loading}>Loading...</Text> : null}

      {plant ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            {imageUri ? (
              <Image resizeMode="cover" source={{ uri: imageUri }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroImageFallback}>
                <MaterialIcons name="local-florist" size={42} color="#DCCEF2" />
              </View>
            )}
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>{plant.name}</Text>
              <Text style={styles.heroBody}>{plant.species || "Plant profile and growth history"}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroChip}>
                  <MaterialIcons name="spa" size={14} color={colors.white} />
                  <Text style={styles.heroChipText}>{plant.tracking === false ? "Not tracked" : "Tracking"}</Text>
                </View>
                {plant.sunlight ? (
                  <View style={styles.heroChip}>
                    <MaterialIcons name="wb-sunny" size={14} color={colors.white} />
                    <Text style={styles.heroChipText}>{plant.sunlight}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Plant Details</Text>
            {detailRows.length === 0 ? <Text style={styles.muted}>No profile details saved yet.</Text> : null}
            <View style={styles.detailsGrid}>
              {detailRows.map(([label, value]) => (
                <View key={label} style={styles.detailTile}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Growth Tracker</Text>
            <GrowthChart data={sortedGrowth} />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Growth History</Text>
            {sortedGrowth.length === 0 ? <Text style={styles.muted}>No records available</Text> : null}
            <FlatList
              data={sortedGrowth}
              keyExtractor={(item, index) => `${item.date}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <Text style={styles.row}>Date: {new Date(item.date).toLocaleDateString()}</Text>
                  <Text style={styles.row}>Height: {item.height} cm</Text>
                  <Text style={[styles.row, { color: getHealthColor(item.health) }]}>Health: {item.health}</Text>
                  {item.notes ? <Text style={styles.row}>Notes: {item.notes}</Text> : null}
                </View>
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.historyList}
            />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Add Growth Record</Text>
            <TextInput placeholder="Height (cm)" placeholderTextColor={colors.textMuted} style={styles.input} value={newHeight} onChangeText={setNewHeight} keyboardType="decimal-pad" />
            <TextInput placeholder="Health (e.g. Good, Bad)" placeholderTextColor={colors.textMuted} style={styles.input} value={newHealth} onChangeText={setNewHealth} />
            <TextInput placeholder="Notes (optional)" placeholderTextColor={colors.textMuted} style={[styles.input, styles.notesInput]} value={newNotes} onChangeText={setNewNotes} multiline />
            <PrimaryButton label={savingGrowth ? "Saving..." : "Add Record"} onPress={() => void handleAddGrowth()} disabled={!plant?._id || savingGrowth} />
          </View>
        </ScrollView>
      ) : null}

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    color: colors.textMuted,
    fontSize: 14,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroCard: {
    backgroundColor: colors.backgroundDeep,
    borderRadius: 28,
    minHeight: 340,
    overflow: "hidden",
    ...shadows.card,
  },
  heroImage: {
    height: 340,
    width: "100%",
  },
  heroImageFallback: {
    alignItems: "center",
    backgroundColor: colors.backgroundDeep,
    height: 340,
    justifyContent: "center",
    width: "100%",
  },
  heroOverlay: {
    backgroundColor: "rgba(36,24,61,0.82)",
    bottom: 0,
    gap: spacing.xs,
    left: 0,
    padding: spacing.lg,
    position: "absolute",
    right: 0,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
  },
  heroBody: {
    color: "#E6D7FF",
    fontSize: 14,
    lineHeight: 21,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroChip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  heroChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadows.soft,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  row: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  detailsGrid: {
    gap: spacing.sm,
  },
  detailTile: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
  },
  historyItem: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  historyList: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  notesInput: {
    minHeight: 96,
    paddingVertical: spacing.sm,
    textAlignVertical: "top",
  },
});
