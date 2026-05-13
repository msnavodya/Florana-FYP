// Render a reusable mobile UI component for Growth Chart.
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

import { colors, radii, spacing } from "../theme/tokens";
import type { GrowthRecord } from "../types/plants";

interface GrowthChartProps {
  data: GrowthRecord[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  // Sort measurements by date so the line always moves forward in time.
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!sorted.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No growth data yet</Text>
      </View>
    );
  }

  // Leave some horizontal breathing room so the chart fits cleanly inside card padding.
  const chartWidth = Dimensions.get("window").width - 80;

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: sorted.map((entry) =>
            new Date(entry.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "numeric",
            })
          ),
          datasets: [
            {
              data: sorted.map((entry) => Number(entry.height) || 0),
            },
          ],
        }}
        width={chartWidth}
        height={200}
        yAxisSuffix="cm"
        withShadow={false}
        withInnerLines={false}
        withOuterLines={false}
        bezier
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
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    // Clip chart overflow so rounded card corners stay intact.
    overflow: "hidden",
    borderRadius: radii.md,
  },
  chart: {
    borderRadius: radii.md,
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
