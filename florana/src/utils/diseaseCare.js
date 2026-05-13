// Provide legacy web utility helpers for Disease Care logic.
const diseaseCareInfo = {
  appledisease: {
    protection: "Spray a copper-based fungicide early in the season and remove infected leaves.",
    workingTime: "Start immediately; check new growth over 7-14 days.",
  },
  applehealthy: {
    protection: "Maintain good airflow, proper watering, and regular nutrient balance.",
    workingTime: "Keep this routine weekly; visible health stays stable over 1-2 weeks.",
  },
  botrytis: {
    protection: "Reduce humidity and remove infected plant parts immediately.",
    workingTime: "Act the same day; improvement usually appears in 3-7 days.",
  },
  freshleaf: {
    protection: "Avoid overwatering and protect from pests with neem oil spray.",
    workingTime: "Apply care weekly; fresh leaves should remain healthy within 7 days.",
  },
  healthy: {
    protection: "Maintain good airflow, proper watering, and regular nutrient balance.",
    workingTime: "Keep this routine weekly; visible health stays stable over 1-2 weeks.",
  },
  healthyplant: {
    protection: "Maintain good airflow, proper watering, and regular nutrient balance.",
    workingTime: "Keep this routine weekly; visible health stays stable over 1-2 weeks.",
  },
  healthyleafrose: {
    protection: "Ensure full sunlight and regular pruning for airflow.",
    workingTime: "Maintain weekly; rose leaves usually stay strong through the next growth cycle.",
  },
  leafspot: {
    protection: "Avoid wetting leaves; use fungicide if it spreads.",
    workingTime: "Remove spotted leaves now; monitor for 7-10 days.",
  },
  powderymildew: {
    protection: "Spray sulfur or baking soda solution and improve air circulation.",
    workingTime: "Treat every 7 days; powdery patches should reduce in 1-2 weeks.",
  },
  rust: {
    protection: "Remove infected leaves and apply fungicide regularly.",
    workingTime: "Start today; repeat treatment weekly for 2-3 weeks.",
  },
  roserust: {
    protection: "Remove infected leaves and apply fungicide regularly.",
    workingTime: "Start today; repeat treatment weekly for 2-3 weeks.",
  },
  rosesawfly: {
    protection: "Spray insecticidal soap or neem oil on affected leaves.",
    workingTime: "Apply in the evening; check damage and larvae again in 2-4 days.",
  },
  roseslug: {
    protection: "Spray insecticidal soap or neem oil on affected leaves.",
    workingTime: "Apply in the evening; check damage and larvae again in 2-4 days.",
  },
};

export function isHealthyPrediction(prediction) {
  const normalized = String(prediction || "").trim().toLowerCase();
  return normalized.includes("healthy") || normalized.includes("fresh leaf");
}

export function getDiseaseCareInfo(prediction) {
  const key = String(prediction || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  return diseaseCareInfo[key];
}

export function buildDiagnosisResult({ prediction, confidence, topPredictions = [] }) {
  const percent = typeof confidence === "number" ? (confidence * 100).toFixed(2) : confidence;
  const alternatePrediction = topPredictions.find((item) => item.label !== prediction);
  const healthy = isHealthyPrediction(prediction);
  const status = healthy ? "Healthy Plant" : "Unhealthy Plant - Disease Detected";
  const careInfo = getDiseaseCareInfo(prediction) || getDiseaseCareInfo(alternatePrediction?.label);

  return {
    status,
    prediction,
    confidenceText:
      prediction === "Needs closer inspection" && alternatePrediction
        ? `Best guess: ${alternatePrediction.label} (${(alternatePrediction.confidence * 100).toFixed(2)}% confidence)`
        : `${percent}% confidence`,
    careInfo,
  };
}
