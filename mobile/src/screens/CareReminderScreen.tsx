import { MaterialIcons } from "@expo/vector-icons";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { ReminderState } from "../types/app";

type LanguageCode = "en" | "si" | "ta";

const defaultOptions = [
  { key: "watering", titleKey: "watering", infoKey: "wateringInfo" },
  { key: "fertilizing", titleKey: "fertilizing", infoKey: "fertilizingInfo" },
  { key: "pruning", titleKey: "pruning", infoKey: "pruningInfo" },
  { key: "repotting", titleKey: "repotting", infoKey: "repottingInfo" },
  { key: "sunlight", titleKey: "sunlight", infoKey: "sunlightInfo" },
] as const;

const careCopy: Record<
  LanguageCode,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    activeTasks: string;
    mode: string;
    options: string;
    watering: string;
    wateringInfo: string;
    fertilizing: string;
    fertilizingInfo: string;
    pruning: string;
    pruningInfo: string;
    repotting: string;
    repottingInfo: string;
    sunlight: string;
    sunlightInfo: string;
    on: string;
    off: string;
    wateringTime: string;
    customNotes: string;
    addNote: string;
    summary: string;
    daily: string;
    weekly: string;
    notifications: string;
    pushAlerts: string;
    pushAlertsInfo: string;
    emailAlerts: string;
    emailAlertsInfo: string;
    testNotification: string;
    careMessages: string;
    next: string;
    paused: string;
  }
> = {
  en: {
    eyebrow: "Plant schedule",
    title: "Care Reminder",
    subtitle: "Keep watering and care tasks organized with a clean mobile planner that saves automatically.",
    activeTasks: "Active tasks",
    mode: "Mode",
    options: "Options",
    watering: "Watering",
    wateringInfo: "Notify when plant needs water",
    fertilizing: "Fertilizing",
    fertilizingInfo: "Remind when to fertilize",
    pruning: "Pruning",
    pruningInfo: "Alerts for trimming and shaping",
    repotting: "Repotting",
    repottingInfo: "Remind when to repot",
    sunlight: "Sunlight",
    sunlightInfo: "Suggest moving plants for better light",
    on: "On",
    off: "Off",
    wateringTime: "Watering Time",
    customNotes: "Custom Notes",
    addNote: "Add note",
    summary: "Summary",
    daily: "Daily",
    weekly: "Weekly",
    notifications: "Notifications",
    pushAlerts: "Push Alerts",
    pushAlertsInfo: "Browser notification reminders.",
    emailAlerts: "Email Alerts",
    emailAlertsInfo: "Save your email reminder preference.",
    testNotification: "Test Notification",
    careMessages: "Care Reminder Messages",
    next: "Next",
    paused: "Paused",
  },
  si: {
    eyebrow: "පැල කාලසටහන",
    title: "සැලකිලි මතක් කිරීම",
    subtitle: "ජලය දැමීම සහ සැලකිලි කාර්යයන් ස්වයංක්‍රීයව සුරකින පිරිසිදු ජංගම සැලසුම්කරණයක් සමඟ සංවිධානය කරගන්න.",
    activeTasks: "සක්‍රිය කාර්යයන්",
    mode: "ක්‍රමය",
    options: "විකල්ප",
    watering: "ජලය දැමීම",
    wateringInfo: "පැලට ජලය අවශ්‍ය විට දැනුම් දෙන්න",
    fertilizing: "පෝෂක දැමීම",
    fertilizingInfo: "පෝෂක දැමිය යුතු වේලාව මතක් කරන්න",
    pruning: "කප්පාදු කිරීම",
    pruningInfo: "කැපීම හා හැඩගැස්වීම සඳහා ඇඟවීම්",
    repotting: "නැවත බඳුනකට මාරු කිරීම",
    repottingInfo: "නැවත බඳුනකට මාරු කළ යුතු වේලාව මතක් කරන්න",
    sunlight: "හිරු එළිය",
    sunlightInfo: "වඩා හොඳ ආලෝකය සඳහා පැල ගෙනයෑම යෝජනා කරන්න",
    on: "සක්‍රිය",
    off: "අක්‍රිය",
    wateringTime: "ජලය දැමීමේ වේලාව",
    customNotes: "අභිරුචි සටහන්",
    addNote: "සටහන එක් කරන්න",
    summary: "සාරාංශය",
    daily: "දිනපතා",
    weekly: "සතිපතා",
    notifications: "දැනුම්දීම්",
    pushAlerts: "Push දැනුම්දීම්",
    pushAlertsInfo: "බ්‍රව්සර් දැනුම්දීම් මතක් කිරීම්.",
    emailAlerts: "විද්‍යුත් තැපැල් දැනුම්දීම්",
    emailAlertsInfo: "ඔබගේ විද්‍යුත් තැපැල් මතක් කිරීමේ අභිරුචිය සුරකින්න.",
    testNotification: "දැනුම්දීම පරීක්ෂා කරන්න",
    careMessages: "සැලකිලි මතක් කිරීමේ පණිවිඩ",
    next: "ඊළඟ",
    paused: "නවතා ඇත",
  },
  ta: {
    eyebrow: "செடி அட்டவணை",
    title: "பராமரிப்பு நினைவூட்டல்",
    subtitle: "தானாக சேமிக்கும் சுத்தமான மொபைல் திட்டமிடலுடன் நீர்ப்பாய்ச்சி மற்றும் பராமரிப்பு பணிகளை ஒழுங்குபடுத்து.",
    activeTasks: "செயலில் உள்ள பணிகள்",
    mode: "முறை",
    options: "விருப்பங்கள்",
    watering: "நீர்ப்பாய்ச்சி",
    wateringInfo: "செடிக்கு நீர் தேவைப்படும் போது அறிவிக்கவும்",
    fertilizing: "உரம் இடுதல்",
    fertilizingInfo: "எப்போது உரம் இட வேண்டும் என்று நினைவூட்டவும்",
    pruning: "கிளைச்சுற்று",
    pruningInfo: "வெட்டுதல் மற்றும் வடிவமைப்பிற்கான அறிவிப்புகள்",
    repotting: "மறு நட்டம்",
    repottingInfo: "எப்போது மீண்டும் நட்டம் செய்ய வேண்டும் என்று நினைவூட்டவும்",
    sunlight: "சூரிய ஒளி",
    sunlightInfo: "சிறந்த ஒளிக்காக செடிகளை நகர்த்த பரிந்துரைக்கவும்",
    on: "இயக்கு",
    off: "நிறுத்து",
    wateringTime: "நீர்ப்பாய்ச்சி நேரம்",
    customNotes: "தனிப்பயன் குறிப்புகள்",
    addNote: "குறிப்பு சேர்",
    summary: "சுருக்கம்",
    daily: "தினசரி",
    weekly: "வாராந்திர",
    notifications: "அறிவிப்புகள்",
    pushAlerts: "Push அறிவிப்புகள்",
    pushAlertsInfo: "உலாவி அறிவிப்பு நினைவூட்டல்கள்.",
    emailAlerts: "மின்னஞ்சல் அறிவிப்புகள்",
    emailAlertsInfo: "உங்கள் மின்னஞ்சல் நினைவூட்டல் விருப்பத்தை சேமிக்கவும்.",
    testNotification: "அறிவிப்பை சோதிக்கவும்",
    careMessages: "பராமரிப்பு நினைவூட்டல் செய்திகள்",
    next: "அடுத்து",
    paused: "நிறுத்தப்பட்டது",
  },
};

const isExpoGo = Constants.executionEnvironment === "storeClient";

const getNotificationsModule = () => {
  if (isExpoGo) {
    return null;
  }

  try {
    return require("expo-notifications") as typeof import("expo-notifications");
  } catch {
    return null;
  }
};

export function CareReminderScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { languageCode, t } = useLanguage();
  const copy = careCopy[languageCode] || careCopy.en;
  const [menuOpen, setMenuOpen] = useState(false);
  const [newCustomNote, setNewCustomNote] = useState("");
  const [status, setStatus] = useState("");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { reminders, setReminders } = useSettings();

  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return;
    }

    void Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
      }
      if (reminderTimer.current) {
        clearTimeout(reminderTimer.current);
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

  const updateReminders = async (next: ReminderState) => {
    await setReminders(next);
  };

  const createReminderMessage = () => `Time to water your plant (${reminders.wateringTime})`;

  const addInAppMessage = async (text: string) => {
    await updateReminders({
      ...reminders,
      inAppMessages: [{ id: Date.now(), text }, ...reminders.inAppMessages],
    });
  };

  const syncNativeNotification = async () => {
    const Notifications = getNotificationsModule();

    if (isExpoGo || !Notifications) {
      return;
    }

    if (!reminders.options.watering || !reminders.notifications.push) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const [hour, minute] = reminders.wateringTime.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Plant Care Reminder",
        body: createReminderMessage(),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  };

  useEffect(() => {
    void syncNativeNotification();
  }, [reminders.wateringTime, reminders.options.watering, reminders.notifications.push]);

  const scheduleNextReminder = () => {
    if (reminderTimer.current) {
      clearTimeout(reminderTimer.current);
    }

    if (!reminders.options.watering) {
      return;
    }

    const [hour, minute] = reminders.wateringTime.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return;
    }

    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    reminderTimer.current = setTimeout(() => {
      const messageText = createReminderMessage();
      void addInAppMessage(messageText);
      void scheduleNextReminder();
    }, target.getTime() - now.getTime());
  };

  useEffect(() => {
    scheduleNextReminder();

    return () => {
      if (reminderTimer.current) {
        clearTimeout(reminderTimer.current);
      }
    };
  }, [reminders.wateringTime, reminders.options.watering]);

  const sendNotification = async () => {
    if (!Device.isDevice && !isExpoGo) {
      showStatus("Notifications work best on a real device.");
    }

    await addInAppMessage(createReminderMessage());
    showStatus("Test reminder added.");
  };

  const toggleOption = async (key: string) => {
    await updateReminders({
      ...reminders,
      options: { ...reminders.options, [key]: !reminders.options[key] },
    });
    showStatus(`${key} reminder updated.`);
  };

  const toggleNotification = async (type: "push" | "email") => {
    await updateReminders({
      ...reminders,
      notifications: { ...reminders.notifications, [type]: !reminders.notifications[type] },
    });
    showStatus(`${type} alerts updated.`);
  };

  const addCustomNote = async () => {
    const trimmed = newCustomNote.trim();

    if (!trimmed) {
      showStatus("Add a note first.");
      return;
    }

    await updateReminders({
      ...reminders,
      customNotes: [trimmed, ...reminders.customNotes],
    });
    setNewCustomNote("");
    showStatus("Custom reminder added.");
  };

  const removeCustomNote = async (index: number) => {
    await updateReminders({
      ...reminders,
      customNotes: reminders.customNotes.filter((_, currentIndex) => currentIndex !== index),
    });
    showStatus("Custom reminder removed.");
  };

  const activeTasks = defaultOptions.filter((option) => reminders.options[option.key]).length + reminders.customNotes.length;
  const nextReminderLabel = reminders.options.watering ? reminders.wateringTime : copy.paused;

  return (
    <Screen>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.topBar, compact ? styles.topBarCompact : null]}>
        <Pressable accessibilityLabel={t("back")} onPress={() => router.push("/home")} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Pressable accessibilityLabel={t("open_menu")} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <View style={styles.heroIcon}>
          <MaterialIcons name="alarm" size={22} color={colors.white} />
        </View>
        <Text style={styles.heroEyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.heroTitle}>{copy.title}</Text>
        <Text style={styles.heroSubtitle}>{copy.subtitle}</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryChip}>{`${copy.activeTasks}: ${activeTasks}`}</Text>
          <Text style={styles.summaryChip}>{`${copy.mode}: ${reminders.summaryMode}`}</Text>
          <Text style={styles.summaryChip}>{`${copy.next}: ${nextReminderLabel}`}</Text>
        </View>
      </View>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.options}</Text>
        {defaultOptions.map((option) => (
          <View key={option.key} style={styles.optionRow}>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{copy[option.titleKey]}</Text>
              <Text style={styles.optionInfo}>{copy[option.infoKey]}</Text>
            </View>
            <Pressable
              onPress={() => void toggleOption(option.key)}
              style={[styles.toggleButton, reminders.options[option.key] ? styles.toggleOn : styles.toggleOff]}
            >
              <Text style={[styles.toggleText, reminders.options[option.key] ? styles.toggleTextOn : styles.toggleTextOff]}>
                {reminders.options[option.key] ? copy.on : copy.off}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {reminders.options.watering ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.wateringTime}</Text>
          <View style={styles.timePickerRow}>
            <TextInput
              placeholder="07:00"
              placeholderTextColor={colors.textMuted}
              style={styles.timeInput}
              value={reminders.wateringTime}
              onChangeText={(value) => void updateReminders({ ...reminders, wateringTime: value })}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.customNotes}</Text>
        <View style={styles.customInputRow}>
          <TextInput
            placeholder={copy.addNote}
            placeholderTextColor={colors.textMuted}
            style={styles.noteInput}
            value={newCustomNote}
            onChangeText={setNewCustomNote}
          />
          <Pressable accessibilityLabel="Add custom note" onPress={() => void addCustomNote()} style={styles.addButton}>
            <MaterialIcons name="add" size={18} color={colors.white} />
          </Pressable>
        </View>

        {reminders.customNotes.map((note, index) => (
          <View key={`${note}-${index}`} style={styles.customNoteRow}>
            <Text style={styles.customNoteText}>{note}</Text>
            <Pressable accessibilityLabel="Remove custom note" onPress={() => void removeCustomNote(index)} style={styles.trashButton}>
              <MaterialIcons name="delete-outline" size={16} color="#B33D68" />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.summary}</Text>
        <View style={styles.summaryButtons}>
          <Pressable
            onPress={() => void updateReminders({ ...reminders, summaryMode: "daily" })}
            style={[styles.summaryButton, reminders.summaryMode === "daily" ? styles.summaryButtonActive : null]}
          >
            <Text style={[styles.summaryButtonText, reminders.summaryMode === "daily" ? styles.summaryButtonTextActive : null]}>
              {copy.daily}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void updateReminders({ ...reminders, summaryMode: "weekly" })}
            style={[styles.summaryButton, reminders.summaryMode === "weekly" ? styles.summaryButtonActive : null]}
          >
            <Text style={[styles.summaryButtonText, reminders.summaryMode === "weekly" ? styles.summaryButtonTextActive : null]}>
              {copy.weekly}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.notifications}</Text>

        <View style={styles.optionRow}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{copy.pushAlerts}</Text>
            <Text style={styles.optionInfo}>{copy.pushAlertsInfo}</Text>
          </View>
          <Pressable
            onPress={() => void toggleNotification("push")}
            style={[styles.toggleButton, reminders.notifications.push ? styles.toggleOn : styles.toggleOff]}
          >
            <Text style={[styles.toggleText, reminders.notifications.push ? styles.toggleTextOn : styles.toggleTextOff]}>
              {reminders.notifications.push ? copy.on : copy.off}
            </Text>
          </Pressable>
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{copy.emailAlerts}</Text>
            <Text style={styles.optionInfo}>{copy.emailAlertsInfo}</Text>
          </View>
          <Pressable
            onPress={() => void toggleNotification("email")}
            style={[styles.toggleButton, reminders.notifications.email ? styles.toggleOn : styles.toggleOff]}
          >
            <Text style={[styles.toggleText, reminders.notifications.email ? styles.toggleTextOn : styles.toggleTextOff]}>
              {reminders.notifications.email ? copy.on : copy.off}
            </Text>
          </Pressable>
        </View>

        {isExpoGo ? (
          <Text style={styles.helperText}>
            Push notifications are disabled in Expo Go. Use a development build for real device push testing.
          </Text>
        ) : null}

        <Pressable onPress={() => void sendNotification()} style={styles.testButton}>
          <MaterialIcons name="notifications-active" size={16} color={colors.white} />
          <Text style={styles.testButtonText}>{copy.testNotification}</Text>
        </Pressable>
      </View>

      {reminders.inAppMessages.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.careMessages}</Text>
          <View style={styles.messageList}>
            {reminders.inAppMessages.map((message) => (
              <View key={message.id} style={styles.messageBox}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

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
    backgroundColor: "#406E62",
    borderRadius: 28,
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
    color: "rgba(255,255,255,0.8)",
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
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryChip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.pill,
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: "#24513B",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  optionInfo: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  toggleButton: {
    borderRadius: radii.pill,
    minWidth: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  toggleOn: {
    backgroundColor: "#406E62",
  },
  toggleOff: {
    backgroundColor: "#ECE8F1",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  toggleTextOn: {
    color: colors.white,
  },
  toggleTextOff: {
    color: colors.text,
  },
  timePickerRow: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: spacing.md,
  },
  timeInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  customInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  noteInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  customNoteRow: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  customNoteText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: spacing.sm,
  },
  trashButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,245,248,0.96)",
    borderColor: "rgba(179,61,104,0.18)",
    borderRadius: 14,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  summaryButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryButton: {
    alignItems: "center",
    backgroundColor: "#ECE8F1",
    borderRadius: 16,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  summaryButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  summaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  summaryButtonTextActive: {
    color: colors.white,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  testButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  testButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  messageList: {
    gap: spacing.sm,
  },
  messageBox: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: spacing.md,
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
