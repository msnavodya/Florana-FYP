import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

export function FeedbackScreen() {
  const { width, height } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const [menuOpen, setMenuOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("");
  const { t } = useLanguage();
  const { addFeedback, refreshFeedbacks } = useSettings();
  const selectedLabel = rating > 0 ? `${rating}/5 selected` : "No rating selected";

  useEffect(() => {
    void refreshFeedbacks();
  }, [refreshFeedbacks]);

  const showStatus = (message: string) => {
    setStatus(message);
    setTimeout(() => setStatus(""), 2400);
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      showStatus("Write your feedback first.");
      return;
    }

    await addFeedback({ rating, message: feedback.trim() });
    showStatus(t("feedback_saved_message"));
    setFeedback("");
    setRating(0);
  };

  return (
    <Screen>
      <TopBar
        title={t("feedback_title")}
       onMenuPress={() => setMenuOpen(true)}
      />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroBadge}>
            <MaterialIcons name="forum" size={18} color={colors.white} />
          </View>
          <Image source={brandAssets.logo} style={styles.logo} />
        </View>
        <Text style={styles.heroEyebrow}>{t("feedback_card")}</Text>
        <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>Professional feedback hub</Text>
        <Text style={[styles.heroSubtitle, compact ? styles.heroSubtitleCompact : null]}>
          Send a rating, write a clear message, and reach support from one polished screen.
        </Text>

        <View style={[styles.metricRow, compact ? styles.metricRowCompact : null]}>
          <View style={[styles.metricCard, compact ? styles.metricCardCompact : null]}>
            <Text style={styles.metricValue}>24h</Text>
            <Text style={styles.metricLabel}>Response goal</Text>
          </View>
          <View style={[styles.metricCard, compact ? styles.metricCardCompact : null]}>
            <Text style={styles.metricValue}>3</Text>
            <Text style={styles.metricLabel}>Support paths</Text>
          </View>
        </View>
      </View>

      {status ? (
        <View style={[styles.statusBanner, compact ? styles.statusBannerCompact : null]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={[styles.card, compact ? styles.cardCompact : null]}>
        <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
          <Text style={styles.sectionTitle}>{t("share_your_thoughts")}</Text>
          <Text style={styles.sectionMeta}>{selectedLabel}</Text>
        </View>
        <Text style={styles.helper}>{t("rate_app")}</Text>

        <View style={[styles.starRow, compact ? styles.starRowCompact : null]}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              accessibilityLabel={`Rate ${star} stars`}
              onPress={() => setRating(star)}
              style={[styles.starButton, compact ? styles.starButtonCompact : null]}
            >
              <MaterialIcons
                name={star <= rating ? "star" : "star-border"}
                size={compact ? 22 : 26}
                color={star <= rating ? "#F4B740" : "#C2B6DD"}
              />
            </Pressable>
          ))}
        </View>

        <TextInput
          multiline
          placeholder={t("feedback_placeholder")}
          placeholderTextColor={colors.textMuted}
          style={[styles.feedbackInput, compact ? styles.feedbackInputCompact : null]}
          textAlignVertical="top"
          value={feedback}
          onChangeText={setFeedback}
        />

        <View style={styles.composerFooter}>
          <Text style={styles.composerHint}>Clear, short feedback helps us improve faster.</Text>
          <Text style={styles.composerCount}>{feedback.trim().length} chars</Text>
        </View>

        <PrimaryButton label={t("submit_feedback")} onPress={() => void handleSubmit()} />
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#5C4C96",
    borderRadius: radii.xl,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    padding: spacing.md,
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  heroBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },
  heroTitleCompact: {
    fontSize: 21,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
  },
  heroSubtitleCompact: {
    fontSize: 13,
    lineHeight: 20,
  },
  logo: {
    borderRadius: 18,
    height: 54,
    width: 54,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metricRowCompact: {
    gap: spacing.xs,
  },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    flex: 1,
    padding: spacing.md,
  },
  metricCardCompact: {
    padding: spacing.sm,
  },
  metricValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  metricLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  statusBanner: {
    backgroundColor: "#F7EEFF",
    borderColor: "#DABEFF",
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusBannerCompact: {
    paddingHorizontal: spacing.sm,
  },
  statusText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  cardCompact: {
    borderRadius: 22,
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionHeaderCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 4,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  helper: {
    color: colors.textMuted,
    fontSize: 14,
  },
starRow: {
  flexDirection: "row",
  alignItems: "center",
},

starRowCompact: {
  justifyContent: "space-between",
},

starButton: {
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#FFF8E8",
  borderRadius: 16,
  height: 46,
  width: 46,
},

// ✅ FIXED VERSION
starButtonCompact: {
  flex: 1,              // equal width
  marginHorizontal: 4,  // 🔥 replaces gap (more reliable in RN)
  borderRadius: 10,
  height: 42,
  alignItems: "center",
  justifyContent: "center",
},
  feedbackInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.text,
    minHeight: 150,
    padding: spacing.md,
  },
  feedbackInputCompact: {
    minHeight: 132,
  },
  composerFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  composerHint: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    paddingRight: spacing.sm,
  },
  composerCount: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
});
