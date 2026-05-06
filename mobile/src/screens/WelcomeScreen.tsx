import { router } from "expo-router";
import { Image, ImageBackground, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useLanguage } from "../context/LanguageContext";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

export function WelcomeScreen() {
  const { height, width } = useWindowDimensions();
  const { t } = useLanguage();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;

  return (
    <Screen contentStyle={[styles.content, compact ? styles.contentCompact : null]}>
      <Image resizeMode="contain" source={brandAssets.logo} style={[styles.logo, compact ? styles.logoCompact : null]} />
      <ImageBackground imageStyle={styles.heroImage} resizeMode="cover" source={brandAssets.welcome} style={[styles.heroCard, compact ? styles.heroCardCompact : null]} />

      <Text style={[styles.title, compact ? styles.titleCompact : null]}>{t("welcome_headline")}</Text>

      <View style={styles.actions}>
        <PrimaryButton label={t("get_started")} onPress={() => router.push("/login")} />
        <PrimaryButton label={t("create_new_account")} onPress={() => router.push("/register")} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "space-between",
    paddingVertical: spacing.xl,
  },
  contentCompact: {
    paddingVertical: spacing.lg,
  },
  logo: {
    alignSelf: "center",
    borderRadius: 18,
    height: 120,
    marginBottom: spacing.md,
    width: 120,
  },
  logoCompact: {
    height: 88,
    width: 88,
  },
  heroCard: {
    borderRadius: radii.lg,
    minHeight: 300,
    overflow: "hidden",
    ...shadows.card,
  },
  heroCardCompact: {
    minHeight: 300,
  },
  heroImage: {
    height: "100%",
    width: "100%",
    borderRadius: radii.lg,
  },
  heroOverlay: {
    backgroundColor: "rgba(36, 24, 61, 0.34)",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  heroOverlayCompact: {
    padding: spacing.md,
  },
  heroEyebrow: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroEyebrowCompact: {
    fontSize: 11,
  },
  heroHeadline: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
    maxWidth: 260,
  },
  heroHeadlineCompact: {
    fontSize: 20,
    lineHeight: 26,
    maxWidth: 220,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  titleCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureItem: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  featureItemCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
