import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "../context/LanguageContext";
import { brandAssets } from "../theme/brand";
import { colors, radii, spacing, viewport } from "../theme/tokens";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  backTo?: string;
  stackBrand?: boolean;
}

export function TopBar({ title, subtitle, onMenuPress, backTo, stackBrand = true }: TopBarProps) {
  const { height, width } = useWindowDimensions();
  const { t } = useLanguage();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel={t("back")}
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
        <MaterialIcons name="arrow-back" size={20} color={colors.text} />
      </Pressable>

      <View style={[styles.center, compact ? styles.centerCompact : null]}>
        <View style={[styles.brandRow, stackBrand ? styles.brandColumn : null]}>
          <Image source={brandAssets.logo} style={[styles.logo, compact ? styles.logoCompact : null]} />
          <Text style={[styles.brand, compact ? styles.brandCompact : null]}>Florana</Text>
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

      <View style={[styles.rightActions, compact ? styles.rightActionsCompact : null]}>
        <LanguageSelector />
        {onMenuPress ? (
          <Pressable
            accessibilityLabel={t("open_menu")}
            onPress={onMenuPress}
            style={({ pressed }) => [
              styles.iconButton,
              compact ? styles.iconButtonCompact : null,
              pressed ? styles.iconButtonPressed : null,
            ]}
          >
            <Text style={[styles.menuText, compact ? styles.iconTextCompact : null]}>|||</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  center: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.xl,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  centerCompact: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rightActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  rightActionsCompact: {
    gap: 6,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: 6,
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
  logoCompact: {
    height: 28,
    width: 28,
  },
  brand: {
    color: "#D6C3FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  brandCompact: {
    fontSize: 10,
    letterSpacing: 0.6,
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
    color: "#DCCEF2",
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  subtitleCompact: {
    fontSize: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 42,
    width: 42,
    shadowColor: "#1E1330",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  iconButtonCompact: {
    borderRadius: 16,
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
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  iconTextCompact: {
    fontSize: 12,
  },
});
