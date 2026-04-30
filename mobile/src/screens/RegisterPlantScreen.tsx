import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { createPlant } from "../lib/api/plants";
import { appendImageAsset } from "../lib/api/upload";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const sunlightOptions = ["Full Sun", "Partial Sun", "Shade"] as const;
const flowerCatalogOptions = ["Spring", "Summer", "Autumn", "Winter"] as const;
const locationOptions = ["Home Garden", "Balcony", "Front Yard", "Back Yard", "Terrace", "Nursery", "Greenhouse"] as const;
const soilTypeOptions = ["Loamy", "Sandy", "Clay", "Peaty", "Chalky", "Silty", "Well-drained Potting Mix"] as const;
const environmentOptions = ["Indoor", "Outdoor", "Greenhouse"] as const;
const climateOptions = ["Tropical", "Temperate", "Arid", "Subtropical"] as const;

export function RegisterPlantScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    species: "",
    flowerId: "",
    flowerCatalog: "",
    location: "",
    specificLocation: "",
    climate: "",
    sunlight: "Partial Sun",
    soilType: "",
    wateringFrequency: "",
    fertilizerSchedule: "",
    lastWatered: "",
    initialSize: "",
    tracking: true,
    image: null as ImagePicker.ImagePickerAsset | null,
  });

  const updateField = (key: keyof typeof form, value: string | boolean | ImagePicker.ImagePickerAsset | null) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      updateField("image", result.assets[0]);
    }
  };

  const pickChoice = (title: string, field: "flowerCatalog" | "location" | "specificLocation" | "climate" | "soilType", options: readonly string[]) => {
    Alert.alert(
      title,
      "Choose an option",
      [
        ...options.map((option) => ({
          text: option,
          onPress: () => updateField(field, option),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert("Plant Name Required", "Please enter a Plant Name.");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("species", form.species.trim());
      formData.append("flowerId", form.flowerId || `F-${nextId}`);
      formData.append("flowerCatalog", form.flowerCatalog);
      formData.append("location", form.location);
      formData.append("specificLocation", form.specificLocation);
      formData.append("climate", form.climate);
      formData.append("sunlight", form.sunlight);
      formData.append("soilType", form.soilType);
      formData.append("wateringFrequency", form.wateringFrequency);
      formData.append("fertilizerSchedule", form.fertilizerSchedule);
      formData.append("lastWatered", form.lastWatered);
      formData.append("initialSize", form.initialSize);
      formData.append("tracking", form.tracking ? "true" : "false");

      if (form.image) {
        await appendImageAsset(formData, "image", form.image, "plant");
      }

      const response = await createPlant(formData);
      setNextId((previous) => previous + 1);
      Alert.alert("Plant Registered", `${response.name || form.name} is now in My Plants.`, [
        {
          text: "View Profile",
          onPress: () => router.replace(`/flower/${encodeURIComponent(response.name || form.name)}`),
        },
      ]);
    } catch (error) {
      Alert.alert("Register Failed", error instanceof Error ? error.message : "Failed to register plant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Register Plant" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="local-florist" size={24} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>Register a plant</Text>
          <Text style={styles.heroText}>Create a complete care profile so Florana can track health, watering, and growth history.</Text>
        </View>

        <View style={styles.formShell}>
          <View style={styles.imageRow}>
            <Pressable onPress={() => void pickImage()} style={styles.imageBox}>
              {form.image ? (
                <Image source={{ uri: form.image.uri }} style={styles.imagePreview} />
              ) : (
                <MaterialIcons name="add-a-photo" size={26} color={colors.primaryDark} />
              )}
            </Pressable>
            <View style={styles.imageCopy}>
              <Text style={styles.imageTitle}>{form.image ? "Plant image selected" : "Add a plant photo"}</Text>
              <Text style={styles.imageText}>{form.image ? form.image.fileName || "Ready to upload" : "Use a clear front-facing image for the profile."}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Basic Info</Text>
          <TextInput placeholder="Plant Name" placeholderTextColor="#999" style={styles.input} value={form.name} onChangeText={(value) => updateField("name", value)} />
          <TextInput placeholder="Plant Species" placeholderTextColor="#999" style={styles.input} value={form.species} onChangeText={(value) => updateField("species", value)} />
          <Pressable onPress={() => pickChoice("Flower Catalog", "flowerCatalog", flowerCatalogOptions)} style={styles.inputButton}>
            <Text style={[styles.inputButtonText, !form.flowerCatalog ? styles.placeholderText : null]}>
              {form.flowerCatalog || "Flower Catalog"}
            </Text>
          </Pressable>
          <TextInput placeholder={`Flower ID (Auto: F-${nextId})`} placeholderTextColor="#999" style={styles.input} value={form.flowerId} onChangeText={(value) => updateField("flowerId", value)} />

          <Text style={styles.sectionTitle}>Environment</Text>
          <Pressable onPress={() => pickChoice("Location", "location", locationOptions)} style={styles.inputButton}>
            <Text style={[styles.inputButtonText, !form.location ? styles.placeholderText : null]}>
              {form.location || "Location"}
            </Text>
          </Pressable>
          <Pressable onPress={() => pickChoice("Specific Location", "specificLocation", environmentOptions)} style={styles.inputButton}>
            <Text style={[styles.inputButtonText, !form.specificLocation ? styles.placeholderText : null]}>
              {form.specificLocation || "Specific Location"}
            </Text>
          </Pressable>
          <Pressable onPress={() => pickChoice("Climate", "climate", climateOptions)} style={styles.inputButton}>
            <Text style={[styles.inputButtonText, !form.climate ? styles.placeholderText : null]}>
              {form.climate || "Climate"}
            </Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Sunlight</Text>
          <View style={styles.optionRow}>
            {sunlightOptions.map((option) => (
              <Pressable key={option} onPress={() => updateField("sunlight", option)} style={[styles.check, form.sunlight === option ? styles.activeCheck : null]}>
                <MaterialIcons name={form.sunlight === option ? "radio-button-checked" : "radio-button-unchecked"} size={16} color={form.sunlight === option ? colors.primaryDark : colors.textMuted} />
                <Text style={[styles.checkText, form.sunlight === option ? styles.activeCheckText : null]}>{option}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Care</Text>
          <Pressable onPress={() => pickChoice("Soil Type", "soilType", soilTypeOptions)} style={styles.inputButton}>
            <Text style={[styles.inputButtonText, !form.soilType ? styles.placeholderText : null]}>
              {form.soilType || "Soil Type"}
            </Text>
          </Pressable>
          <TextInput placeholder="Watering Frequency" placeholderTextColor="#999" style={styles.input} value={form.wateringFrequency} onChangeText={(value) => updateField("wateringFrequency", value)} />
          <TextInput placeholder="Fertilizer Schedule" placeholderTextColor="#999" style={styles.input} value={form.fertilizerSchedule} onChangeText={(value) => updateField("fertilizerSchedule", value)} />
          <TextInput placeholder="Last Watered" placeholderTextColor="#999" style={styles.input} value={form.lastWatered} onChangeText={(value) => updateField("lastWatered", value)} />
          <TextInput placeholder="Initial Size" placeholderTextColor="#999" style={styles.input} value={form.initialSize} onChangeText={(value) => updateField("initialSize", value)} />

          <Text style={styles.sectionTitle}>Tracking</Text>
          <Pressable onPress={() => updateField("tracking", !form.tracking)} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{form.tracking ? "Enabled" : "Disabled"}</Text>
            <View style={[styles.switchTrack, form.tracking ? styles.switchTrackOn : null]}>
              <View style={[styles.switchThumb, form.tracking ? styles.switchThumbOn : null]} />
            </View>
          </Pressable>

          <PrimaryButton label={saving ? "Saving Plant..." : "Register Plant"} onPress={() => void handleSubmit()} disabled={saving} />
        </View>
      </ScrollView>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.lg,
  },
  formShell: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 26,
    padding: 18,
    ...shadows.card,
  },
  heroPanel: {
    backgroundColor: colors.backgroundDeep,
    borderRadius: 26,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  heroText: {
    color: "#E6D7FF",
    fontSize: 14,
    lineHeight: 21,
  },
  imageRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  imageBox: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 2,
    height: 76,
    justifyContent: "center",
    overflow: "hidden",
    width: 96,
  },
  imagePreview: {
    borderRadius: 14,
    height: "100%",
    width: "100%",
  },
  imageCopy: {
    flex: 1,
    gap: 4,
  },
  imageTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  imageText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: "#222222",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 18,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputButton: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  placeholderText: {
    color: "#999999",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  check: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeCheck: {
    backgroundColor: "#E8E3FF",
  },
  checkText: {
    color: colors.text,
    fontSize: 14,
  },
  activeCheckText: {
    color: "#6A5CFF",
    fontWeight: "600",
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  switchTrack: {
    backgroundColor: "#CCCCCC",
    borderRadius: 20,
    height: 22,
    paddingHorizontal: 2,
    width: 42,
  },
  switchTrackOn: {
    backgroundColor: "#6A5CFF",
  },
  switchThumb: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    height: 18,
    marginTop: 2,
    width: 18,
  },
  switchThumbOn: {
    marginLeft: 20,
  },
});
