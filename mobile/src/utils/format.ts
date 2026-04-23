export const getHealthColor = (health?: string | null) => {
  if (!health) return "#777";
  const value = health.toLowerCase();
  if (value.includes("good")) return "#2F7A4A";
  if (value.includes("bad")) return "#A53A3A";
  return "#B57B18";
};
