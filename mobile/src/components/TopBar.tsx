import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { CurrencySwitcher } from "./CurrencySwitcher";
import { LanguageSelector } from "./LanguageSelector";
import { brandAssets } from "../theme/brand";
import { colors, radii, spacing } from "../theme/tokens";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  backTo?: string;
  stackBrand?: boolean;
}

export function TopBar({ title, subtitle, onMenuPress, backTo, stackBrand = true }: TopBarProps) {
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="Go back"
        onPress={() => {
          if (backTo) {
            router.replace(backTo);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/home");
          }
        }}
        style={({ pressed }) => [
          styles.iconButton,
          compact ? styles.iconButtonCompact : null,
          pressed ? styles.iconButtonPressed : null,
        ]}
      >
        <Text style={[styles.iconText, compact ? styles.iconTextCompact : null]}>{"<"}</Text>
      </Pressable>

      <View style={styles.center}>
        <View style={[styles.brandRow, stackBrand ? styles.brandColumn : null]}>
          <Image source={brandAssets.logo} style={styles.logo} />
          <Text style={styles.brand}>Florana</Text>
        </View>
        <Text numberOfLines={2} style={[styles.title, compact ? styles.titleCompact : null]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={[styles.subtitle, compact ? styles.subtitleCompact : null]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightActions}>
        <LanguageSelector />
        <CurrencySwitcher />
        <Pressable
          accessibilityLabel="Open menu"
          onPress={onMenuPress}
          style={({ pressed }) => [
            styles.iconButton,
            compact ? styles.iconButtonCompact : null,
            pressed ? styles.iconButtonPressed : null,
          ]}
        >
          <Text style={[styles.menuText, compact ? styles.iconTextCompact : null]}>|||</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  center: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rightActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: 4,
  },
  brandColumn: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 4,
  },
  logo: {
    borderRadius: 8,
    height: 34,
    width: 34,
  },
  brand: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },
  titleCompact: {
    fontSize: 18,
  },
  subtitle: {
    color: "#E6D7FF",
    fontSize: 13,
    marginTop: spacing.xs,
  },
  subtitleCompact: {
    fontSize: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(120, 95, 177, 0.2)",
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    shadowColor: "rgba(22, 16, 35, 0.14)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    width: 44,
  },
  iconButtonCompact: {
    borderRadius: 12,
    height: 42,
    minHeight: 42,
    minWidth: 42,
    width: 42,
  },
  iconButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  iconText: {
    color: "#24183D",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  menuText: {
    color: "#24183D",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  iconTextCompact: {
    fontSize: 12,
  },
});
