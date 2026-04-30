import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { LanguageSelector } from "../components/LanguageSelector";
import { Screen } from "../components/Screen";
import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api/config";
import { deletePlant, getPlants } from "../lib/api/plants";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { Plant } from "../types/plants";

type LanguageCode = "en" | "si" | "ta";

const plantsCopy: Record<
  LanguageCode,
  {
    loading: string;
    hello: string;
    title: string;
    subtitle: string;
    tracked: string;
    attention: string;
    habits: string;
    emptyTitle: string;
    emptyText: string;
    needsCare: string;
    stable: string;
  }
> = {
  en: {
    loading: "Loading plants...",
    hello: "Hello Gardener!",
    title: "My Plants",
    subtitle: "Check plant health, review alerts, and jump into each flower profile in one tap.",
    tracked: "Tracked Plants",
    attention: "Need Attention",
    habits: "Healthy habits grow stronger flowers. Tap any card to open full details.",
    emptyTitle: "No plants added yet",
    emptyText: "Start tracking your flowers to build your mobile garden dashboard here.",
    needsCare: "Needs care",
    stable: "Stable",
  },
  si: {
    loading: "පැල පූරණය වෙමින්...",
    hello: "හෙලෝ වගාකරු!",
    title: "මගේ පැල",
    subtitle: "පැල සෞඛ්‍යය බලන්න, අනතුරු ඇඟවීම් සමාලෝචනය කරන්න, සහ එක් ටැප් එකකින් මල් පැතිකඩ විවෘත කරන්න.",
    tracked: "අනුගමනය කරන පැල",
    attention: "අවධානය අවශ්‍යයි",
    habits: "සෞඛ්‍ය සම්පන්න පුරුදු මල් වඩා ශක්තිමත් කරයි. සම්පූර්ණ විස්තර සඳහා ඕනෑම කාඩ්පතක් තට්ටු කරන්න.",
    emptyTitle: "තවම පැල එකතු කර නැත",
    emptyText: "මෙහි ඔබගේ ජංගම උද්‍යාන පුවරුව ගොඩනඟා ගැනීමට ඔබගේ මල් අනුගමනය කිරීම ආරම්භ කරන්න.",
    needsCare: "සැලකිල්ල අවශ්‍යයි",
    stable: "ස්ථිරයි",
  },
  ta: {
    loading: "செடிகள் ஏற்றப்படுகின்றன...",
    hello: "வணக்கம் தோட்டக்காரரே!",
    title: "என் செடிகள்",
    subtitle: "செடி ஆரோக்கியத்தை பாருங்கள், எச்சரிக்கைகளை சரிபாருங்கள், மற்றும் ஒரு தொடுதலில் ஒவ்வொரு மலர் சுயவிவரத்திற்கும் செல்லுங்கள்.",
    tracked: "கண்காணிக்கும் செடிகள்",
    attention: "கவனம் தேவை",
    habits: "ஆரோக்கியமான பழக்கங்கள் மலர்களை வலுப்படுத்தும். முழு விவரங்களைத் திறக்க எந்த அட்டையையும் தொட்டு பார்க்கவும்.",
    emptyTitle: "இதுவரை செடிகள் சேர்க்கப்படவில்லை",
    emptyText: "இங்கே உங்கள் மொபைல் தோட்ட டாஷ்போர்டை உருவாக்க உங்கள் மலர்களை கண்காணிக்கத் தொடங்குங்கள்.",
    needsCare: "பராமரிப்பு தேவை",
    stable: "நிலையாக உள்ளது",
  },
};

export function MyPlantsScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { languageCode, t } = useLanguage();
  const copy = plantsCopy[languageCode] || plantsCopy.en;
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
      setPlants([]);
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

  const attentionCount = useMemo(() => plants.filter((plant) => plant.warning).length, [plants]);

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
          <Text style={styles.loadingText}>{copy.loading}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.headerCard, compact ? styles.headerCardCompact : null]}>
            <View style={styles.userIcon}>
              <MaterialIcons name="spa" size={22} color="#2C7A57" />
            </View>

            <View style={styles.headerCopy}>
              <Text style={styles.helloText}>{copy.hello}</Text>
              <Text style={styles.heading}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
            </View>
          </View>

          <View style={styles.overview}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, styles.summaryIconMint]}>
                <MaterialIcons name="spa" size={16} color="#2C7A57" />
              </View>
              <View>
                <Text style={styles.summaryStrong}>{plants.length}</Text>
                <Text style={styles.summaryLabel}>{copy.tracked}</Text>
              </View>
            </View>

            <View style={[styles.summaryCard, styles.warningCard]}>
              <View style={[styles.summaryIcon, styles.summaryIconPeach]}>
                <MaterialIcons name="warning-amber" size={16} color="#C76A2C" />
              </View>
              <View>
                <Text style={styles.summaryStrong}>{attentionCount}</Text>
                <Text style={styles.summaryLabel}>{copy.attention}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryPill}>
            <MaterialIcons name="auto-awesome" size={14} color={colors.primaryDark} />
            <Text style={styles.summaryPillText}>{copy.habits}</Text>
          </View>

          <Pressable onPress={() => router.push("/plant-register")} style={styles.registerButton}>
            <MaterialIcons name="add" size={18} color={colors.white} />
            <Text style={styles.registerButtonText}>Register New Plant</Text>
          </Pressable>

          {plants.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="spa" size={26} color="#2C7A57" />
              </View>
              <Text style={styles.emptyTitle}>{copy.emptyTitle}</Text>
              <Text style={styles.emptyText}>{copy.emptyText}</Text>
            </View>
          ) : (
            <View style={styles.plantsGrid}>
              {plants.map((plant) => {
                const id = plant.id || plant._id || plant.name;
                const imageUri = plant.image_path ? buildApiUrl(plant.image_path) : null;

                return (
                  <Pressable
                    key={id}
                    onPress={() => router.push(`/flower/${encodeURIComponent(plant.name)}`)}
                    style={[styles.plantCard, plant.warning ? styles.plantCardWarning : null]}
                  >
                    <Pressable
                      accessibilityLabel="Delete plant"
                      disabled={deletingId === (plant.id || plant._id)}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleDelete(plant);
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
                      <Image source={{ uri: imageUri }} style={styles.plantImage} />
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
                            {plant.warning ? copy.needsCare : copy.stable}
                          </Text>
                        </View>
                      </View>

                      {plant.info ? (
                        <Text style={[styles.plantInfoText, plant.warning ? styles.plantInfoTextDanger : null]}>{plant.info}</Text>
                      ) : null}
                      <Text style={styles.plantMetaText}>
                        {[plant.species, plant.location, plant.wateringFrequency].filter(Boolean).join(" • ") || "Open full profile for care details"}
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
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
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
    borderRadius: 22,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  warningCard: {
    backgroundColor: "#FFF7F1",
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
    fontSize: 22,
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
    height: 180,
    marginBottom: spacing.md,
    width: "100%",
  },
  plantImageFallback: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    height: 180,
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
  arrowWrap: {
    alignItems: "flex-end",
    marginTop: spacing.sm,
  },
});
