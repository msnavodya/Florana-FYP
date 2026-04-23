import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { buildApiUrl } from "../lib/api/config";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import type { Plant } from "../types/plants";

interface PlantCardProps {
  plant: Plant;
  onDelete?: () => void;
  deleting?: boolean;
}

export function PlantCard({ plant, onDelete, deleting = false }: PlantCardProps) {
  const imageUri = plant.image_path ? buildApiUrl(plant.image_path) : null;

  return (
    <Pressable onPress={() => router.push(`/flower/${encodeURIComponent(plant.name)}`)} style={[styles.card, plant.warning ? styles.warningCard : null]}>
      {onDelete ? (
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>{deleting ? "..." : "Delete"}</Text>
        </Pressable>
      ) : null}

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <View style={styles.imageFallback}><Text style={styles.imageFallbackText}>Plant</Text></View>}
      <View style={styles.info}>
        <Text style={styles.name}>{plant.name}{plant.warning ? " !" : ""}</Text>
        {plant.info ? <Text style={[styles.meta, plant.warning ? styles.warningText : null]}>{plant.info}</Text> : null}
        {plant.badges?.length ? (
          <View style={styles.badgeRow}>
            {plant.badges.map((badge, index) => (
              <View key={`${badge}-${index}`} style={[styles.badge, plant.warning ? styles.badgeWarning : styles.badgeSafe]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    position: "relative",
    ...shadows.soft,
  },
  warningCard: {
    borderColor: colors.danger,
  },
  deleteButton: {
    alignSelf: "flex-end",
  },
  deleteText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  image: {
    borderRadius: radii.md,
    height: 180,
    width: "100%",
  },
  imageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    height: 180,
    justifyContent: "center",
  },
  imageFallbackText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  info: {
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  warningText: {
    color: colors.danger,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeWarning: {
    backgroundColor: "#F8D8D8",
  },
  badgeSafe: {
    backgroundColor: "#D8F9D2",
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
});
