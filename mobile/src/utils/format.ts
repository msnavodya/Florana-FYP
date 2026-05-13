// Provide mobile utility helpers for Format logic.
// Map loose health labels to a small set of UI colors for status badges and summaries.
export const getHealthColor = (health?: string | null) => {
  if (!health) return "#777";
  const value = health.toLowerCase();
  if (value.includes("good")) return "#2F7A4A";
  if (value.includes("bad")) return "#A53A3A";
  return "#B57B18";
};
