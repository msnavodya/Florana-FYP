import { Image, StyleSheet, Text, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import { useState } from "react";

export function AboutScreen() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Screen>
      <TopBar title="About Us" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Florana Story</Text>
        <Text style={styles.heroTitle}>A plant-care companion built to feel warm, simple, and helpful.</Text>
      </View>

      <View style={styles.card}>
        <Image source={brandAssets.logo} style={styles.logo} />
        <Text style={styles.title}>Florana</Text>
        <Text style={styles.description}>
          Florana is your personal digital plant companion designed to help you monitor, maintain, and grow your plants with ease.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Our Vision</Text>
        <Text style={styles.description}>
          To make plant care effortless, enjoyable, and accessible to everyone by blending smart technology with nature.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Developed By</Text>
        <Text style={styles.description}>Florana Development Team</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#E7D7FF",
    borderRadius: radii.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroEyebrow: {
    color: "#7E62B2",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
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
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  logo: {
    alignSelf: "center",
    borderRadius: 18,
    height: 110,
    width: 110,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  version: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
