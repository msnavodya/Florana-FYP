import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { getQuickTips } from "../lib/api/quicktips";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import type { QuickTipItem, QuickTipsResponse } from "../types/quicktips";

export function QuickTipScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<QuickTipsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTipId, setActiveTipId] = useState<string | null>(null);

  const loadTips = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await getQuickTips();
      setData(response);
      setActiveTipId((current) => current || response.tips[0]?.id || null);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load quick tips.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadTips();
    const interval = setInterval(() => void loadTips("refresh"), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeTip =
    data?.tips.find((item) => item.id === activeTipId) ||
    data?.tips[0] ||
    null;

  const formatUpdatedLabel = (value: string) => {
    const updated = new Date(value);
    if (Number.isNaN(updated.getTime())) {
      return "Updated just now";
    }

    return `Updated ${updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  };

  const renderTipChip = (item: QuickTipItem) => (
    <Pressable key={item.id} onPress={() => setActiveTipId(item.id)} style={[styles.chip, activeTipId === item.id ? styles.activeChip : null]}>
      <Text style={[styles.chipLabel, activeTipId === item.id ? styles.activeChipText : null]}>{item.category}</Text>
      <Text style={[styles.chipText, activeTipId === item.id ? styles.activeChipText : null]}>{item.title}</Text>
    </Pressable>
  );

  return (
    <Screen scroll={false}>
      <TopBar title="Quick Tip" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadTips("refresh")} tintColor={colors.primaryDark} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Realtime Care Feed</Text>
          <Text style={styles.heroTitle}>Live quick tips based on the time of day, season, and your tracked plants.</Text>
          <Text style={styles.heroMeta}>
            {data ? `${data.context.plant_count} plants tracked - ${data.context.season}` : "Waiting for live tips"}
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.stateText}>Loading fresh tips...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadTips()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && data ? (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Today's Context</Text>
              <Text style={styles.summaryText}>
                {data.context.warning_count > 0
                  ? `${data.context.warning_count} plants may need extra attention today.`
                  : "No urgent plant warnings found right now."}
              </Text>
              <Text style={styles.summarySubtext}>{formatUpdatedLabel(data.generated_at)}</Text>
            </View>

            <View style={styles.chipList}>{data.tips.map((item) => renderTipChip(item))}</View>

            {activeTip ? (
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>{activeTip.category}</Text>
                <Text style={styles.tipText}>{activeTip.tip}</Text>
                <Text style={styles.tipDetail}>{activeTip.detail}</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
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
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 28,
  },
  heroMeta: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "700",
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  summaryText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  summarySubtext: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  chipList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.soft,
  },
  activeChip: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
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
    padding: spacing.lg,
    ...shadows.soft,
  },
  detailLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
