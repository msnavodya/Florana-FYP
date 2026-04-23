import { router } from "expo-router";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { brandAssets } from "../theme/brand";
import { colors, radii, shadows, spacing } from "../theme/tokens";

export function WelcomeScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <Image source={brandAssets.logo} style={styles.logo} />
      <ImageBackground imageStyle={styles.heroImage} source={brandAssets.welcome} style={styles.heroCard}>
        <View style={styles.heroOverlay}>
          <Text style={styles.title}>Grow healthier plants with Florana.</Text>
          <Text style={styles.subtitle}>
            Sign in, shop, track plants, scan diseases, manage reminders, and stay connected to the same Florana backend from a native Expo app.
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>Smart plant diagnosis</Text>
            <Text style={styles.featureItem}>Native shopping and cart flow</Text>
            <Text style={styles.featureItem}>Care reminders and growth tracking</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.actions}>
        <PrimaryButton label="Get Started" onPress={() => router.push("/login")} />
        <PrimaryButton label="Create a new account" onPress={() => router.push("/register")} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "space-between",
    paddingVertical: spacing.xl,
  },
  logo: {
    alignSelf: "center",
    borderRadius: 18,
    height: 120,
    marginBottom: spacing.md,
    width: 120,
  },
  heroCard: {
    borderRadius: radii.lg,
    minHeight: 380,
    overflow: "hidden",
    ...shadows.card,
  },
  heroImage: {
    borderRadius: radii.lg,
  },
  heroOverlay: {
    backgroundColor: "rgba(38, 26, 58, 0.58)",
    flex: 1,
    gap: spacing.lg,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 44,
  },
  subtitle: {
    color: "#EADDFC",
    fontSize: 16,
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
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
