import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../src/components/PrimaryButton";
import { Screen } from "../src/components/Screen";
import { colors, radii, spacing } from "../src/theme/tokens";

export default function NotFoundScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Screen not found</Text>
        <Text style={styles.body}>
          The page you tried to open does not exist in this mobile build.
        </Text>
        <PrimaryButton label="Go Home" onPress={() => router.replace("/home")} />
        <PrimaryButton label="Back to Welcome" onPress={() => router.replace("/")} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  code: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
