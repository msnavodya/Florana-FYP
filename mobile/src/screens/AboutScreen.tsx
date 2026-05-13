// Render the mobile About screen.
import { Image, StyleSheet, Text, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useLanguage } from "../context/LanguageContext";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import { useState } from "react";

export function AboutScreen() {
  // Keep the menu state local because this screen only reads static content.
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  // Render the mobile About screen and its main interactive sections.
  return (
    <Screen>
      <TopBar title={t("about_title")} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{t("about_eyebrow")}</Text>
        <Text style={styles.heroTitle}>{t("about_hero_title")}</Text>
      </View>

      <View style={styles.card}>
        <Image source={brandAssets.logo} style={styles.logo} />
        <Text style={styles.title}>Florana</Text>
        <Text style={styles.description}>{t("about_description")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("about_vision_title")}</Text>
        <Text style={styles.description}>{t("about_vision_body")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("about_developed_by")}</Text>
        <Text style={styles.description}>{t("about_team")}</Text>
        <Text style={styles.version}>{t("about_version")}</Text>
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Intro hero card.
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
  // Shared content cards.
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
