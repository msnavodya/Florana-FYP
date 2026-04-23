import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { predictImage } from "../lib/api/predict";
import { colors, radii, shadows, spacing } from "../theme/tokens";
import { formatPredictionConfidence } from "../utils/predict";

export function PredictScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [file, setFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setFile(result.assets[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.fileName || "predict.jpg",
      type: file.mimeType || "image/jpeg",
    } as unknown as Blob);

    try {
      const response = await predictImage(formData);
      const percent = formatPredictionConfidence(response.confidence);
      const isHealthy = response.prediction === "Healthy Plant";
      const status = isHealthy ? "Healthy Plant" : "Unhealthy Plant - Disease Detected";
      setMessage(`${status} (${response.prediction}) - Confidence: ${percent}%`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Plant Disease Prediction" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Upload a leaf photo and get a quick disease prediction.</Text>
        <Text style={styles.heroBody}>This mobile flow uses the same backend model while staying optimized for touch and camera access.</Text>
      </View>

      <View style={styles.card}>
        <PrimaryButton label={file ? "Change Image" : "Choose Image"} onPress={() => void pickImage()} variant="secondary" />
        {file ? <Image source={{ uri: file.uri }} style={styles.preview} /> : null}
        <PrimaryButton label={loading ? "Processing..." : "Predict Disease"} onPress={() => void handleUpload()} disabled={!file || loading} />
        {message ? <Text style={styles.status}>{message}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  preview: {
    borderRadius: radii.md,
    height: 240,
    width: "100%",
  },
  status: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
