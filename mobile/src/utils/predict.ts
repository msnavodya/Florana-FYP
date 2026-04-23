export const formatPredictionConfidence = (confidence: number | string) => {
  if (typeof confidence === "number") {
    return confidence > 1 ? confidence.toFixed(2) : (confidence * 100).toFixed(2);
  }

  const parsed = Number(confidence);
  if (!Number.isNaN(parsed)) {
    return parsed > 1 ? parsed.toFixed(2) : (parsed * 100).toFixed(2);
  }

  return String(confidence);
};
