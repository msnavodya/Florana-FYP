import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { colors, radii, spacing } from "../theme/tokens";

interface PlaceholderScreenProps {
  title: string;
  body: string;
}

export function PlaceholderScreen({ title, body }: PlaceholderScreenProps) {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      <PrimaryButton label="Back to Home" onPress={() => router.replace("/home")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
});
