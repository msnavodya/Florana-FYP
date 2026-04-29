import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { predictImage } from "../lib/api/predict";
import { getProducts } from "../lib/api/shop";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import { formatPredictionConfidence } from "../utils/predict";

const insightCards = [
  { key: "diagnose", tone: "yellow", route: null },
  { key: "feedback", tone: "purple", route: "/feedback" },
  { key: "care", tone: "green", route: "/care" },
  { key: "quicktip", tone: "blue", route: "/quicktip" },
] as const;

export function HomeScreen() {
  const { ready, user } = useAuth();
  const { totalItems } = useCart();
  const { feedbacks } = useSettings();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [productCount, setProductCount] = useState<number | null>(null);
  const [backendMessage, setBackendMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [feedbackIndex, setFeedbackIndex] = useState(0);

  useEffect(() => {
    getProducts()
      .then((products) => {
        setProductCount(products.length);
        setBackendMessage("Connected to the live Florana backend.");
      })
      .catch(() => {
        setProductCount(null);
        setBackendMessage("Authentication is available, but shop data could not be loaded right now.");
      });
  }, []);

  useEffect(() => {
    if (feedbacks.length === 0) {
      setFeedbackIndex(0);
      return;
    }

    if (feedbackIndex >= feedbacks.length) {
      setFeedbackIndex(feedbacks.length - 1);
    }
  }, [feedbackIndex, feedbacks]);

  const activeFeedback = feedbacks[feedbackIndex];
  const greeting = user?.full_name ? t("hello_user", { name: user.full_name }) : ready ? "Hello, grower" : "Loading...";
  const statusSummary = useMemo(
    () => `${productCount ?? "--"} plants live | ${feedbacks.length} reviews | ${totalItems} cart items`,
    [feedbacks.length, productCount, totalItems]
  );
  const wellnessMessage = diagnosis
    ? diagnosis
    : loading
      ? "Analyzing your latest leaf scan..."
      : "Scan a leaf to get a live health prediction from the Florana model.";

  const handleScan = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.fileName || "scan.jpg",
      type: file.mimeType || "image/jpeg",
    } as unknown as Blob);

    setLoading(true);
    try {
      const response = await predictImage(formData);
      const percent = formatPredictionConfidence(response.confidence);
      const isHealthy = response.prediction === "Healthy Plant";
      const status = isHealthy ? "Healthy Plant" : "Unhealthy Plant - Disease Detected";
      setDiagnosis(`${status} (${response.prediction}) - Confidence: ${percent}%`);
    } catch (error) {
      setDiagnosis(error instanceof Error ? `Error: ${error.message}` : "Error: Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  const goToFeedback = (direction: "next" | "prev") => {
    if (feedbacks.length <= 1) {
      return;
    }

    setFeedbackIndex((current) => {
      if (direction === "next") {
        return current < feedbacks.length - 1 ? current + 1 : 0;
      }

      return current > 0 ? current - 1 : feedbacks.length - 1;
    });
  };

  return (
    <Screen>
      <TopBar title={greeting} subtitle="Florana Mobile" onMenuPress={() => setMenuOpen(true)} stackBrand />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.headerActions}>
        <View style={styles.statPill}>
          <Text style={styles.statPillText}>{statusSummary}</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>REAL-TIME PLANT CARE</Text>
        </View>
        <Text style={styles.heroTitle}>A cleaner mobile workspace for diagnosis, care, and shopping.</Text>
        <Text style={styles.heroBody}>
          Florana brings the model, reminders, catalog, and community feedback into one focused dashboard.
        </Text>
        <View style={styles.heroActionRow}>
          <Pressable onPress={() => void handleScan()} style={styles.heroPrimaryAction}>
            <Text style={styles.heroPrimaryActionText}>{loading ? "Scanning..." : "Scan a leaf"}</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/myplants")} style={styles.heroSecondaryAction}>
            <Text style={styles.heroSecondaryActionText}>My plants</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          onChangeText={setSearch}
          placeholder={t("search_placeholder")}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={search}
        />
        <Pressable onPress={() => router.push("/catalog")} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.wellnessPanel}>
        <View style={styles.wellnessHeader}>
          <Text style={styles.wellnessTitle}>Plant wellness</Text>
          {diagnosis ? (
            <Pressable onPress={() => setDiagnosis(null)} style={styles.dismissButton}>
              <Text style={styles.dismissButtonText}>x</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.wellnessText}>{wellnessMessage}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t("todays_insights")}</Text>

      <View style={styles.cardGrid}>
        {insightCards.map((card) => {
          const onPress =
            card.key === "diagnose"
              ? () => void handleScan()
              : () => router.push(card.route as "/feedback" | "/care" | "/quicktip");

          const title =
            card.key === "diagnose"
              ? t("diagnose")
              : card.key === "feedback"
                ? t("feedback_card")
                : card.key === "care"
                  ? t("care_reminder_card")
                  : t("quick_tip_card");

          const body =
            card.key === "diagnose"
              ? loading
                ? t("analyzing")
                : t("tap_to_scan_leaf")
              : card.key === "feedback"
                ? t("reviews", { count: feedbacks.length })
                : card.key === "care"
                  ? "Water Monstera."
                  : "Use well-draining soil.";

          return (
            <Pressable
              key={card.key}
              onPress={onPress}
              style={[
                styles.insightCard,
                card.tone === "yellow"
                  ? styles.yellowCard
                  : card.tone === "purple"
                    ? styles.purpleCard
                    : card.tone === "green"
                      ? styles.greenCard
                      : styles.blueCard,
              ]}
            >
              <Text style={styles.insightTitle}>{title}</Text>
              <Text style={styles.insightBody}>{body}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.feedbackBox}>
        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackHeading}>User Feedback</Text>
          {feedbacks.length > 0 ? (
            <Text style={styles.feedbackCount}>
              {feedbackIndex + 1}/{feedbacks.length}
            </Text>
          ) : null}
        </View>

        {activeFeedback ? (
          <>
            <View style={styles.feedbackSlideRow}>
              <Pressable onPress={() => goToFeedback("prev")} style={styles.slideButton}>
                <Text style={styles.slideButtonText}>{"<"}</Text>
              </Pressable>

              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackMessage}>{activeFeedback.message}</Text>
                <Text style={styles.feedbackStars}>{"*".repeat(activeFeedback.rating || 0)}</Text>
                <Text style={styles.feedbackDate}>{activeFeedback.createdAt || "Just now"}</Text>
              </View>

              <Pressable onPress={() => goToFeedback("next")} style={styles.slideButton}>
                <Text style={styles.slideButtonText}>{">"}</Text>
              </Pressable>
            </View>

            {feedbacks.length > 1 ? (
              <View style={styles.dotRow}>
                {feedbacks.map((entry, index) => (
                  <Pressable
                    key={`${entry.id}-${index}`}
                    onPress={() => setFeedbackIndex(index)}
                    style={[styles.dot, index === feedbackIndex ? styles.activeDot : null]}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyFeedbackBox}>
            <Text style={styles.emptyFeedbackText}>No feedback yet</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Backend status</Text>
        <Text style={styles.infoText}>{backendMessage || "Checking Florana services..."}</Text>
      </View>

      {search.trim() ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Quick search</Text>
          <Text style={styles.infoText}>Search for "{search}" in the catalog to browse matching plants.</Text>
        </View>
      ) : null}

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statPill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.26)",
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  statPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: colors.backgroundDeep,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    overflow: "hidden",
    padding: spacing.lg,
    ...shadows.card,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.pill,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: "#E9DDFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 31,
  },
  heroBody: {
    color: "#D8CAEF",
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  heroActionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroPrimaryAction: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  heroPrimaryActionText: {
    color: colors.backgroundDeep,
    fontSize: 14,
    fontWeight: "800",
  },
  heroSecondaryAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  heroSecondaryActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    flexDirection: "row",
    marginBottom: spacing.md,
    padding: 6,
    ...shadows.soft,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 84,
    paddingHorizontal: spacing.md,
  },
  searchButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  wellnessPanel: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  wellnessHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  wellnessTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  wellnessText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  dismissButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  dismissButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightCard: {
    borderRadius: 18,
    minHeight: 118,
    padding: spacing.md,
    width: "48%",
  },
  yellowCard: {
    backgroundColor: "#FFEAB6",
  },
  purpleCard: {
    backgroundColor: "#E6D7FF",
  },
  greenCard: {
    backgroundColor: "#D8F9D2",
  },
  blueCard: {
    backgroundColor: "#D9F1FF",
  },
  insightTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  insightBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  feedbackBox: {
    backgroundColor: "#E0CBE5",
    borderColor: "rgba(176,145,182,0.8)",
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  feedbackHeading: {
    color: "#2D1E53",
    fontSize: 16,
    fontWeight: "700",
  },
  feedbackCount: {
    backgroundColor: "rgba(123,91,154,0.2)",
    borderRadius: 8,
    color: "#2D1E53",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  feedbackSlideRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  slideButton: {
    alignItems: "center",
    backgroundColor: "rgba(123,91,154,0.85)",
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  slideButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  feedbackCard: {
    backgroundColor: colors.white,
    borderColor: "rgba(217,196,229,0.6)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 110,
    padding: spacing.md,
    ...shadows.soft,
  },
  feedbackMessage: {
    color: "#2D1E53",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
  },
  feedbackStars: {
    color: "#FFD700",
    fontSize: 12,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  feedbackDate: {
    color: "#8C72A6",
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: "right",
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  dot: {
    backgroundColor: "rgba(123,91,154,0.3)",
    borderColor: "rgba(123,91,154,0.5)",
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 7,
    width: 7,
  },
  activeDot: {
    backgroundColor: "#7A5B9A",
    borderColor: "#7A5B9A",
    height: 8,
    width: 8,
  },
  emptyFeedbackBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 100,
  },
  emptyFeedbackText: {
    color: "#5F4175",
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  infoText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
