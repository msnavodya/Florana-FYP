import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { storageKeys } from "../lib/storage/keys";
import { colors, radii, shadows, spacing } from "../theme/tokens";

export function SettingsScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState("");
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { settings, saveSettings, resetSettings, clearFeedbacks } = useSettings();

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
    showStatus(`Exported app data to ${path}`);
  };

  const handleClearKey = async (storageKey: string, successMessage: string) => {
    await AsyncStorage.removeItem(storageKey);
    showStatus(successMessage);
  };

  const handleResetPreferences = async () => {
    await resetSettings();
    await AsyncStorage.removeItem(storageKeys.appLanguage);
    await setLanguage("English");
    showStatus("Preferences reset to default.");
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <Screen>
      <TopBar title="Settings" subtitle="Florana Workspace" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Florana Workspace</Text>
        <Text style={styles.heroTitle}>Adjust your app experience, reminders, and saved device data in one place.</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <Text style={styles.profileLabel}>Signed in as</Text>
            <Text style={styles.profileName}>{user?.full_name || "Guest Gardener"}</Text>
            <Text style={styles.profileEmail}>{user?.email || "No account email found on this device."}</Text>
          </View>
          <PrimaryButton label="View Profile" onPress={() => router.push("/profile")} variant="secondary" />
        </View>
      </View>

      {status ? <View style={styles.statusCard}><Text style={styles.statusText}>{status}</Text></View> : null}

      <View style={styles.panel}>
        <Text style={styles.panelEyebrow}>Display</Text>
        <Text style={styles.panelTitle}>Look and language</Text>
        <PrimaryButton
          label={`Font Size: ${settings.fontSize}`}
          onPress={() =>
            void saveSettings({
              fontSize:
                settings.fontSize === "Small" ? "Medium" : settings.fontSize === "Medium" ? "Large" : "Small",
            })
          }
          variant="secondary"
        />
        <PrimaryButton
          label={`Language: ${language}`}
          onPress={() => void setLanguage(language === "English" ? "Sinhala" : language === "Sinhala" ? "Tamil" : "English")}
          variant="secondary"
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelEyebrow}>Notifications</Text>
        <Text style={styles.panelTitle}>Reminder controls</Text>
        <PrimaryButton label={`Watering Reminders: ${settings.wateringReminders ? "On" : "Off"}`} onPress={() => void saveSettings({ wateringReminders: !settings.wateringReminders })} variant="secondary" />
        <PrimaryButton label={`Disease Alerts: ${settings.diseaseAlerts ? "On" : "Off"}`} onPress={() => void saveSettings({ diseaseAlerts: !settings.diseaseAlerts })} variant="secondary" />
        <PrimaryButton label={`Weekly Summary: ${settings.weeklySummary ? "On" : "Off"}`} onPress={() => void saveSettings({ weeklySummary: !settings.weeklySummary })} variant="secondary" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelEyebrow}>Shortcuts</Text>
        <Text style={styles.panelTitle}>Open real app screens</Text>
        <PrimaryButton label="Register new plant" onPress={() => router.push("/register")} variant="secondary" />
        <PrimaryButton label="Open care reminder" onPress={() => router.push("/care")} variant="secondary" />
        <PrimaryButton label="Send feedback" onPress={() => router.push("/feedback")} variant="secondary" />
        <PrimaryButton label="Help center" onPress={() => router.push("/help")} variant="secondary" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelEyebrow}>Privacy & Security</Text>
        <Text style={styles.panelTitle}>Stored data</Text>
        <PrimaryButton label="Export my data" onPress={() => void handleExportData()} />
        <PrimaryButton label="Clear cart" onPress={() => void handleClearKey(storageKeys.cart, "Cart cleared from this device.")} variant="secondary" />
        <PrimaryButton label="Clear feedback history" onPress={() => void clearFeedbacks().then(() => showStatus("Saved feedback history removed."))} variant="secondary" />
        <PrimaryButton label="Clear search history" onPress={() => void handleClearKey(storageKeys.searchHistory, "Search history cleared.")} variant="secondary" />
      </View>

      <View style={[styles.panel, styles.dangerPanel]}>
        <Text style={styles.panelEyebrow}>Account</Text>
        <Text style={styles.panelTitle}>Reset or sign out</Text>
        <PrimaryButton label="Reset preferences" onPress={() => void handleResetPreferences()} variant="secondary" />
        <PrimaryButton label="Sign out" onPress={() => void handleLogout()} />
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
  profileCard: {
    backgroundColor: "#F7F1FC",
    borderRadius: radii.lg,
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
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
