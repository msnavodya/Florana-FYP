// Render the mobile Help screen.
import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useLanguage } from "../context/LanguageContext";
import { colors, radii, shadows, spacing } from "../theme/tokens";

export function HelpScreen() {
  // Keep the slide-out app menu state local to this simple static screen.
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  // Render the mobile Help screen and its main interactive sections.
  return (
    <Screen>
      <TopBar title={t("help_title")} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{t("help_hero_title")}</Text>
        <Text style={styles.heroBody}>{t("help_hero_body")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t("help_issue_title")}</Text>
        <Text style={styles.body}>{t("help_issue_body")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t("help_contact_title")}</Text>
        <Text style={styles.body}>{`${t("email")}: support@florana.com`}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t("help_faq_title")}</Text>
        <Text style={styles.body}>{t("help_faq_body")}</Text>
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Intro card at the top of the help page.
  heroCard: {
    backgroundColor: "#E7D7FF",
    borderRadius: radii.xl,
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

  // Reusable info cards for issue guidance, contact details, and FAQ copy.
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
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
