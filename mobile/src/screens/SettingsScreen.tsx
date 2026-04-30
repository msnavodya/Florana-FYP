import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { storageKeys } from "../lib/storage/keys";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";

const fontSizes = ["Small", "Medium", "Large"] as const;
const languages = ["English", "Sinhala", "Tamil"] as const;

export function SettingsScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState("");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { settings, saveSettings, resetSettings, clearFeedbacks } = useSettings();

  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
      }
    };
  }, []);

  const showStatus = (message: string) => {
    setStatus(message);
    if (statusTimer.current) {
      clearTimeout(statusTimer.current);
    }
    statusTimer.current = setTimeout(() => setStatus(""), 2600);
  };

  const cycleFontSize = async () => {
    const index = fontSizes.indexOf(settings.fontSize);
    const next = fontSizes[(index + 1) % fontSizes.length];
    await saveSettings({ fontSize: next });
    showStatus(`Font size set to ${next}.`);
  };

  const cycleLanguage = async () => {
    const index = languages.indexOf(language);
    const next = languages[(index + 1) % languages.length];
    await setLanguage(next);
    await saveSettings({ language: next });
    showStatus(`Language changed to ${next}.`);
  };

  const handleToggle = async (key: "wateringReminders" | "diseaseAlerts" | "weeklySummary") => {
    const nextValue = !settings[key];
    await saveSettings({ [key]: nextValue });

    const labels: Record<typeof key, string> = {
      wateringReminders: "watering reminders",
      diseaseAlerts: "disease alerts",
      weeklySummary: "weekly summary",
    };

    showStatus(`${nextValue ? "Enabled" : "Disabled"} ${labels[key]}.`);
  };

  const handleClearKey = async (storageKey: string, successMessage: string) => {
    await AsyncStorage.removeItem(storageKey);
    showStatus(successMessage);
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
    showStatus("Exported your app data.");
  };

  const handleResetPreferences = () => {
    Alert.alert("Reset preferences", "Reset settings back to the Florana defaults?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await resetSettings();
          await AsyncStorage.removeItem(storageKeys.appLanguage);
          await setLanguage("English");
          showStatus("Preferences reset to default.");
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Sign out from Florana on this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.topBar, compact ? styles.topBarCompact : null]}>
        <Pressable accessibilityLabel={t("back")} onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.topActions}>
          <Pressable onPress={() => router.push("/home")} style={styles.homeButton}>
            <MaterialIcons name="home" size={16} color={colors.text} />
            <Text style={styles.homeButtonText}>Home</Text>
          </Pressable>

          <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <View style={styles.heroIcon}>
          <MaterialIcons name="settings" size={22} color={colors.white} />
        </View>
        <Text style={styles.heroEyebrow}>Florana Workspace</Text>
        <Text style={styles.heroTitle}>{t("settings_title")}</Text>
        <Text style={styles.heroSubtitle}>Keep your app organized and comfortable on this device.</Text>

        <View style={[styles.profileCard, compact ? styles.profileCardCompact : null]}>
          <View style={styles.profileCopy}>
            <Text style={styles.profileLabel}>{t("signed_in_as")}</Text>
            <Text style={styles.profileName}>{user?.full_name || t("guest_gardener")}</Text>
            <Text style={styles.profileEmail}>{user?.email || t("no_account_email")}</Text>
          </View>

          <PrimaryButton label={t("view_profile")} onPress={() => router.push("/profile")} variant="secondary" />
        </View>
      </View>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={styles.panelGrid}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelEyebrow}>{t("display")}</Text>
            <Text style={styles.panelTitle}>Look and language</Text>
          </View>

          <Pressable onPress={() => void cycleFontSize()} style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t("font_size")}</Text>
            <View style={styles.settingValuePill}>
              <Text style={styles.settingValueText}>{settings.fontSize}</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => void cycleLanguage()} style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t("language")}</Text>
            <View style={styles.settingValuePill}>
              <Text style={styles.settingValueText}>{language}</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelEyebrow}>{t("notifications")}</Text>
            <Text style={styles.panelTitle}>Reminder controls</Text>
          </View>

          <Pressable onPress={() => void handleToggle("wateringReminders")} style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>{t("watering_reminders")}</Text>
              <Text style={styles.toggleInfo}>Save this preference for plant care reminders.</Text>
            </View>
            <View style={[styles.togglePill, settings.wateringReminders ? styles.togglePillActive : null]}>
              <Text style={[styles.togglePillText, settings.wateringReminders ? styles.togglePillTextActive : null]}>
                {settings.wateringReminders ? t("on") : t("off")}
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={() => void handleToggle("diseaseAlerts")} style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>{t("disease_alerts")}</Text>
              <Text style={styles.toggleInfo}>Keep disease warning messages available in the app.</Text>
            </View>
            <View style={[styles.togglePill, settings.diseaseAlerts ? styles.togglePillActive : null]}>
              <Text style={[styles.togglePillText, settings.diseaseAlerts ? styles.togglePillTextActive : null]}>
                {settings.diseaseAlerts ? t("on") : t("off")}
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={() => void handleToggle("weeklySummary")} style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>{t("weekly_summary")}</Text>
              <Text style={styles.toggleInfo}>Store your summary preference for future activity updates.</Text>
            </View>
            <View style={[styles.togglePill, settings.weeklySummary ? styles.togglePillActive : null]}>
              <Text style={[styles.togglePillText, settings.weeklySummary ? styles.togglePillTextActive : null]}>
                {settings.weeklySummary ? t("on") : t("off")}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelEyebrow}>{t("shortcuts")}</Text>
            <Text style={styles.panelTitle}>Open real app screens</Text>
          </View>

          <View style={styles.actionList}>
            <PrimaryButton label="Register new plant" onPress={() => router.push("/plant-register")} variant="secondary" />
            <PrimaryButton label="Open care reminder" onPress={() => router.push("/care")} variant="secondary" />
            <PrimaryButton label="Send feedback" onPress={() => router.push("/feedback")} variant="secondary" />
            <PrimaryButton label="Help center" onPress={() => router.push("/help")} variant="secondary" />
            <PrimaryButton
              label="Contact support"
              onPress={() => {
                void Linking.openURL("mailto:support@florana.com?subject=Florana%20Support");
              }}
              variant="secondary"
            />
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelEyebrow}>{t("privacy_security")}</Text>
            <Text style={styles.panelTitle}>Stored data</Text>
          </View>

          <View style={styles.actionList}>
            <PrimaryButton label="Export my data" onPress={() => void handleExportData()} />
            <PrimaryButton label="Clear cart" onPress={() => void handleClearKey(storageKeys.cart, "Cart cleared from this device.")} variant="secondary" />
            <PrimaryButton
              label="Clear feedback history"
              onPress={() => void clearFeedbacks().then(() => showStatus("Saved feedback history removed."))}
              variant="secondary"
            />
            <PrimaryButton
              label={t("clear_search_history")}
              onPress={() => void handleClearKey(storageKeys.searchHistory, "Search history cleared.")}
              variant="secondary"
            />
          </View>
        </View>

        <View style={[styles.panel, styles.panelDanger]}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelEyebrow}>Account</Text>
            <Text style={styles.panelTitle}>Reset or sign out</Text>
          </View>

          <View style={styles.actionList}>
            <PrimaryButton label="Reset preferences" onPress={handleResetPreferences} variant="secondary" />
            <Pressable onPress={handleLogout} style={styles.dangerAction}>
              <Text style={styles.dangerActionText}>{t("sign_out")}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <BottomNav />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  topBarCompact: {
    alignItems: "flex-start",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  homeButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    height: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  homeButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  heroCard: {
    backgroundColor: "#603982",
    borderRadius: 30,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    borderRadius: 24,
    padding: spacing.md,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 42,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  profileCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  profileCardCompact: {
    padding: 12,
  },
  profileCopy: {
    gap: spacing.xs,
  },
  profileLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  profileName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  profileEmail: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
  },
  statusCard: {
   
    backgroundColor: "#F6F0FF",
    borderColor: "#DAC8FF",
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: "#c79deb",
    fontSize: 13,
    fontWeight: "700",
  },
  panelGrid: {
    gap: spacing.md,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  panelDanger: {
    marginBottom: spacing.lg,
  },
  panelHeading: {
    gap: spacing.xs,
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
    fontWeight: "900",
  },
  settingRow: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  settingValuePill: {
    backgroundColor: "#EEF1FA",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  settingValueText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  toggleRow: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  toggleInfo: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  togglePill: {
    backgroundColor: "#ECE8F1",
    borderRadius: radii.pill,
    minWidth: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  togglePillActive: {
    backgroundColor: "#bf91f6",
  },
  togglePillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  togglePillTextActive: {
    color: colors.white,
  },
  actionList: {
    gap: spacing.sm,
  },
  dangerAction: {
    alignItems: "center",
    backgroundColor: "#B33D68",
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  dangerActionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
