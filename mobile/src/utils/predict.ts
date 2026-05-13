// Provide mobile utility helpers for Predict logic.
export const formatPredictionConfidence = (confidence: number | string) => {
  // Clamp near-perfect values so the UI does not show awkward 99.99-style percentages.
  const formatPercent = (value: number) => {
    if (value >= 99.5) {
      return "100";
    }

    return value.toFixed(2);
  };

  if (typeof confidence === "number") {
    return confidence > 1 ? formatPercent(confidence) : formatPercent(confidence * 100);
  }

  const parsed = Number(confidence);
  if (!Number.isNaN(parsed)) {
    return parsed > 1 ? formatPercent(parsed) : formatPercent(parsed * 100);
  }

  return String(confidence);
};
