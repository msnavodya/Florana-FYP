import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { LanguageSelector } from "../components/LanguageSelector";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { getBackendHealth } from "../lib/api/health";
import { predictImage } from "../lib/api/predict";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import type { FeedbackEntry } from "../types/app";
import { formatPredictionConfidence } from "../utils/predict";

type ModelState = {
  loaded: boolean;
  status: "checking" | "ready" | "offline";
};

type DiagnosisState = {
  title: string;
  message: string;
  tone: "healthy" | "warning" | "error";
};

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) {
    return "Just now";
  }

  const created = new Date(dateString).getTime();
  if (Number.isNaN(created)) {
    return "Just now";
  }

  const diffMs = Date.now() - created;
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) {
    return "Just now";
  }

  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function isHealthyPrediction(prediction: string) {
  const normalized = prediction.trim().toLowerCase();
  return normalized.includes("healthy") || normalized.includes("fresh leaf");
}

function getDiagnosisToneColors(tone: DiagnosisState["tone"]) {
  if (tone === "healthy") {
    return {
      bg: "#E0F5E9",
      iconBg: "#CBEAD8",
      iconColor: "#1C6B47",
      title: "#1F5A3F",
      body: "#2F7251",
    };
  }

  if (tone === "warning") {
    return {
      bg: "#FFF0E2",
      iconBg: "#FFE0BD",
      iconColor: "#A65A16",
      title: "#7F4410",
      body: "#95531A",
    };
  }

  return {
    bg: "#FBE5EA",
    iconBg: "#F6CED7",
    iconColor: "#8F2D56",
    title: "#742245",
    body: "#8F2D56",
  };
}

function FeedbackCard({ feedback }: { feedback: FeedbackEntry }) {
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackContent}>
        <Text style={styles.feedbackMessage}>{feedback.message}</Text>
        {feedback.rating ? (
          <View style={styles.feedbackStars}>
            <Text style={styles.feedbackStarsText}>{"*".repeat(feedback.rating)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.feedbackDate}>{formatRelativeTime(feedback.createdAt)}</Text>
    </View>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const { feedbacks, refreshFeedbacks } = useSettings();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisState | null>(null);
  const [modelState, setModelState] = useState<ModelState>({ loaded: false, status: "checking" });
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const greeting = user?.full_name ? t("hello_user", { name: user.full_name }) : t("hello_guest");

  const modelLabel = useMemo(() => {
    if (modelState.loaded) {
      return t("model_live");
    }

    return modelState.status === "checking" ? t("checking") : t("model_offline");
  }, [modelState.loaded, modelState.status, t]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    let active = true;

    const syncModelState = async () => {
      try {
        const response = await getBackendHealth();
        const aiModel = response.ai_model;

        if (!active) {
          return;
        }

        setModelState({
          loaded: Boolean(aiModel?.loaded),
          status: aiModel?.status === "ready" ? "ready" : aiModel?.status === "offline" ? "offline" : "checking",
        });
      } catch {
        if (!active) {
          return;
        }

        setModelState({ loaded: false, status: "offline" });
      }
    };

    void syncModelState();
    const intervalId = setInterval(() => {
      void syncModelState();
    }, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    void refreshFeedbacks();
    const intervalId = setInterval(() => {
      void refreshFeedbacks();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refreshFeedbacks]);

  useEffect(() => {
    if (feedbacks.length === 0) {
      setFeedbackIndex(0);
    } else if (feedbackIndex >= feedbacks.length) {
      setFeedbackIndex(feedbacks.length - 1);
    }
  }, [feedbackIndex, feedbacks]);

  const nextFeedback = () => {
    setFeedbackIndex((current) => (current < feedbacks.length - 1 ? current + 1 : 0));
  };

  const prevFeedback = () => {
    setFeedbackIndex((current) => (current > 0 ? current - 1 : feedbacks.length - 1));
  };

  const feedbackPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -50 && feedbackIndex < feedbacks.length - 1) {
            setFeedbackIndex((current) => current + 1);
            return;
          }

          if (gestureState.dx >= 50 && feedbackIndex > 0) {
            setFeedbackIndex((current) => current - 1);
          }
        },
      }),
    [feedbackIndex, feedbacks.length]
  );

  const handleSearch = () => {
    if (!search.trim()) {
      return;
    }

    Alert.alert(t("search_action"), search.trim());
  };

  const handleScan = async () => {
    const permission =
      hasMediaPermission == null
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : { granted: hasMediaPermission };

    if (hasMediaPermission == null) {
      setHasMediaPermission(permission.granted);
    }

    if (!permission.granted) {
      const message = t("media_permission_message");
      setDiagnosis({
        title: t("diagnosis_unavailable"),
        message,
        tone: "error",
      });
      Alert.alert(t("permission_required"), message);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
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
      const healthy = isHealthyPrediction(response.prediction);
      const confidence = formatPredictionConfidence(response.confidence);

      setDiagnosis({
        title: healthy ? t("healthy_plant") : t("disease_detected"),
        message: `${response.prediction} • ${confidence}% confidence`,
        tone: healthy ? "healthy" : "warning",
      });
      setModelState({ loaded: true, status: "ready" });
    } catch (error) {
      setDiagnosis({
        title: t("diagnosis_unavailable"),
        message: error instanceof Error ? error.message : t("diagnosis_failed"),
        tone: "error",
      });
      setModelState({ loaded: false, status: "offline" });
    } finally {
      setLoading(false);
    }
  };

  const diagnosisColors = diagnosis ? getDiagnosisToneColors(diagnosis.tone) : null;

  return (
    <Screen contentStyle={styles.screenContent}>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <Image source={brandAssets.logo} style={styles.logo} />
            <Text style={styles.headerTitle}>{greeting}</Text>
          </View>

          <View style={styles.headerActions}>
            <LanguageSelector />
            <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
              <MaterialIcons name="menu" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            placeholder={t("search_placeholder")}
            placeholderTextColor="#907FAD"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          <Pressable onPress={handleSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>{t("search_action")}</Text>
          </Pressable>
        </View>

        {diagnosis && diagnosisColors ? (
          <View style={[styles.diagnosisAlert, { backgroundColor: diagnosisColors.bg }]}>
            <View style={styles.diagnosisCopyRow}>
              <MaterialIcons
                name={diagnosis.tone === "healthy" ? "verified" : "warning-amber"}
                size={18}
                color={diagnosisColors.iconColor}
              />
              <View style={styles.diagnosisCopy}>
                <Text style={[styles.diagnosisTitle, { color: diagnosisColors.title }]}>{diagnosis.title}</Text>
                <Text style={[styles.diagnosisBody, { color: diagnosisColors.body }]}>{diagnosis.message}</Text>
              </View>
            </View>
            <Pressable onPress={() => setDiagnosis(null)} style={styles.diagnosisClose}>
              <MaterialIcons name="close" size={16} color={diagnosisColors.iconColor} />
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t("todays_insights")}</Text>

        <View style={styles.cardsGrid}>
          <Pressable onPress={() => void handleScan()} style={[styles.insightCard, styles.yellowCard]}>
            <View style={styles.cardIconRow}>
              <View style={styles.cardIcon}>
                <MaterialIcons name="eco" size={18} color={colors.text} />
              </View>
              <View style={[styles.modelPill, modelState.loaded ? styles.modelPillReady : styles.modelPillOffline]}>
                <MaterialIcons name="show-chart" size={14} color={colors.white} />
                <Text style={styles.modelPillText}>{modelLabel}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{t("diagnose")}</Text>
            <Text style={styles.cardText}>{loading ? t("analyzing_realtime") : t("tap_to_scan_leaf")}</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/feedback")} style={[styles.insightCard, styles.purpleCard]}>
            <Text style={styles.cardTitle}>{t("feedback_card")}</Text>
            <Text style={styles.cardText}>{t("reviews", { count: feedbacks.length })}</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/care")} style={[styles.insightCard, styles.greenCard]}>
            <Text style={styles.cardTitle}>{t("care_reminder_card")}</Text>
            <Text style={styles.cardText}>Water Monstera.</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/quicktip")} style={[styles.insightCard, styles.blueCard]}>
            <Text style={styles.cardTitle}>{t("quick_tip_card")}</Text>
            <Text style={styles.cardText}>Use well-draining soil.</Text>
          </Pressable>
        </View>

        <View style={styles.feedbackSection}>
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackHeading}>{t("user_feedback")}</Text>
            {feedbacks.length > 0 ? (
              <Text style={styles.feedbackCount}>
                {feedbackIndex + 1}/{feedbacks.length}
              </Text>
            ) : null}
          </View>

          {feedbacks.length === 0 ? (
            <View style={styles.emptyFeedbackBox}>
              <Text style={styles.emptyFeedbackText}>{t("no_feedback_yet")}</Text>
            </View>
          ) : (
            <View style={styles.feedbackSlideshow}>
              <Pressable onPress={prevFeedback} disabled={feedbacks.length <= 1} style={styles.slideButton}>
                <Text style={styles.slideButtonText}>{"<"}</Text>
              </Pressable>

              <View style={styles.slideshowContainer}>
                <View style={styles.feedbackTrack} {...feedbackPanResponder.panHandlers}>
                  <FeedbackCard feedback={feedbacks[feedbackIndex]} />
                </View>
              </View>

              <Pressable onPress={nextFeedback} disabled={feedbacks.length <= 1} style={styles.slideButton}>
                <Text style={styles.slideButtonText}>{">"}</Text>
              </Pressable>
            </View>
          )}

          {feedbacks.length > 1 ? (
            <View style={styles.feedbackDots}>
              {feedbacks.map((entry, index) => (
                <Pressable
                  key={`${entry.id}-${index}`}
                  onPress={() => setFeedbackIndex(index)}
                  style={[styles.dot, index === feedbackIndex ? styles.dotActive : null]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <BottomNav />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: spacing.sm,
  },
  headerCard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headerLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  logo: {
    borderRadius: 18,
    height: 52,
    width: 52,
  },
  headerTitle: {
    color: colors.white,
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...shadows.soft,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
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
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 86,
    paddingHorizontal: spacing.md,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  diagnosisAlert: {
    alignItems: "center",
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  diagnosisCopyRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  diagnosisCopy: {
    flex: 1,
  },
  diagnosisTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  diagnosisBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  diagnosisClose: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  insightCard: {
    borderRadius: 22,
    marginBottom: spacing.sm,
    minHeight: 132,
    padding: spacing.md,
    width: "48.2%",
    ...shadows.soft,
  },
  yellowCard: {
    backgroundColor: "#FFE7A7",
  },
  purpleCard: {
    backgroundColor: "#E6D7FF",
  },
  greenCard: {
    backgroundColor: "#D7F4D6",
  },
  blueCard: {
    backgroundColor: "#D9F1FF",
  },
  cardIconRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.68)",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  modelPill: {
    alignItems: "center",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  modelPillReady: {
    backgroundColor: colors.success,
  },
  modelPillOffline: {
    backgroundColor: colors.danger,
  },
  modelPillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  feedbackSection: {
    backgroundColor: "#E6D0F3",
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  feedbackHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  feedbackCount: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emptyFeedbackBox: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 110,
    padding: spacing.md,
  },
  emptyFeedbackText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  feedbackSlideshow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  slideButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  slideButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  slideshowContainer: {
    flex: 1,
  },
  feedbackTrack: {
    flex: 1,
  },
  feedbackCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    minHeight: 145,
    padding: spacing.md,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackMessage: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  feedbackStars: {
    marginTop: spacing.md,
  },
  feedbackStarsText: {
    color: "#A07C00",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  feedbackDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "right",
  },
  feedbackDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  dot: {
    backgroundColor: "rgba(124, 92, 255, 0.26)",
    borderRadius: radii.pill,
    height: 8,
    marginHorizontal: 4,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.primaryDark,
    width: 20,
  },
});
