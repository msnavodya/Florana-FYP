import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { AppMenu } from "../components/AppMenu";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
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

  const openSupportEmail = async () => {
    const url = "mailto:support@florana.com?subject=Florana%20Support";
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      showStatus("Email support is unavailable on this device.");
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <Text style={styles.heroEyebrow}>{t("feedback_card")}</Text>
        <Text style={styles.heroTitle}>{t("feedback_title")}</Text>
        <Text style={styles.heroSubtitle}>Send a rating, save your notes, or jump to support.</Text>
      </View>

      <Image source={brandAssets.logo} style={styles.logo} />

      {status ? <View style={styles.statusBanner}><Text style={styles.statusText}>{status}</Text></View> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("contact_support")}</Text>

        <Pressable onPress={() => void openSupportEmail()} style={styles.supportItem}>
          <View style={styles.supportIconShell}>
            <MaterialIcons name="email" size={18} color={colors.primaryDark} />
          </View>
          <Text style={styles.supportLabel}>{t("email_support")}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/help")} style={styles.supportItem}>
          <View style={styles.supportIconShell}>
            <MaterialIcons name="help-outline" size={18} color={colors.primaryDark} />
          </View>
          <Text style={styles.supportLabel}>{t("faq_center")}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/settings")} style={styles.supportItem}>
          <View style={styles.supportIconShell}>
            <Text style={styles.supportBadge}>+</Text>
          </View>
          <Text style={styles.supportLabel}>{t("call_us")}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("share_your_thoughts")}</Text>
        <Text style={styles.helper}>{t("rate_app")}</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              accessibilityLabel={`Rate ${star} stars`}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <MaterialIcons
                name={star <= rating ? "star" : "star-border"}
                size={26}
                color={star <= rating ? "#F4B740" : "#C2B6DD"}
              />
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Open About Florana" onPress={() => router.push("/about")} variant="secondary" />

        <TextInput
          multiline
          placeholder={t("feedback_placeholder")}
          placeholderTextColor={colors.textMuted}
          style={[styles.feedbackInput, compact ? styles.feedbackInputCompact : null]}
          textAlignVertical="top"
          value={feedback}
          onChangeText={setFeedback}
        />

        <PrimaryButton label={t("submit_feedback")} onPress={() => void handleSubmit()} />
      </View>
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
  topBarSpacer: {
    height: 42,
    width: 42,
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
  heroCard: {
    backgroundColor: "#6A5AA7",
    borderRadius: radii.xl,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    padding: spacing.md,
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
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
  },
  logo: {
    alignSelf: "center",
    borderRadius: 22,
    height: 92,
    marginBottom: spacing.md,
    width: 92,
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
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  supportItem: {
    alignItems: "center",
    backgroundColor: "rgba(245,238,252,0.9)",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  supportIconShell: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  supportBadge: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 18,
  },
  supportLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  helper: {
    color: colors.textMuted,
    fontSize: 14,
  },
  starRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  starButton: {
    alignItems: "center",
    backgroundColor: "#FFF8E8",
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
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
});
