import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useLanguage } from "../context/LanguageContext";
import { createPlant } from "../lib/api/plants";
import { appendImageAsset } from "../lib/api/upload";
import { colors, radii, shadows, spacing } from "../theme/tokens";

const sunlightOptions = ["Full Sun", "Partial Sun", "Shade"] as const;
const flowerCatalogOptions = ["Roses", "Orchids", "Sunflowers", "Lilies", "Jasmine", "Tulips", "Marigolds", "Lavender", "Hibiscus", "Daisies", "Chrysanthemums", "Bougainvillea", "Lotus", "Water Lily", "Anthurium"] as const;
const locationOptions = ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo", "Anuradhapura", "Batticaloa"] as const;
const soilTypeOptions = ["Sandy Soil", "Clay Soil", "Loamy Soil", "Silt Soil", "Peaty Soil", "Chalky Soil", "Saline Soil", "Organic Compost Soil", "Coco Peat", "Potting Mix", "Garden Soil", "Hydroponic Medium"] as const;
const environmentOptions = ["Greenhouse", "Rooftop Garden", "Indoor Plant Room", "Hydroponic Farm", "Nursery Area", "Botanical Garden", "Backyard Garden", "Balcony Garden", "Urban Farm", "Polytunnel", "Shade House", "Vertical Farming Unit", "Vegetable Plot", "Flower Garden", "Orchard Area"] as const;
const climateOptions = ["Tropical", "Subtropical", "Monsoon", "Arid", "Temperate", "Humid", "Dry Zone", "Wet Zone"] as const;

type DropdownField = "flowerCatalog" | "location" | "specificLocation" | "climate" | "soilType";

type SearchableDropdownProps = {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  required?: boolean;
  value: string;
};

function SearchableDropdown({ error, label, onChange, options, placeholder, required, value }: SearchableDropdownProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: 180,
      toValue: open ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [open, progress]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const menuHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 246],
  });

  const chevronRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.dropdownBlock}>
      <View style={styles.dropdownLabelRow}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        {required ? <Text style={styles.requiredLabel}>{t("register_plant_required")}</Text> : null}
      </View>

      <Pressable
        accessibilityHint={t("register_dropdown_open_hint", { label })}
        accessibilityLabel={
          value
            ? t("register_dropdown_selected", { label, value })
            : t("register_dropdown_placeholder", { label, placeholder })
        }
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [
          styles.dropdownButton,
          open ? styles.dropdownButtonOpen : null,
          error ? styles.dropdownButtonError : null,
          pressed ? styles.dropdownButtonPressed : null,
        ]}
      >
        <Text style={[styles.dropdownValue, !value ? styles.placeholderText : null]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={open ? "#7B61FF" : colors.textMuted} />
        </Animated.View>
      </Pressable>

      {error ? <Text style={styles.validationText}>{error}</Text> : null}

      <Animated.View pointerEvents={open ? "auto" : "none"} style={[styles.dropdownMenu, { maxHeight: menuHeight, opacity: progress }]}>
        <View style={styles.dropdownSearchRow}>
          <MaterialIcons name="search" size={18} color={colors.textMuted} />
          <TextInput
            accessibilityLabel={t("register_dropdown_search_label", { label })}
            onChangeText={setQuery}
            placeholder={t("register_plant_search")}
            placeholderTextColor="#9A93AA"
            style={styles.dropdownSearchInput}
            value={query}
          />
        </View>

        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.dropdownOptions}>
          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const selected = value === option;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={option}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                    setQuery("");
                  }}
                  style={({ pressed }) => [
                    styles.dropdownOption,
                    selected ? styles.dropdownOptionSelected : null,
                    pressed ? styles.dropdownOptionPressed : null,
                  ]}
                >
                  <Text style={[styles.dropdownOptionText, selected ? styles.dropdownOptionTextSelected : null]}>
                    {option}
                  </Text>
                  {selected ? <MaterialIcons name="check" size={18} color="#7B61FF" /> : null}
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyOptionText}>{t("register_plant_no_matches")}</Text>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export function RegisterPlantScreen() {
  const { t } = useLanguage();
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

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert(t("register_plant_name_required_title"), t("register_plant_name_required_body"));
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
      Alert.alert(t("register_plant_saved_title"), t("register_plant_saved_body", { name: response.name || form.name }), [
        {
          text: t("register_plant_view_profile"),
          onPress: () => router.replace(`/flower/${encodeURIComponent(response.name || form.name)}`),
        },
      ]);
    } catch (error) {
      Alert.alert(t("register_plant_failed_title"), error instanceof Error ? error.message : t("register_plant_failed_body"));
    } finally {
      setSaving(false);
    }
  };

  const updateDropdown = (field: DropdownField) => (value: string) => updateField(field, value);

  return (
    <Screen>
      <TopBar title={t("register_plant_title")} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="local-florist" size={24} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>{t("register_plant_hero_title")}</Text>
          <Text style={styles.heroText}>{t("register_plant_hero_body")}</Text>
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
              <Text style={styles.imageTitle}>{form.image ? t("register_plant_image_selected") : t("register_plant_add_photo")}</Text>
              <Text style={styles.imageText}>{form.image ? form.image.fileName || t("register_plant_ready_upload") : t("register_plant_photo_hint")}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t("register_plant_basic_info")}</Text>
          <TextInput placeholder={t("register_plant_name")} placeholderTextColor="#999" style={styles.input} value={form.name} onChangeText={(value) => updateField("name", value)} />
          <TextInput placeholder={t("register_plant_species")} placeholderTextColor="#999" style={styles.input} value={form.species} onChangeText={(value) => updateField("species", value)} />
          <TextInput placeholder={t("register_plant_flower_id", { id: nextId })} placeholderTextColor="#999" style={styles.input} value={form.flowerId} onChangeText={(value) => updateField("flowerId", value)} />

          <View style={styles.environmentPanel}>
            <Text style={styles.environmentTitle}>{t("register_plant_environment")}</Text>
            <SearchableDropdown
              error={!form.location ? t("register_plant_choose_city_hint") : undefined}
              label={t("register_plant_city_label")}
              onChange={updateDropdown("location")}
              options={locationOptions}
              placeholder={t("register_plant_city_placeholder")}
              required
              value={form.location}
            />
            <SearchableDropdown
              label={t("register_plant_specific_location_label")}
              onChange={updateDropdown("specificLocation")}
              options={environmentOptions}
              placeholder={t("register_plant_specific_location_label")}
              value={form.specificLocation}
            />
            <SearchableDropdown
              label={t("register_plant_climate_label")}
              onChange={updateDropdown("climate")}
              options={climateOptions}
              placeholder={t("register_plant_climate_label")}
              value={form.climate}
            />
            <SearchableDropdown
              label={t("register_plant_flower_catalog_label")}
              onChange={updateDropdown("flowerCatalog")}
              options={flowerCatalogOptions}
              placeholder={t("register_plant_flower_catalog_placeholder")}
              value={form.flowerCatalog}
            />
            <SearchableDropdown
              label={t("register_plant_soil_type_label")}
              onChange={updateDropdown("soilType")}
              options={soilTypeOptions}
              placeholder={t("register_plant_soil_type_placeholder")}
              value={form.soilType}
            />
          </View>

          <Text style={styles.sectionTitle}>{t("register_plant_sunlight")}</Text>
          <View style={styles.optionRow}>
            {sunlightOptions.map((option) => (
              <Pressable key={option} onPress={() => updateField("sunlight", option)} style={[styles.check, form.sunlight === option ? styles.activeCheck : null]}>
                <MaterialIcons name={form.sunlight === option ? "radio-button-checked" : "radio-button-unchecked"} size={16} color={form.sunlight === option ? colors.primaryDark : colors.textMuted} />
                <Text style={[styles.checkText, form.sunlight === option ? styles.activeCheckText : null]}>{option}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{t("register_plant_care")}</Text>
          <TextInput placeholder={t("register_plant_watering_frequency")} placeholderTextColor="#999" style={styles.input} value={form.wateringFrequency} onChangeText={(value) => updateField("wateringFrequency", value)} />
          <TextInput placeholder={t("register_plant_fertilizer_schedule")} placeholderTextColor="#999" style={styles.input} value={form.fertilizerSchedule} onChangeText={(value) => updateField("fertilizerSchedule", value)} />
          <TextInput placeholder={t("register_plant_last_watered")} placeholderTextColor="#999" style={styles.input} value={form.lastWatered} onChangeText={(value) => updateField("lastWatered", value)} />
          <TextInput placeholder={t("register_plant_initial_size")} placeholderTextColor="#999" style={styles.input} value={form.initialSize} onChangeText={(value) => updateField("initialSize", value)} />

          <Text style={styles.sectionTitle}>{t("register_plant_tracking")}</Text>
          <Pressable onPress={() => updateField("tracking", !form.tracking)} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{form.tracking ? t("register_plant_enabled") : t("register_plant_disabled")}</Text>
            <View style={[styles.switchTrack, form.tracking ? styles.switchTrackOn : null]}>
              <View style={[styles.switchThumb, form.tracking ? styles.switchThumbOn : null]} />
            </View>
          </Pressable>

          <PrimaryButton label={saving ? t("register_plant_saving") : t("register_plant_title")} onPress={() => void handleSubmit()} disabled={saving} />
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
    backgroundColor: "#F5F5F7",
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
    gap: spacing.sm,
    marginBottom: 20,
  },
  imageBox: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 2,
    height: 210,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
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
    fontSize: 16,
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
  placeholderText: {
    color: "#9A93AA",
    fontWeight: "500",
  },
  environmentPanel: {
    backgroundColor: "#F5F5F7",
    borderRadius: 22,
    gap: 14,
    marginTop: 18,
  },
  environmentTitle: {
    color: "#24183D",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  dropdownBlock: {
    gap: 8,
  },
  dropdownLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropdownLabel: {
    color: "#433958",
    fontSize: 13,
    fontWeight: "800",
  },
  requiredLabel: {
    color: "#7B61FF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dropdownButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(123, 97, 255, 0.16)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: 16,
    ...shadows.soft,
  },
  dropdownButtonOpen: {
    borderColor: "#7B61FF",
  },
  dropdownButtonError: {
    borderColor: "rgba(143,45,86,0.5)",
  },
  dropdownButtonPressed: {
    backgroundColor: "#FBFAFF",
  },
  dropdownValue: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    paddingRight: spacing.sm,
  },
  validationText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(123, 97, 255, 0.14)",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.soft,
  },
  dropdownSearchRow: {
    alignItems: "center",
    backgroundColor: "#FAF9FF",
    borderBottomColor: "rgba(123, 97, 255, 0.12)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  dropdownSearchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    minHeight: 44,
  },
  dropdownOptions: {
    maxHeight: 190,
  },
  dropdownOption: {
    alignItems: "center",
    borderBottomColor: "rgba(123, 97, 255, 0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  dropdownOptionSelected: {
    backgroundColor: "#EFEAFF",
  },
  dropdownOptionPressed: {
    backgroundColor: "#F5F1FF",
  },
  dropdownOptionText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownOptionTextSelected: {
    color: "#5A3FE0",
    fontWeight: "900",
  },
  emptyOptionText: {
    color: colors.textMuted,
    fontSize: 13,
    padding: spacing.md,
    textAlign: "center",
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
