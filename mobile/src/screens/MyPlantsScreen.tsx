// Render the mobile My Plants screen.
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { LanguageSelector } from "../components/LanguageSelector";
import { Screen } from "../components/Screen";
import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api/config";
import { deletePlant, getPlants } from "../lib/api/plants";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { Plant } from "../types/plants";

export function MyPlantsScreen() {
  const { height, width } = useWindowDimensions();
  // Switch to a slightly tighter layout on smaller devices.
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  // Keep a single dismiss timer alive so repeated messages replace each other cleanly.
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show temporary success or error feedback without leaving old timers running.
  const showStatus = (message: string) => {
    setStatus(message);
    if (statusTimer.current) {
      clearTimeout(statusTimer.current);
    }
    statusTimer.current = setTimeout(() => setStatus(""), 2600);
  };

  const loadPlants = async () => {
    try {
      const response = await getPlants();
      // Hide incomplete or intentionally untracked records from the My Plants list.
      const validPlants = (response || []).filter((plant) => plant && plant.tracking !== false && plant.name?.trim());
      setPlants(validPlants);
    } catch {
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlants();
    // Poll in the background so reminder/warning changes show up without a full app restart.
    const interval = setInterval(() => void loadPlants(), 30000);
    return () => {
      clearInterval(interval);
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh every time the screen regains focus after navigating back from details or registration.
      void loadPlants();
    }, [])
  );

  // Remove the plant, update the local list immediately, and then sync from the backend.
  const handleDelete = async (plant: Plant) => {
    const plantId = plant.id || plant._id;
    if (!plantId || deletingId) {
      return;
    }

    setDeletingId(plantId);
    try {
      await deletePlant(plantId);
      setPlants((previous) => previous.filter((entry) => (entry.id || entry._id) !== plantId));
      showStatus(t("plant_deleted", { name: plant.name }));
      await loadPlants();
    } catch (error) {
      showStatus(error instanceof Error ? error.message : t("backend_try_again"));
    } finally {
      setDeletingId(null);
    }
  };

  const attentionCount = useMemo(() => plants.filter((plant) => plant.warning).length, [plants]);

  // Render the mobile My Plants screen and its main interactive sections.
  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.topBar, compact ? styles.topBarCompact : null]}>
        <Pressable accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.topActions}>
          <LanguageSelector />

          <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>{t("my_plants_loading")}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.headerCard, compact ? styles.headerCardCompact : null]}>
            <View style={styles.userIcon}>
              <MaterialIcons name="spa" size={22} color="#2C7A57" />
            </View>

            <View style={styles.headerCopy}>
              <Text style={styles.helloText}>{t("my_plants_hello")}</Text>
              <Text style={styles.heading}>{t("my_plants_title")}</Text>
              <Text style={styles.subtitle}>{t("my_plants_subtitle")}</Text>
            </View>
          </View>

          <View style={styles.overview}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, styles.summaryIconMint]}>
                <MaterialIcons name="spa" size={16} color="#2C7A57" />
              </View>
              <View>
                <Text style={styles.summaryStrong}>{plants.length}</Text>
                <Text style={styles.summaryLabel}>{t("my_plants_tracked")}</Text>
              </View>
            </View>

            <View style={[styles.summaryCard, styles.warningCard]}>
              <View style={[styles.summaryIcon, styles.summaryIconPeach]}>
                <MaterialIcons name="warning-amber" size={16} color="#C76A2C" />
              </View>
              <View>
                <Text style={styles.summaryStrong}>{attentionCount}</Text>
                <Text style={styles.summaryLabel}>{t("my_plants_attention")}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryPill}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.primaryDark} />
            <Text style={styles.summaryPillText}>{t("my_plants_habits")}</Text>
          </View>

          {status ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : null}

          <Pressable onPress={() => router.push("/plant-register")} style={styles.registerButton}>
            <MaterialIcons name="add" size={18} color={colors.white} />
            <Text style={styles.registerButtonText}>{t("register_new_plant")}</Text>
          </Pressable>

          {plants.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="spa" size={26} color="#2C7A57" />
              </View>
              <Text style={styles.emptyTitle}>{t("my_plants_empty_title")}</Text>
              <Text style={styles.emptyText}>{t("my_plants_empty_text")}</Text>
            </View>
          ) : (
            <View style={styles.plantsGrid}>
              {plants.map((plant) => {
                const id = plant.id || plant._id || plant.name;
                const imageUri = plant.image_path ? buildApiUrl(plant.image_path) : null;

                return (
                  <Pressable
                    key={id}
                    onPress={() => router.push(`/flower/${encodeURIComponent(plant.id || plant._id || plant.name)}`)}
                    style={[styles.plantCard, plant.warning ? styles.plantCardWarning : null]}
                  >
                    <Pressable
                      accessibilityLabel={t("delete_plant")}
                      disabled={deletingId === (plant.id || plant._id)}
                      onPress={(event) => {
                        // Prevent the card tap handler from opening the plant profile while deleting.
                        event.stopPropagation();
                        void handleDelete(plant);
                      }}
                      style={styles.deleteButton}
                    >
                      {deletingId === (plant.id || plant._id) ? (
                        <Text style={styles.deleteBusy}>...</Text>
                      ) : (
                        <MaterialIcons name="delete-outline" size={16} color="#B33D68" />
                      )}
                    </Pressable>

                    {imageUri ? (
                      <Image resizeMode="cover" source={{ uri: imageUri }} style={styles.plantImage} />
                    ) : (
                      <View style={styles.plantImageFallback}>
                        <MaterialIcons name="local-florist" size={30} color={colors.textMuted} />
                      </View>
                    )}

                    <View style={styles.plantInfo}>
                      <View style={styles.plantTitleRow}>
                        <Text style={styles.plantName}>{plant.name}</Text>
                        <View style={[styles.statusChip, plant.warning ? styles.statusChipWarning : styles.statusChipGood]}>
                          <Text style={[styles.statusChipText, plant.warning ? styles.statusChipTextWarning : styles.statusChipTextGood]}>
                            {plant.warning ? t("my_plants_needs_care") : t("my_plants_stable")}
                          </Text>
                        </View>
                      </View>

                      {plant.info ? (
                        <Text style={[styles.plantInfoText, plant.warning ? styles.plantInfoTextDanger : null]}>{plant.info}</Text>
                      ) : null}
                      <Text style={styles.plantMetaText}>
                        {[plant.species, plant.location, plant.wateringFrequency].filter(Boolean).join(" - ") || t("open_profile_care_details")}
                      </Text>

                      {plant.badges?.length ? (
                        <View style={styles.badgeRow}>
                          {plant.badges.map((badge, index) => (
                            <View key={`${id}-${index}`} style={[styles.badge, plant.warning ? styles.badgeRed : styles.badgeGreen]}>
                              <Text style={[styles.badgeText, plant.warning ? styles.badgeTextRed : styles.badgeTextGreen]}>{badge}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.arrowWrap}>
                      <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Top navigation and loading state.
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
  loadingCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    ...shadows.soft,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },

  // Intro header and summary cards.
  headerCard: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 28,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  headerCardCompact: {
    borderRadius: 22,
    padding: spacing.md,
  },
  userIcon: {
    alignItems: "center",
    backgroundColor: "#E8F7EF",
    borderRadius: 22,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  headerCopy: {
    flex: 1,
  },
  helloText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heading: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  overview: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  warningCard: {
    backgroundColor: "#FFF7F1",
    borderRadius: 24,
  },
  summaryIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  summaryIconMint: {
    backgroundColor: "#E8F7EF",
  },
  summaryIconPeach: {
    backgroundColor: "#FFE9DB",
  },
  summaryStrong: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryPill: {
    alignItems: "center",
    backgroundColor: "#F5F0FA",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryPillText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },

  // Status banner and primary register action.
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: "#24513B",
    fontSize: 13,
    fontWeight: "800",
  },
  registerButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    marginBottom: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },

  // Empty state and plant cards.
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: spacing.xl,
    ...shadows.soft,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#E8F7EF",
    borderRadius: 24,
    height: 52,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 52,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  plantsGrid: {
    gap: spacing.md,
  },
  plantCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: colors.border,
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing.md,
    position: "relative",
    ...shadows.soft,
  },
  plantCardWarning: {
    borderColor: "#F2C3A5",
    backgroundColor: "#FFF9F5",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,245,248,0.96)",
    borderColor: "rgba(179,61,104,0.18)",
    borderRadius: 16,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 34,
    zIndex: 2,
  },
  deleteBusy: {
    color: "#B33D68",
    fontSize: 13,
    fontWeight: "800",
  },
  plantImage: {
    borderRadius: 20,
    height: 220,
    marginBottom: spacing.md,
    width: "100%",
  },
  plantImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    height: 220,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: "100%",
  },
  plantInfo: {
    gap: spacing.sm,
  },
  plantTitleRow: {
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  plantName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    paddingRight: 54,
  },
  statusChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusChipGood: {
    backgroundColor: "#E8F7EF",
  },
  statusChipWarning: {
    backgroundColor: "#FFE9DB",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusChipTextGood: {
    color: "#2C7A57",
  },
  statusChipTextWarning: {
    color: "#C76A2C",
  },
  plantInfoText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  plantInfoTextDanger: {
    color: "#A84C2A",
  },
  plantMetaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  badgeGreen: {
    backgroundColor: "#EDF9F2",
  },
  badgeRed: {
    backgroundColor: "#FFF0E8",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextGreen: {
    color: "#2C7A57",
  },
  badgeTextRed: {
    color: "#C76A2C",
  },

  // Card footer arrow.
  arrowWrap: {
    alignItems: "flex-end",
    marginTop: spacing.sm,
  },
});
