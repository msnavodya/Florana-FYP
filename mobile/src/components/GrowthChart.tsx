import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

import { colors, radii, spacing } from "../theme/tokens";
import type { GrowthRecord } from "../types/plants";

interface GrowthChartProps {
  data: GrowthRecord[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!sorted.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No growth data yet</Text>
      </View>
    );
  }

  const chartWidth = Math.max(Dimensions.get("window").width - 48, 260);

  return (
    <LineChart
      data={{
        labels: sorted.map((entry) => new Date(entry.date).toLocaleDateString().slice(0, 5)),
        datasets: [{ data: sorted.map((entry) => Number(entry.height) || 0) }],
      }}
      width={chartWidth}
      height={220}
      withShadow={false}
      withInnerLines={false}
      yAxisSuffix="cm"
      chartConfig={{
        backgroundColor: colors.surface,
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 1,
        color: () => colors.primaryDark,
        labelColor: () => colors.textMuted,
        propsForDots: {
          r: "4",
          strokeWidth: "2",
          stroke: colors.accent,
        },
      }}
      bezier
      style={styles.chart}
    />
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: radii.md,
    marginLeft: -spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
