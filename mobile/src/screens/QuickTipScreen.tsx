import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { useLanguage } from "../context/LanguageContext";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

const tipOptions = [
  { key: "soil", title: "Soil Tips", tip: "Use well-draining soil.", detail: "Helps prevent root rot and keeps roots healthy." },
  { key: "sunlight", title: "Sunlight Tips", tip: "Place in indirect sunlight.", detail: "Avoid harsh noon sun for most indoor tropical plants." },
  { key: "watering", title: "Watering Tips", tip: "Water deeply once a week.", detail: "Ensure excess water drains to avoid soggy roots." },
  { key: "fertilizer", title: "Fertilizer Tips", tip: "Use organic fertilizer every 2 weeks.", detail: "Supports growth without chemical buildup." },
  { key: "pest", title: "Pest Control Tips", tip: "Check leaves for insects weekly.", detail: "Early detection prevents infestations." },
  { key: "seasonal", title: "Seasonal Care Tips", tip: "Reduce watering during winter.", detail: "Plants often go into rest mode when cooler." },
  { key: "diy", title: "DIY Hacks", tip: "Use coffee grounds for soil enrichment.", detail: "Mix into compost for extra nutrients; don't overdo it." },
  { key: "pairing", title: "Plant Pairing Tips", tip: "Group plants with similar water needs.", detail: "This avoids over and under watering issues for pairs." },
] as const;

export function QuickTipScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTipKey, setActiveTipKey] = useState<(typeof tipOptions)[number]["key"]>("soil");

  const activeTip = useMemo(
    () => tipOptions.find((item) => item.key === activeTipKey) || tipOptions[0],
    [activeTipKey]
  );

  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.topBar, compact ? styles.topBarCompact : null]}>
        <Pressable accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <Text style={styles.heroEyebrow}>{t("quick_tip_card")}</Text>
        <Text style={styles.heroTitle}>Quick Tip</Text>
        <Text style={styles.heroSubtitle}>Tap a topic to see a quick, practical care reminder.</Text>
      </View>

      <View style={styles.tipsList}>
        {tipOptions.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setActiveTipKey(option.key)}
            style={[styles.tipChip, activeTipKey === option.key ? styles.tipChipActive : null]}
          >
            <Text style={[styles.tipChipText, activeTipKey === option.key ? styles.tipChipTextActive : null]}>
              {option.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.tipDetailBox}>
        <View style={styles.tipDetailHeader}>
          <MaterialIcons name="lightbulb" size={18} color={colors.primaryDark} />
          <Text style={styles.tipDetailTitle}>{activeTip.title}</Text>
        </View>
        <Text style={styles.tipText}>{activeTip.tip}</Text>
        <Text style={styles.tipDetails}>{activeTip.detail}</Text>
      </View>

      <Pressable onPress={() => router.push("/care")} style={styles.bottomButton}>
        <Text style={styles.bottomButtonText}>{t("open_care_reminder")}</Text>
      </Pressable>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  topBarCompact: {
    alignItems: "flex-start",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  heroCard: {
    backgroundColor: "#4F5FA8",
    borderRadius: 28,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    borderRadius: 24,
    padding: spacing.md,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  tipsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipChip: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...shadows.soft,
  },
  tipChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  tipChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  tipChipTextActive: {
    color: colors.white,
  },
  tipDetailBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  tipDetailHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  tipDetailTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  tipText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  tipDetails: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  bottomButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    justifyContent: "center",
    marginBottom: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  bottomButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
