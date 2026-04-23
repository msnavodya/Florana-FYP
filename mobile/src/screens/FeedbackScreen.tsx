import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useSettings } from "../context/SettingsContext";
import { colors, radii, spacing } from "../theme/tokens";

export function FeedbackScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { addFeedback } = useSettings();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      return;
    }

    await addFeedback({ rating, message: feedback.trim() });
    Alert.alert("Feedback saved", "Thank you for sharing your thoughts.");
    setFeedback("");
    setRating(0);
  };

  return (
    <Screen>
      <TopBar title="Feedback" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <Text style={styles.supportItem}>Email Support</Text>
        <Text style={styles.supportItem}>FAQ Center</Text>
        <Text style={styles.supportItem}>Call Us</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Share Your Thoughts</Text>
        <Text style={styles.helper}>Rate App</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)}>
              <Text style={[styles.star, star <= rating ? styles.starFilled : null]}>*</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Leave an App Store Review" onPress={() => Alert.alert("Review", "Connect your store review link here.")} variant="secondary" />

        <TextInput
          multiline
          placeholder="Type your feedback here..."
          placeholderTextColor={colors.textMuted}
          style={styles.feedbackInput}
          value={feedback}
          onChangeText={setFeedback}
        />

        <PrimaryButton label="Submit Feedback" onPress={() => void handleSubmit()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
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
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 140,
    padding: spacing.md,
    textAlignVertical: "top",
  },
});
