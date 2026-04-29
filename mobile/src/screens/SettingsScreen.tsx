import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { storageKeys } from "../lib/storage/keys";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

export function SettingsScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState("");
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { settings, saveSettings, resetSettings, clearFeedbacks } = useSettings();

  const nextLanguage = language === "English" ? "Sinhala" : language === "Sinhala" ? "Tamil" : "English";
  const fontSizeLabel =
    settings.fontSize === "Small" ? t("font_small") : settings.fontSize === "Medium" ? t("font_medium") : t("font_large");
  const languageLabel =
    language === "English" ? t("language_english") : language === "Sinhala" ? t("language_sinhala") : t("language_tamil");

  const showStatus = (message: string) => {
    setStatus(message);
  };

  const handleExportData = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: await AsyncStorage.getItem(storageKeys.user),
      settings: await AsyncStorage.getItem(storageKeys.settings),
      careReminder: await AsyncStorage.getItem(storageKeys.reminders),
      cart: await AsyncStorage.getItem(storageKeys.cart),
      feedbacks: await AsyncStorage.getItem(storageKeys.feedbacks),
    };

    const path = `${FileSystem.cacheDirectory}florana-data-export.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
    showStatus(t("status_exported_path", { path }));
  };

  const handleClearKey = async (storageKey: string, successMessage: string) => {
    await AsyncStorage.removeItem(storageKey);
    showStatus(successMessage);
  };

  const handleResetPreferences = async () => {
    await resetSettings();
    await AsyncStorage.removeItem(storageKeys.appLanguage);
    await setLanguage("English");
    showStatus(t("status_preferences_reset"));
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <Screen>
      <TopBar title={t("settings_title")} subtitle={t("settings_subtitle")} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <Text style={styles.heroEyebrow}>{t("settings_hero_eyebrow")}</Text>
        <Text style={[styles.heroTitle, compact ? styles.heroTitleCompact : null]}>{t("settings_hero_title")}</Text>

        <View style={[styles.profileCard, compact ? styles.profileCardCompact : null]}>
          <View style={styles.profileContent}>
            <Text style={styles.profileLabel}>{t("signed_in_as")}</Text>
            <Text style={[styles.profileName, compact ? styles.profileNameCompact : null]}>{user?.full_name || t("guest_gardener")}</Text>
            <Text style={styles.profileEmail}>{user?.email || t("no_account_email")}</Text>
          </View>
          <PrimaryButton label={t("view_profile")} onPress={() => router.push("/profile")} variant="secondary" />
        </View>
      </View>

      {status ? <View style={styles.statusCard}><Text style={styles.statusText}>{status}</Text></View> : null}

      <View style={[styles.panel, compact ? styles.panelCompact : null]}>
        <Text style={styles.panelEyebrow}>{t("display")}</Text>
        <Text style={styles.panelTitle}>{t("look_and_language")}</Text>
        <PrimaryButton
          label={`${t("font_size")}: ${fontSizeLabel}`}
          onPress={() =>
            void saveSettings({
              fontSize:
                settings.fontSize === "Small" ? "Medium" : settings.fontSize === "Medium" ? "Large" : "Small",
            })
          }
          variant="secondary"
        />
        <PrimaryButton
          label={`${t("language")}: ${languageLabel}`}
          onPress={() => void setLanguage(nextLanguage)}
          variant="secondary"
        />
      </View>

      <View style={[styles.panel, compact ? styles.panelCompact : null]}>
        <Text style={styles.panelEyebrow}>{t("notifications")}</Text>
        <Text style={styles.panelTitle}>{t("reminder_controls")}</Text>
        <PrimaryButton label={`${t("watering_reminders")}: ${settings.wateringReminders ? t("on") : t("off")}`} onPress={() => void saveSettings({ wateringReminders: !settings.wateringReminders })} variant="secondary" />
        <PrimaryButton label={`${t("disease_alerts")}: ${settings.diseaseAlerts ? t("on") : t("off")}`} onPress={() => void saveSettings({ diseaseAlerts: !settings.diseaseAlerts })} variant="secondary" />
        <PrimaryButton label={`${t("weekly_summary")}: ${settings.weeklySummary ? t("on") : t("off")}`} onPress={() => void saveSettings({ weeklySummary: !settings.weeklySummary })} variant="secondary" />
      </View>

      <View style={[styles.panel, compact ? styles.panelCompact : null]}>
        <Text style={styles.panelEyebrow}>{t("shortcuts")}</Text>
        <Text style={styles.panelTitle}>{t("open_real_app_screens")}</Text>
        <PrimaryButton label={t("register_new_plant")} onPress={() => router.push("/plant-register")} variant="secondary" />
        <PrimaryButton label={t("open_care_reminder")} onPress={() => router.push("/care")} variant="secondary" />
        <PrimaryButton label={t("send_feedback")} onPress={() => router.push("/feedback")} variant="secondary" />
        <PrimaryButton label={t("help_center")} onPress={() => router.push("/help")} variant="secondary" />
      </View>

      <View style={[styles.panel, compact ? styles.panelCompact : null]}>
        <Text style={styles.panelEyebrow}>{t("privacy_security")}</Text>
        <Text style={styles.panelTitle}>{t("stored_data")}</Text>
        <PrimaryButton label={t("export_my_data")} onPress={() => void handleExportData()} />
        <PrimaryButton label={t("clear_cart")} onPress={() => void handleClearKey(storageKeys.cart, t("status_cart_cleared"))} variant="secondary" />
        <PrimaryButton label={t("clear_feedback_history")} onPress={() => void clearFeedbacks().then(() => showStatus(t("status_feedback_cleared")))} variant="secondary" />
        <PrimaryButton label={t("clear_search_history")} onPress={() => void handleClearKey(storageKeys.searchHistory, t("status_search_cleared"))} variant="secondary" />
      </View>

      <View style={[styles.panel, compact ? styles.panelCompact : null, styles.dangerPanel]}>
        <Text style={styles.panelEyebrow}>{t("account")}</Text>
        <Text style={styles.panelTitle}>{t("reset_or_sign_out")}</Text>
        <PrimaryButton label={t("reset_preferences")} onPress={() => void handleResetPreferences()} variant="secondary" />
        <PrimaryButton label={t("sign_out")} onPress={() => void handleLogout()} />
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    borderRadius: 22,
    padding: spacing.md,
  },
  heroEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
  },
  heroTitleCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  profileCard: {
    backgroundColor: "#F7F1FC",
    borderRadius: radii.lg,
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  profileCardCompact: {
    gap: spacing.sm,
    padding: 12,
  },
  profileContent: {
    gap: spacing.xs,
  },
  profileLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  profileName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  profileNameCompact: {
    fontSize: 19,
  },
  profileEmail: {
    color: colors.textMuted,
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radii.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: "#24513B",
    fontSize: 13,
    fontWeight: "700",
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  panelCompact: {
    borderRadius: 22,
    gap: spacing.sm,
    padding: spacing.md,
  },
  panelEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  panelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  dangerPanel: {
    marginBottom: spacing.lg,
  },
});
