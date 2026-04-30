import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { GrowthChart } from "../components/GrowthChart";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
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

  const handleAddGrowth = async () => {
    if (!newHeight || !plant?._id) {
      return;
    }

    const formData = new FormData();
    formData.append("plant_id", plant._id);
    formData.append("height", newHeight);
    formData.append("health", newHealth || "Good");
    formData.append("notes", newNotes);

    await addGrowth(formData);
    const growthResult = await getGrowth(plant._id);
    setGrowthData(growthResult.data || []);
    setNewHeight("");
    setNewHealth("");
    setNewNotes("");
  };

  return (
    <Screen>
      <TopBar title={decodedName || "Plant"} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {loading ? <Text style={styles.loading}>Loading...</Text> : null}

      {plant ? (
        <View style={styles.content}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>{plant.name}</Text>
            <Text style={styles.heroBody}>{plant.species || "Plant profile and growth history"}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Plant Details</Text>
            <Text style={styles.row}>Sun: {plant.sunlight || "N/A"}</Text>
            <Text style={styles.row}>Water: {plant.wateringFrequency || "N/A"}</Text>
            <Text style={styles.row}>Type: {plant.species || "N/A"}</Text>
            <Text style={styles.row}>Soil: {plant.soilType || "N/A"}</Text>
            <Text style={styles.row}>Climate: {plant.climate || "N/A"}</Text>
            <Text style={styles.row}>Location: {plant.location || "N/A"}</Text>
            <Text style={styles.row}>Last Watered: {plant.lastWatered || "N/A"}</Text>
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
            <PrimaryButton label="Add Record" onPress={() => void handleAddGrowth()} disabled={!plant?._id} />
          </View>
        </View>
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
  },
  heroCard: {
    backgroundColor: colors.backgroundDeep,
    borderRadius: radii.lg,
    gap: spacing.xs,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
  },
  heroBody: {
    color: "#E6D7FF",
    fontSize: 14,
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
