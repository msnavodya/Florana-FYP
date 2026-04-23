import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { AppMenu } from "../components/AppMenu";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { colors, radii, shadows, spacing } from "../theme/tokens";

export function HelpScreen() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Screen>
      <TopBar title="Help & Support" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Need help with Florana?</Text>
        <Text style={styles.heroBody}>Use these quick support options before reporting a problem.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>App Not Working?</Text>
        <Text style={styles.body}>Try restarting the app or checking your internet connection.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Contact Support</Text>
        <Text style={styles.body}>Email: support@florana.com</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>FAQ Center</Text>
        <Text style={styles.body}>Share your thoughts and support requests here.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: radii.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
