import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { colors, radii, spacing } from "../theme/tokens";

export function FeedbackScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { t } = useLanguage();
  const { addFeedback, refreshFeedbacks } = useSettings();

  useEffect(() => {
    void refreshFeedbacks();
  }, [refreshFeedbacks]);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      return;
    }

    await addFeedback({ rating, message: feedback.trim() });
    Alert.alert(t("feedback_saved_title"), t("feedback_saved_message"));
    setFeedback("");
    setRating(0);
  };

  return (
    <Screen>
      <TopBar title={t("feedback_title")} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("contact_support")}</Text>
        <Text style={styles.supportItem}>{t("email_support")}</Text>
        <Text style={styles.supportItem}>{t("faq_center")}</Text>
        <Text style={styles.supportItem}>{t("call_us")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("share_your_thoughts")}</Text>
        <Text style={styles.helper}>{t("rate_app")}</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)}>
              <Text style={[styles.star, star <= rating ? styles.starFilled : null]}>*</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton label={t("leave_app_store_review")} onPress={() => Alert.alert(t("review_title"), t("review_message"))} variant="secondary" />

        <TextInput
          multiline
          placeholder={t("feedback_placeholder")}
          placeholderTextColor={colors.textMuted}
          style={styles.feedbackInput}
          value={feedback}
          onChangeText={setFeedback}
        />

        <PrimaryButton label={t("submit_feedback")} onPress={() => void handleSubmit()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 5,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  supportItem: {
    color: colors.text,
    fontSize: 15,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 14,
  },
  starRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  star: {
    color: colors.border,
    fontSize: 34,
    fontWeight: "800",
  },
  starFilled: {
    color: colors.accent,
  },
  feedbackInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.text,
    minHeight: 140,
    padding: spacing.md,
    textAlignVertical: "top",
  },
});
