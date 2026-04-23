import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const tipOptions = [
  { key: "soil", title: "Soil Tips", tip: "Use well-draining soil.", detail: "Helps prevent root rot and keeps roots healthy." },
  { key: "sunlight", title: "Sunlight Tips", tip: "Place in indirect sunlight.", detail: "Avoid harsh noon sun for most indoor tropical plants." },
  { key: "watering", title: "Watering Tips", tip: "Water deeply once a week.", detail: "Ensure excess water drains to avoid soggy roots." },
  { key: "fertilizer", title: "Fertilizer Tips", tip: "Use organic fertilizer every 2 weeks.", detail: "Supports growth without chemical buildup." },
  { key: "pest", title: "Pest Control Tips", tip: "Check leaves for insects weekly.", detail: "Early detection prevents infestations." },
  { key: "seasonal", title: "Seasonal Care Tips", tip: "Reduce watering during winter.", detail: "Plants often go into rest mode when cooler." },
  { key: "diy", title: "DIY Hacks", tip: "Use coffee grounds for soil enrichment.", detail: "Mix into compost for extra nutrients; don't overdo it." },
  { key: "pairing", title: "Plant Pairing Tips", tip: "Group plants with similar water needs.", detail: "This avoids over and under watering issues for pairs." },
];

export function QuickTipScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTipKey, setActiveTipKey] = useState("soil");
  const activeTip = tipOptions.find((item) => item.key === activeTipKey) || tipOptions[0];

  return (
    <Screen>
      <TopBar title="Quick Tip" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Quick care tips inspired by the web app’s learning flow.</Text>
      </View>

      <FlatList
        data={tipOptions}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <Pressable onPress={() => setActiveTipKey(item.key)} style={[styles.chip, activeTipKey === item.key ? styles.activeChip : null]}>
            <Text style={[styles.chipText, activeTipKey === item.key ? styles.activeChipText : null]}>{item.title}</Text>
          </Pressable>
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.chipList}
      />

      <View style={styles.detailBox}>
        <Text style={styles.tipText}>{activeTip.tip}</Text>
        <Text style={styles.tipDetail}>{activeTip.detail}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 28,
  },
  chipList: {
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  activeChip: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  activeChipText: {
    color: colors.white,
  },
  detailBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
  tipText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  tipDetail: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
