// Render the mobile Flower Profile screen.
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { GrowthChart } from "../components/GrowthChart";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api/config";
import { addGrowth, getGrowth, getPlantByName } from "../lib/api/plants";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import type { GrowthRecord, Plant } from "../types/plants";
import { getHealthColor } from "../utils/format";

export function FlowerProfileScreen() {
  const { plantName } = useLocalSearchParams<{ plantName: string }>();
  const { authNotice, setAuthNotice } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [growthData, setGrowthData] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [newHealth, setNewHealth] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [savingGrowth, setSavingGrowth] = useState(false);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Decode once so the route value works cleanly in the header and API lookups.
  const decodedName = decodeURIComponent(plantName || "");

  useEffect(() => {
    // Show one-time success messages when another flow redirects into this profile.
    if (!authNotice) {
      return;
    }

    setStatusMessage(authNotice);
    if (statusTimer.current) {
      clearTimeout(statusTimer.current);
    }

    statusTimer.current = setTimeout(() => {
      setStatusMessage("");
    }, 3200);

    setAuthNotice(null);
  }, [authNotice, setAuthNotice]);

  useEffect(() => {
    // Load the plant profile first, then fetch growth history when we have a saved plant id.
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
          species: t("unknown"),
          sunlight: t("not_available_short"),
          wateringFrequency: t("not_available_short"),
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [decodedName, t]);

  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
      }
    };
  }, []);

  // Keep chart data chronological and omit empty detail rows from the info grid.
  const sortedGrowth = useMemo(
    () => [...growthData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [growthData]
  );
  const imageUri = plant?.image_path ? buildApiUrl(plant.image_path) : null;
  const detailRows = plant
    ? [
        [t("flower_profile_species"), plant.species],
        [t("flower_profile_flower_id"), plant.flowerId],
        [t("flower_profile_catalog"), plant.flowerCatalog],
        [t("location"), plant.location],
        [t("flower_profile_specific_location"), plant.specificLocation],
        [t("flower_profile_climate"), plant.climate],
        [t("sunlight"), plant.sunlight],
        [t("flower_profile_soil"), plant.soilType],
        [t("flower_profile_watering"), plant.wateringFrequency],
        [t("flower_profile_fertilizer"), plant.fertilizerSchedule],
        [t("flower_profile_last_watered"), plant.lastWatered],
        [t("flower_profile_initial_size"), plant.initialSize],
      ].filter(([, value]) => Boolean(value && String(value).trim()))
    : [];

  // Validate and save a new growth record, then reload the latest history from the backend.
  const handleAddGrowth = async () => {
    const heightValue = Number(newHeight);

    if (!plant?._id) {
      Alert.alert(t("flower_profile_unavailable_title"), t("flower_profile_unavailable_body"));
      return;
    }

    if (!Number.isFinite(heightValue) || heightValue <= 0) {
      Alert.alert(t("flower_profile_invalid_height_title"), t("flower_profile_invalid_height_body"));
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
      Alert.alert(t("flower_profile_saved_title"), t("flower_profile_saved_body"));
    } catch (error) {
      Alert.alert(t("flower_profile_save_failed_title"), error instanceof Error ? error.message : t("flower_profile_save_failed_body"));
    } finally {
      setSavingGrowth(false);
    }
  };

  // Render the mobile Flower Profile screen and its main interactive sections.
  return (
    <Screen>
      <TopBar title={decodedName || t("plant_label")} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {loading ? <Text style={styles.loading}>{t("loading")}...</Text> : null}

      {plant ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {statusMessage ? (
            <View style={styles.statusBanner}>
              <MaterialIcons name="check-circle" size={18} color={colors.success} />
              <Text style={styles.statusBannerText}>{statusMessage}</Text>
            </View>
          ) : null}

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
              <Text style={styles.heroBody}>{plant.species || t("flower_profile_fallback_body")}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroChip}>
                  <MaterialIcons name="spa" size={14} color={colors.white} />
                  <Text style={styles.heroChipText}>{plant.tracking === false ? t("flower_profile_not_tracked") : t("flower_profile_tracking")}</Text>
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
            <Text style={styles.sectionTitle}>{t("flower_profile_details")}</Text>
            {detailRows.length === 0 ? <Text style={styles.muted}>{t("flower_profile_no_details")}</Text> : null}
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
            <Text style={styles.sectionTitle}>{t("flower_profile_growth_tracker")}</Text>
            <GrowthChart data={sortedGrowth} />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>{t("flower_profile_growth_history")}</Text>
            {sortedGrowth.length === 0 ? <Text style={styles.muted}>{t("flower_profile_no_records")}</Text> : null}
            <FlatList
              data={sortedGrowth}
              keyExtractor={(item, index) => `${item.date}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <Text style={styles.row}>{t("flower_profile_date", { value: new Date(item.date).toLocaleDateString() })}</Text>
                  <Text style={styles.row}>{t("flower_profile_height", { value: item.height })}</Text>
                  <Text style={[styles.row, { color: getHealthColor(item.health) }]}>{t("flower_profile_health", { value: item.health })}</Text>
                  {item.notes ? <Text style={styles.row}>{t("flower_profile_notes", { value: item.notes })}</Text> : null}
                </View>
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.historyList}
            />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>{t("flower_profile_add_record")}</Text>
            <TextInput placeholder={t("flower_profile_height_placeholder")} placeholderTextColor={colors.textMuted} style={styles.input} value={newHeight} onChangeText={setNewHeight} keyboardType="decimal-pad" />
            <TextInput placeholder={t("flower_profile_health_placeholder")} placeholderTextColor={colors.textMuted} style={styles.input} value={newHealth} onChangeText={setNewHealth} />
            <TextInput placeholder={t("flower_profile_notes_placeholder")} placeholderTextColor={colors.textMuted} style={[styles.input, styles.notesInput]} value={newNotes} onChangeText={setNewNotes} multiline />
            <PrimaryButton label={savingGrowth ? t("flower_profile_saving_button") : t("flower_profile_add_button")} onPress={() => void handleAddGrowth()} disabled={!plant?._id || savingGrowth} />
          </View>
        </ScrollView>
      ) : null}

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Loading state and overall scroll spacing.
  loading: {
    color: colors.textMuted,
    fontSize: 14,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  statusBanner: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.soft,
  },
  statusBannerText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  // Hero media, overlay, and metadata chips.
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

  // Shared content cards, section headings, and detail rows.
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

  // Detail and history lists.
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

  // Growth entry form fields.
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
