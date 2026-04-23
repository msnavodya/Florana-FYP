import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useSettings } from "../context/SettingsContext";
import { colors, radii, spacing } from "../theme/tokens";
import type { ReminderState } from "../types/app";

const defaultOptions = [
  { key: "watering", title: "Watering", info: "Notify when plant needs water" },
  { key: "fertilizing", title: "Fertilizing", info: "Remind when to fertilize" },
  { key: "pruning", title: "Pruning", info: "Alerts for trimming and shaping" },
  { key: "repotting", title: "Repotting", info: "Remind when to repot" },
  { key: "sunlight", title: "Sunlight", info: "Suggest moving plants for better light" },
];

export function CareReminderScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [newCustomNote, setNewCustomNote] = useState("");
  const [status, setStatus] = useState("");
  const { reminders, setReminders } = useSettings();

  useEffect(() => {
    void Notifications.requestPermissionsAsync();
  }, []);

  const updateReminders = async (next: ReminderState) => {
    await setReminders(next);
  };

  const scheduleWateringNotification = async () => {
    if (!Device.isDevice) {
      setStatus("Notifications work best on a real device.");
    }

    const [hour, minute] = reminders.wateringTime.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Plant Care Reminder",
        body: `Time to water your plant (${reminders.wateringTime})`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  };

  const sendNotification = async () => {
    await scheduleWateringNotification();
    const next = {
      ...reminders,
      inAppMessages: [{ id: Date.now(), text: `Time to water your plant (${reminders.wateringTime})` }, ...reminders.inAppMessages],
    };
    await updateReminders(next);
    setStatus("Test reminder added.");
  };

  const toggleOption = async (key: string) => {
    await updateReminders({
      ...reminders,
      options: { ...reminders.options, [key]: !reminders.options[key] },
    });
    setStatus(`${key} reminder updated.`);
  };

  const toggleNotification = async (type: "push" | "email") => {
    await updateReminders({
      ...reminders,
      notifications: { ...reminders.notifications, [type]: !reminders.notifications[type] },
    });
    setStatus(`${type} alerts updated.`);
  };

  const addCustomNote = async () => {
    const trimmed = newCustomNote.trim();
    if (!trimmed) {
      setStatus("Add a note first.");
      return;
    }

    await updateReminders({
      ...reminders,
      customNotes: [trimmed, ...reminders.customNotes],
    });
    setNewCustomNote("");
    setStatus("Custom reminder added.");
  };

  const removeCustomNote = async (index: number) => {
    await updateReminders({
      ...reminders,
      customNotes: reminders.customNotes.filter((_, currentIndex) => currentIndex !== index),
    });
    setStatus("Custom reminder removed.");
  };

  const activeTasks = defaultOptions.filter((option) => reminders.options[option.key]).length + reminders.customNotes.length;

  return (
    <Screen>
      <TopBar title="Care Reminder" subtitle="Plant schedule" onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Care Reminder</Text>
        <Text style={styles.heroBody}>Keep watering and care tasks organized with a clean mobile planner that saves automatically.</Text>
        <Text style={styles.heroMeta}>{`Active tasks: ${activeTasks} • Mode: ${reminders.summaryMode}`}</Text>
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Options</Text>
        {defaultOptions.map((option) => (
          <Pressable key={option.key} onPress={() => void toggleOption(option.key)} style={styles.optionRow}>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionInfo}>{option.info}</Text>
            </View>
            <Text style={styles.optionState}>{reminders.options[option.key] ? "On" : "Off"}</Text>
          </Pressable>
        ))}
      </View>

      {reminders.options.watering ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Watering Time</Text>
          <TextInput
            placeholder="07:00"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={reminders.wateringTime}
            onChangeText={(value) => void updateReminders({ ...reminders, wateringTime: value })}
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Custom Notes</Text>
        <View style={styles.customRow}>
          <TextInput placeholder="Add note" placeholderTextColor={colors.textMuted} style={[styles.input, styles.customInput]} value={newCustomNote} onChangeText={setNewCustomNote} />
          <PrimaryButton label="Add" onPress={() => void addCustomNote()} />
        </View>
        {reminders.customNotes.map((note, index) => (
          <Pressable key={`${note}-${index}`} onPress={() => void removeCustomNote(index)} style={styles.noteRow}>
            <Text style={styles.noteText}>{note}</Text>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <PrimaryButton label="Daily" onPress={() => void updateReminders({ ...reminders, summaryMode: "daily" })} variant={reminders.summaryMode === "daily" ? "primary" : "secondary"} />
          <PrimaryButton label="Weekly" onPress={() => void updateReminders({ ...reminders, summaryMode: "weekly" })} variant={reminders.summaryMode === "weekly" ? "primary" : "secondary"} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Pressable onPress={() => void toggleNotification("push")} style={styles.optionRow}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Push Alerts</Text>
            <Text style={styles.optionInfo}>Device notification reminders.</Text>
          </View>
          <Text style={styles.optionState}>{reminders.notifications.push ? "On" : "Off"}</Text>
        </Pressable>
        <Pressable onPress={() => void toggleNotification("email")} style={styles.optionRow}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Email Alerts</Text>
            <Text style={styles.optionInfo}>Save your email reminder preference.</Text>
          </View>
          <Text style={styles.optionState}>{reminders.notifications.email ? "On" : "Off"}</Text>
        </Pressable>
        <PrimaryButton label="Test Notification" onPress={() => void sendNotification()} />
      </View>

      {reminders.inAppMessages.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Care Reminder Messages</Text>
          {reminders.inAppMessages.map((message) => (
            <View key={message.id} style={styles.messageBox}>
              <Text style={styles.noteText}>{message.text}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  heroMeta: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
  },
  status: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
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
    fontWeight: "700",
  },
  optionInfo: {
    color: colors.textMuted,
    fontSize: 13,
  },
  optionState: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  customRow: {
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
  },
  noteRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noteText: {
    color: colors.text,
    fontSize: 14,
  },
  removeText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryRow: {
    gap: spacing.sm,
  },
  messageBox: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
  },
});
