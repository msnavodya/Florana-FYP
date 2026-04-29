import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { PlantCard } from "../components/PlantCard";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { deletePlant, getPlants } from "../lib/api/plants";
import { colors, radii, spacing, viewport } from "../theme/tokens";
import type { Plant } from "../types/plants";

const fallbackPlants: Plant[] = [
  { id: "1", name: "Monstera", info: "Healthy", warning: false },
  { id: "2", name: "Pothos", info: "Healthy", warning: false },
  { id: "3", name: "Snake Plant", info: "Good", warning: false },
];

export function MyPlantsScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const [menuOpen, setMenuOpen] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPlants = async () => {
    try {
      const response = await getPlants();
      const validPlants = (response || []).filter((plant) => plant && plant.tracking !== false && plant.name?.trim());
      setPlants(validPlants);
    } catch {
      setPlants(fallbackPlants);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlants();
    const interval = setInterval(() => void loadPlants(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (plant: Plant) => {
    const plantId = plant.id || plant._id;
    if (!plantId) {
      return;
    }

    Alert.alert("Delete Plant", "Delete this plant?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(plantId);
          try {
            await deletePlant(plantId);
            setPlants((previous) => previous.filter((entry) => (entry.id || entry._id) !== plantId));
          } catch {
            Alert.alert("Delete failed", "Check backend connectivity and try again.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const warnings = plants.filter((plant) => plant.warning).length;

  return (
    <Screen>
      <TopBar title="My Plants" subtitle="Your flower dashboard" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.headerCard, compact ? styles.headerCardCompact : null]}>
        <Text style={[styles.hello, compact ? styles.helloCompact : null]}>Hello Gardener!</Text>
        <Text style={styles.summary}>{`${plants.length} Plants - ${warnings} Need Attention`}</Text>
      </View>

      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading plants...</Text>
        </View>
      ) : plants.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No plants added</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {plants.map((plant) => {
            const id = plant.id || plant._id || plant.name;
            return <PlantCard key={id} plant={plant} onDelete={() => handleDelete(plant)} deleting={deletingId === (plant.id || plant._id)} />;
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  headerCardCompact: {
    borderRadius: 22,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  hello: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  helloCompact: {
    fontSize: 19,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 14,
  },
  list: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
