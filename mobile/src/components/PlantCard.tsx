// Render a reusable mobile UI component for Plant Card.
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api/config";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { Plant } from "../types/plants";

interface PlantCardProps {
  plant: Plant;
  onDelete?: () => void;
  deleting?: boolean;
}

export function PlantCard({ plant, onDelete, deleting = false }: PlantCardProps) {
  const { t } = useLanguage();
  const { height, width } = useWindowDimensions();
  // Tighten the card slightly on smaller devices while preserving the same content order.
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const imageUri = plant.image_path ? buildApiUrl(plant.image_path) : null;

  return (
    <Pressable onPress={() => router.push(`/flower/${encodeURIComponent(plant.id || plant._id || plant.name)}`)} style={[styles.card, compact ? styles.cardCompact : null, plant.warning ? styles.warningCard : null]}>
      {onDelete ? (
        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>{deleting ? "..." : t("delete")}</Text>
        </Pressable>
      ) : null}

      {imageUri ? (
        <Image resizeMode="cover" source={{ uri: imageUri }} style={[styles.image, compact ? styles.imageCompact : null]} />
      ) : (
        <View style={[styles.imageFallback, compact ? styles.imageCompact : null]}>
          <Text style={styles.imageFallbackText}>{t("plant_label")}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, compact ? styles.nameCompact : null]}>{plant.name}{plant.warning ? " !" : ""}</Text>
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
  cardCompact: {
    borderRadius: 18,
    padding: 14,
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
  imageCompact: {
    height: 148,
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
  nameCompact: {
    fontSize: 16,
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
