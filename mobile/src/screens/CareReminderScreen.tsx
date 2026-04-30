import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { ReminderState } from "../types/app";

type LanguageCode = "en" | "si" | "ta";
type ReminderOptionKey = (typeof defaultOptions)[number]["key"];
type NotificationType = keyof ReminderState["notifications"];

const defaultOptions = [
  { key: "watering", titleKey: "watering", infoKey: "wateringInfo", icon: "water-drop" },
  { key: "fertilizing", titleKey: "fertilizing", infoKey: "fertilizingInfo", icon: "compost" },
  { key: "pruning", titleKey: "pruning", infoKey: "pruningInfo", icon: "content-cut" },
  { key: "repotting", titleKey: "repotting", infoKey: "repottingInfo", icon: "inventory-2" },
  { key: "sunlight", titleKey: "sunlight", infoKey: "sunlightInfo", icon: "wb-sunny" },
] as const;

const quickTimePresets = [
  { key: "morning", time: "07:00" },
  { key: "midday", time: "12:00" },
  { key: "evening", time: "18:30" },
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
    liveStatus: string;
    currentTime: string;
    scheduledFor: string;
    quickTimes: string;
    morning: string;
    midday: string;
    evening: string;
    autoSave: string;
    timeHint: string;
    timeInvalid: string;
    timeSaved: string;
    noteRequired: string;
    noteAdded: string;
    noteRemoved: string;
    testAdded: string;
    pushUnsupported: string;
    pushPermissionDenied: string;
    activeLabel: string;
    savedLabel: string;
    enabledLabel: string;
    recentLabel: string;
    timeFormatPlaceholder: string;
  }
> = {
  en: {
    eyebrow: "Plant schedule",
    title: "Care Reminder",
    subtitle: "Keep watering and care tasks organized with a clean planner that updates live and saves automatically.",
    activeTasks: "Active tasks",
    mode: "Mode",
    options: "Options",
    watering: "Watering",
    wateringInfo: "Notify when the plant needs water",
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
    wateringTime: "Watering time",
    customNotes: "Custom notes",
    addNote: "Add note",
    summary: "Summary",
    daily: "Daily",
    weekly: "Weekly",
    notifications: "Notifications",
    pushAlerts: "Push alerts",
    pushAlertsInfo: "Schedule device reminders for your watering routine.",
    emailAlerts: "Email alerts",
    emailAlertsInfo: "Save your email reminder preference for later integration.",
    testNotification: "Send test reminder",
    careMessages: "Recent reminder activity",
    next: "Next",
    paused: "Paused",
    liveStatus: "Live status",
    currentTime: "Current time",
    scheduledFor: "Scheduled for",
    quickTimes: "Quick times",
    morning: "Morning",
    midday: "Midday",
    evening: "Evening",
    autoSave: "Every change is saved automatically.",
    timeHint: "Use 24-hour time like 07:00 or 18:30 for reliable daily reminders.",
    timeInvalid: "Enter time as HH:MM in 24-hour format.",
    timeSaved: "Reminder time updated.",
    noteRequired: "Add a note first.",
    noteAdded: "Custom reminder added.",
    noteRemoved: "Custom reminder removed.",
    testAdded: "Test reminder added.",
    pushUnsupported: "Push notifications need a development build or production app.",
    pushPermissionDenied: "Push permission is off for this device.",
    activeLabel: "active",
    savedLabel: "saved",
    enabledLabel: "enabled",
    recentLabel: "recent",
    timeFormatPlaceholder: "07:00",
  },
  si: {
    eyebrow: "à¶´à·à¶½ à¶šà·à¶½à·ƒà¶§à·„à¶±",
    title: "à·ƒà·à¶½à¶šà·’à¶½à·’ à¶¸à¶­à¶šà·Š à¶šà·’à¶»à·“à¶¸",
    subtitle: "à¶¢à¶½à¶º à¶¯à·à¶¸à·“à¶¸ à·ƒà·„ à·ƒà·à¶½à¶šà·’à¶½à·’ à¶šà·à¶»à·Šà¶ºà¶ºà¶±à·Š à·ƒà·Šà·€à¶ºà¶‚à¶šà·Šâ€à¶»à·“à¶ºà·€ à·ƒà·”à¶»à¶šà·’à¶± à¶´à·’à¶»à·’à·ƒà·’à¶¯à·” à¶¢à¶‚à¶œà¶¸ à·ƒà·à¶½à·ƒà·”à¶¸à·Šà¶šà¶»à¶«à¶ºà¶šà·Š à·ƒà¶¸à¶Ÿ à·ƒà¶‚à·€à·’à¶°à·à¶±à¶º à¶šà¶»à¶œà¶±à·Šà¶±.",
    activeTasks: "à·ƒà¶šà·Šâ€à¶»à·’à¶º à¶šà·à¶»à·Šà¶ºà¶ºà¶±à·Š",
    mode: "à¶šà·Šâ€à¶»à¶¸à¶º",
    options: "à·€à·’à¶šà¶½à·Šà¶´",
    watering: "à¶¢à¶½à¶º à¶¯à·à¶¸à·“à¶¸",
    wateringInfo: "à¶´à·à¶½à¶§ à¶¢à¶½à¶º à¶…à·€à·à·Šâ€à¶º à·€à·’à¶§ à¶¯à·à¶±à·”à¶¸à·Š à¶¯à·™à¶±à·Šà¶±",
    fertilizing: "à¶´à·à·‚à¶š à¶¯à·à¶¸à·“à¶¸",
    fertilizingInfo: "à¶´à·à·‚à¶š à¶¯à·à¶¸à·’à¶º à¶ºà·”à¶­à·” à·€à·šà¶½à·à·€ à¶¸à¶­à¶šà·Š à¶šà¶»à¶±à·Šà¶±",
    pruning: "à¶šà¶´à·Šà¶´à·à¶¯à·” à¶šà·’à¶»à·“à¶¸",
    pruningInfo: "à¶šà·à¶´à·“à¶¸ à·„à· à·„à·à¶©à¶œà·à·ƒà·Šà·€à·“à¶¸ à·ƒà¶³à·„à· à¶‡à¶Ÿà·€à·“à¶¸à·Š",
    repotting: "à¶±à·à·€à¶­ à¶¶à¶³à·”à¶±à¶šà¶§ à¶¸à·à¶»à·” à¶šà·’à¶»à·“à¶¸",
    repottingInfo: "à¶±à·à·€à¶­ à¶¶à¶³à·”à¶±à¶šà¶§ à¶¸à·à¶»à·” à¶šà·… à¶ºà·”à¶­à·” à·€à·šà¶½à·à·€ à¶¸à¶­à¶šà·Š à¶šà¶»à¶±à·Šà¶±",
    sunlight: "à·„à·’à¶»à·” à¶‘à·…à·’à¶º",
    sunlightInfo: "à·€à¶©à· à·„à·œà¶³ à¶†à¶½à·à¶šà¶º à·ƒà¶³à·„à· à¶´à·à¶½ à¶œà·™à¶±à¶ºà·‘à¶¸ à¶ºà·à¶¢à¶±à· à¶šà¶»à¶±à·Šà¶±",
    on: "à·ƒà¶šà·Šâ€à¶»à·’à¶º",
    off: "à¶…à¶šà·Šâ€à¶»à·’à¶º",
    wateringTime: "à¶¢à¶½à¶º à¶¯à·à¶¸à·“à¶¸à·š à·€à·šà¶½à·à·€",
    customNotes: "à¶…à¶·à·’à¶»à·”à¶ à·’ à·ƒà¶§à·„à¶±à·Š",
    addNote: "à·ƒà¶§à·„à¶± à¶‘à¶šà·Š à¶šà¶»à¶±à·Šà¶±",
    summary: "à·ƒà·à¶»à·à¶‚à·à¶º",
    daily: "à¶¯à·’à¶±à¶´à¶­à·",
    weekly: "à·ƒà¶­à·’à¶´à¶­à·",
    notifications: "à¶¯à·à¶±à·”à¶¸à·Šà¶¯à·“à¶¸à·Š",
    pushAlerts: "Push à¶¯à·à¶±à·”à¶¸à·Šà¶¯à·“à¶¸à·Š",
    pushAlertsInfo: "Browser notification reminders.",
    emailAlerts: "à·€à·’à¶¯à·Šâ€à¶ºà·”à¶­à·Š à¶­à·à¶´à·à¶½à·Š à¶¯à·à¶±à·”à¶¸à·Šà¶¯à·“à¶¸à·Š",
    emailAlertsInfo: "Save your email reminder preference.",
    testNotification: "à¶¯à·à¶±à·”à¶¸à·Šà¶¯à·“à¶¸ à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà¶»à¶±à·Šà¶±",
    careMessages: "à·ƒà·à¶½à¶šà·’à¶½à·’ à¶¸à¶­à¶šà·Š à¶šà·’à¶»à·“à¶¸à·š à¶´à¶«à·’à·€à·’à¶©",
    next: "à¶Šà·…à¶Ÿ",
    paused: "à¶±à·€à¶­à· à¶‡à¶­",
    liveStatus: "Live status",
    currentTime: "Current time",
    scheduledFor: "Scheduled for",
    quickTimes: "Quick times",
    morning: "Morning",
    midday: "Midday",
    evening: "Evening",
    autoSave: "Every change is saved automatically.",
    timeHint: "Use 24-hour time like 07:00 or 18:30.",
    timeInvalid: "Enter time as HH:MM in 24-hour format.",
    timeSaved: "Reminder time updated.",
    noteRequired: "Add a note first.",
    noteAdded: "Custom reminder added.",
    noteRemoved: "Custom reminder removed.",
    testAdded: "Test reminder added.",
    pushUnsupported: "Push notifications need a development build or production app.",
    pushPermissionDenied: "Push permission is off for this device.",
    activeLabel: "active",
    savedLabel: "saved",
    enabledLabel: "enabled",
    recentLabel: "recent",
    timeFormatPlaceholder: "07:00",
  },
  ta: {
    eyebrow: "à®šà¯†à®Ÿà®¿ à®…à®Ÿà¯à®Ÿà®µà®£à¯ˆ",
    title: "à®ªà®°à®¾à®®à®°à®¿à®ªà¯à®ªà¯ à®¨à®¿à®©à¯ˆà®µà¯‚à®Ÿà¯à®Ÿà®²à¯",
    subtitle: "à®¤à®¾à®©à®¾à®• à®šà¯‡à®®à®¿à®•à¯à®•à¯à®®à¯ à®šà¯à®¤à¯à®¤à®®à®¾à®© à®®à¯Šà®ªà¯ˆà®²à¯ à®¤à®¿à®Ÿà¯à®Ÿà®®à®¿à®Ÿà®²à¯à®Ÿà®©à¯ à®¨à¯€à®°à¯à®ªà¯à®ªà®¾à®¯à¯à®šà¯à®šà®¿ à®®à®±à¯à®±à¯à®®à¯ à®ªà®°à®¾à®®à®°à®¿à®ªà¯à®ªà¯ à®ªà®£à®¿à®•à®³à¯ˆ à®’à®´à¯à®™à¯à®•à¯à®ªà®Ÿà¯à®¤à¯à®¤à¯.",
    activeTasks: "à®šà¯†à®¯à®²à®¿à®²à¯ à®‰à®³à¯à®³ à®ªà®£à®¿à®•à®³à¯",
    mode: "à®®à¯à®±à¯ˆ",
    options: "à®µà®¿à®°à¯à®ªà¯à®ªà®™à¯à®•à®³à¯",
    watering: "à®¨à¯€à®°à¯à®ªà¯à®ªà®¾à®¯à¯à®šà¯à®šà®¿",
    wateringInfo: "à®šà¯†à®Ÿà®¿à®•à¯à®•à¯ à®¨à¯€à®°à¯ à®¤à¯‡à®µà¯ˆà®ªà¯à®ªà®Ÿà¯à®®à¯ à®ªà¯‹à®¤à¯ à®…à®±à®¿à®µà®¿à®•à¯à®•à®µà¯à®®à¯",
    fertilizing: "à®‰à®°à®®à¯ à®‡à®Ÿà¯à®¤à®²à¯",
    fertilizingInfo: "à®Žà®ªà¯à®ªà¯‹à®¤à¯ à®‰à®°à®®à¯ à®‡à®Ÿ à®µà¯‡à®£à¯à®Ÿà¯à®®à¯ à®Žà®©à¯à®±à¯ à®¨à®¿à®©à¯ˆà®µà¯‚à®Ÿà¯à®Ÿà®µà¯à®®à¯",
    pruning: "à®•à®¿à®³à¯ˆà®šà¯à®šà¯à®±à¯à®±à¯",
    pruningInfo: "à®µà¯†à®Ÿà¯à®Ÿà¯à®¤à®²à¯ à®®à®±à¯à®±à¯à®®à¯ à®µà®Ÿà®¿à®µà®®à¯ˆà®ªà¯à®ªà®¿à®±à¯à®•à®¾à®© à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯à®•à®³à¯",
    repotting: "à®®à®±à¯ à®¨à®Ÿà¯à®Ÿà®®à¯",
    repottingInfo: "à®Žà®ªà¯à®ªà¯‹à®¤à¯ à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®¨à®Ÿà¯à®Ÿà®®à¯ à®šà¯†à®¯à¯à®¯ à®µà¯‡à®£à¯à®Ÿà¯à®®à¯ à®Žà®©à¯à®±à¯ à®¨à®¿à®©à¯ˆà®µà¯‚à®Ÿà¯à®Ÿà®µà¯à®®à¯",
    sunlight: "à®šà¯‚à®°à®¿à®¯ à®’à®³à®¿",
    sunlightInfo: "à®šà®¿à®±à®¨à¯à®¤ à®’à®³à®¿à®•à¯à®•à®¾à®• à®šà¯†à®Ÿà®¿à®•à®³à¯ˆ à®¨à®•à®°à¯à®¤à¯à®¤ à®ªà®°à®¿à®¨à¯à®¤à¯à®°à¯ˆà®•à¯à®•à®µà¯à®®à¯",
    on: "à®‡à®¯à®•à¯à®•à¯",
    off: "à®¨à®¿à®±à¯à®¤à¯à®¤à¯",
    wateringTime: "à®¨à¯€à®°à¯à®ªà¯à®ªà®¾à®¯à¯à®šà¯à®šà®¿ à®¨à¯‡à®°à®®à¯",
    customNotes: "à®¤à®©à®¿à®ªà¯à®ªà®¯à®©à¯ à®•à¯à®±à®¿à®ªà¯à®ªà¯à®•à®³à¯",
    addNote: "à®•à¯à®±à®¿à®ªà¯à®ªà¯ à®šà¯‡à®°à¯",
    summary: "à®šà¯à®°à¯à®•à¯à®•à®®à¯",
    daily: "à®¤à®¿à®©à®šà®°à®¿",
    weekly: "à®µà®¾à®°à®¾à®¨à¯à®¤à®¿à®°",
    notifications: "à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯à®•à®³à¯",
    pushAlerts: "Push à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯à®•à®³à¯",
    pushAlertsInfo: "Browser notification reminders.",
    emailAlerts: "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯à®•à®³à¯",
    emailAlertsInfo: "Save your email reminder preference.",
    testNotification: "à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯ˆ à®šà¯‹à®¤à®¿à®•à¯à®•à®µà¯à®®à¯",
    careMessages: "à®ªà®°à®¾à®®à®°à®¿à®ªà¯à®ªà¯ à®¨à®¿à®©à¯ˆà®µà¯‚à®Ÿà¯à®Ÿà®²à¯ à®šà¯†à®¯à¯à®¤à®¿à®•à®³à¯",
    next: "à®…à®Ÿà¯à®¤à¯à®¤à¯",
    paused: "à®¨à®¿à®±à¯à®¤à¯à®¤à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯",
    liveStatus: "Live status",
    currentTime: "Current time",
    scheduledFor: "Scheduled for",
    quickTimes: "Quick times",
    morning: "Morning",
    midday: "Midday",
    evening: "Evening",
    autoSave: "Every change is saved automatically.",
    timeHint: "Use 24-hour time like 07:00 or 18:30.",
    timeInvalid: "Enter time as HH:MM in 24-hour format.",
    timeSaved: "Reminder time updated.",
    noteRequired: "Add a note first.",
    noteAdded: "Custom reminder added.",
    noteRemoved: "Custom reminder removed.",
    testAdded: "Test reminder added.",
    pushUnsupported: "Push notifications need a development build or production app.",
    pushPermissionDenied: "Push permission is off for this device.",
    activeLabel: "active",
    savedLabel: "saved",
    enabledLabel: "enabled",
    recentLabel: "recent",
    timeFormatPlaceholder: "07:00",
  },
};

const isExpoGo = Constants.executionEnvironment === "storeClient";

function getNotificationsModule() {
  if (isExpoGo) {
    return null;
  }

  try {
    return require("expo-notifications") as typeof import("expo-notifications");
  } catch {
    return null;
  }
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

function getNextReminderDate(time: string, now = new Date()) {
  if (!isValidTime(time)) {
    return null;
  }

  const [hour, minute] = time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

function formatTimeLabel(time: string) {
  if (!isValidTime(time)) {
    return time;
  }

  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatScheduleLabel(target: Date | null, fallback: string) {
  if (!target) {
    return fallback;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const dayDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86400000);
  const timeLabel = target.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (dayDiff === 0) {
    return `Today, ${timeLabel}`;
  }

  if (dayDiff === 1) {
    return `Tomorrow, ${timeLabel}`;
  }

  return `${target.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeLabel}`;
}

function formatActivityMessage(message: string) {
  return `${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${message}`;
}

export function CareReminderScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { languageCode } = useLanguage();
  const copy = careCopy[languageCode] || careCopy.en;
  const [menuOpen, setMenuOpen] = useState(false);
  const [newCustomNote, setNewCustomNote] = useState("");
  const [status, setStatus] = useState("");
  const [liveNow, setLiveNow] = useState(() => Date.now());
  const [wateringTimeInput, setWateringTimeInput] = useState("");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { reminders, setReminders } = useSettings();
  const remindersRef = useRef(reminders);

  useEffect(() => {
    remindersRef.current = reminders;
    setWateringTimeInput(reminders.wateringTime);
  }, [reminders]);

  useEffect(() => {
    const interval = setInterval(() => setLiveNow(Date.now()), 1000);
    return () => clearInterval(interval);
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

  const persistReminders = async (updater: (current: ReminderState) => ReminderState) => {
    const next = updater(remindersRef.current);
    remindersRef.current = next;
    await setReminders(next);
    return next;
  };

  const createReminderMessage = (current: ReminderState) =>
    `Time to water your plant (${formatTimeLabel(current.wateringTime)})`;

  const addInAppMessage = async (message: string) => {
    await persistReminders((current) => ({
      ...current,
      inAppMessages: [{ id: Date.now(), text: formatActivityMessage(message) }, ...current.inAppMessages].slice(0, 6),
    }));
  };

  const ensurePushPermission = async () => {
    if (isExpoGo) {
      showStatus(copy.pushUnsupported);
      return false;
    }

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      showStatus(copy.pushUnsupported);
      return false;
    }

    const currentPermission = await Notifications.getPermissionsAsync();
    if (currentPermission.status === "granted") {
      return true;
    }

    const requestedPermission = await Notifications.requestPermissionsAsync();
    if (requestedPermission.status === "granted") {
      return true;
    }

    showStatus(copy.pushPermissionDenied);
    return false;
  };

  const syncNativeNotification = async (current: ReminderState) => {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!current.options.watering || !current.notifications.push || !isValidTime(current.wateringTime)) {
      return;
    }

    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") {
      return;
    }

    const [hour, minute] = current.wateringTime.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Plant Care Reminder",
        body: createReminderMessage(current),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  };

  useEffect(() => {
    void syncNativeNotification(reminders);
  }, [reminders]);

  const scheduleNextReminder = (current: ReminderState) => {
    if (reminderTimer.current) {
      clearTimeout(reminderTimer.current);
    }

    if (!current.options.watering) {
      return;
    }

    const target = getNextReminderDate(current.wateringTime);
    if (!target) {
      return;
    }

    reminderTimer.current = setTimeout(() => {
      const latest = remindersRef.current;
      void addInAppMessage(createReminderMessage(latest));
      scheduleNextReminder(latest);
    }, target.getTime() - Date.now());
  };

  useEffect(() => {
    scheduleNextReminder(reminders);

    return () => {
      if (reminderTimer.current) {
        clearTimeout(reminderTimer.current);
      }
    };
  }, [reminders]);

  const handleToggleOption = async (key: ReminderOptionKey) => {
    await persistReminders((current) => ({
      ...current,
      options: { ...current.options, [key]: !current.options[key] },
    }));
    showStatus(`${copy[key]} ${copy.on.toLowerCase()} / ${copy.off.toLowerCase()} updated.`);
  };

  const handleToggleNotification = async (type: NotificationType) => {
    const turningOn = !remindersRef.current.notifications[type];

    if (type === "push" && turningOn) {
      const permissionGranted = await ensurePushPermission();
      if (!permissionGranted) {
        return;
      }
    }

    await persistReminders((current) => ({
      ...current,
      notifications: { ...current.notifications, [type]: !current.notifications[type] },
    }));
  };

  const commitWateringTime = async (candidate: string) => {
    const normalized = candidate.trim();
    if (!isValidTime(normalized)) {
      showStatus(copy.timeInvalid);
      setWateringTimeInput(remindersRef.current.wateringTime);
      return;
    }

    await persistReminders((current) => ({
      ...current,
      wateringTime: normalized,
    }));
    showStatus(copy.timeSaved);
  };

  const handlePresetTime = async (time: string) => {
    setWateringTimeInput(time);
    await commitWateringTime(time);
  };

  const addCustomNote = async () => {
    const trimmed = newCustomNote.trim();
    if (!trimmed) {
      showStatus(copy.noteRequired);
      return;
    }

    await persistReminders((current) => ({
      ...current,
      customNotes: [trimmed, ...current.customNotes].slice(0, 8),
    }));
    setNewCustomNote("");
    showStatus(copy.noteAdded);
  };

  const removeCustomNote = async (index: number) => {
    await persistReminders((current) => ({
      ...current,
      customNotes: current.customNotes.filter((_, currentIndex) => currentIndex !== index),
    }));
    showStatus(copy.noteRemoved);
  };

  const sendNotification = async () => {
    const current = remindersRef.current;
    const message = createReminderMessage(current);
    await addInAppMessage(message);

    if (current.notifications.push) {
      const Notifications = getNotificationsModule();
      const permissionGranted = await ensurePushPermission();

      if (permissionGranted && Notifications) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Plant Care Reminder",
            body: message,
          },
          trigger: null,
        });
      }
    }

    showStatus(copy.testAdded);
  };

  const activeTasks = useMemo(
    () => defaultOptions.filter((option) => reminders.options[option.key]).length + reminders.customNotes.length,
    [reminders.customNotes.length, reminders.options]
  );
  const notificationModes = useMemo(
    () => [reminders.notifications.push, reminders.notifications.email].filter(Boolean).length,
    [reminders.notifications.email, reminders.notifications.push]
  );
  const nextReminderDate = useMemo(
    () => (reminders.options.watering ? getNextReminderDate(reminders.wateringTime, new Date(liveNow)) : null),
    [liveNow, reminders.options.watering, reminders.wateringTime]
  );
  const nextReminderLabel = nextReminderDate
    ? formatScheduleLabel(nextReminderDate, copy.paused)
    : copy.paused;
  const liveClockLabel = new Date(liveNow).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: compact ? undefined : "2-digit",
  });

  return (
    <Screen>
      <TopBar title={copy.title} subtitle={copy.subtitle} onMenuPress={() => setMenuOpen(true)} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={[styles.heroCard, compact ? styles.heroCardCompact : null]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="alarm" size={22} color={colors.white} />
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>{copy.liveStatus}</Text>
          </View>
        </View>

        <Text style={styles.heroEyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.heroTitle}>{copy.title}</Text>
        <Text style={styles.heroSubtitle}>{copy.subtitle}</Text>

        <View style={[styles.metricRow, compact ? styles.metricRowCompact : null]}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{activeTasks}</Text>
            <Text style={styles.metricLabel}>{copy.activeTasks}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{notificationModes}</Text>
            <Text style={styles.metricLabel}>{copy.notifications}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue} numberOfLines={1}>
              {reminders.options.watering ? formatTimeLabel(reminders.wateringTime) : copy.paused}
            </Text>
            <Text style={styles.metricLabel}>{copy.next}</Text>
          </View>
        </View>

        <View style={styles.livePanel}>
          <View style={styles.livePanelItem}>
            <Text style={styles.livePanelLabel}>{copy.currentTime}</Text>
            <Text style={styles.livePanelValue}>{liveClockLabel}</Text>
          </View>
          <View style={styles.livePanelDivider} />
          <View style={styles.livePanelItem}>
            <Text style={styles.livePanelLabel}>{copy.scheduledFor}</Text>
            <Text style={styles.livePanelValue}>{nextReminderLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryChip}>{`${copy.mode}: ${reminders.summaryMode}`}</Text>
          <Text style={styles.summaryChip}>{copy.autoSave}</Text>
        </View>
      </View>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
          <Text style={styles.sectionTitle}>{copy.options}</Text>
          <Text style={styles.sectionMeta}>{`${activeTasks} ${copy.activeLabel}`}</Text>
        </View>

        {defaultOptions.map((option) => (
          <View key={option.key} style={styles.optionRow}>
            <View style={styles.optionIconWrap}>
              <MaterialIcons name={option.icon} size={18} color={colors.primaryDark} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{copy[option.titleKey]}</Text>
              <Text style={styles.optionInfo}>{copy[option.infoKey]}</Text>
            </View>
            <Pressable
              accessibilityLabel={`${copy[option.titleKey]} toggle`}
              onPress={() => void handleToggleOption(option.key)}
              style={[
                styles.toggleButton,
                reminders.options[option.key] ? styles.toggleOn : styles.toggleOff,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  reminders.options[option.key] ? styles.toggleTextOn : styles.toggleTextOff,
                ]}
              >
                {reminders.options[option.key] ? copy.on : copy.off}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {reminders.options.watering ? (
        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
            <Text style={styles.sectionTitle}>{copy.wateringTime}</Text>
            <Text style={styles.sectionMeta}>{nextReminderLabel}</Text>
          </View>

          <View style={styles.timeCard}>
            <TextInput
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              placeholder={copy.timeFormatPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.timeInput}
              value={wateringTimeInput}
              onBlur={() => void commitWateringTime(wateringTimeInput)}
              onChangeText={setWateringTimeInput}
            />
            <Pressable
              accessibilityLabel="Save watering time"
              onPress={() => void commitWateringTime(wateringTimeInput)}
              style={styles.timeSaveButton}
            >
              <MaterialIcons name="check" size={18} color={colors.white} />
            </Pressable>
          </View>

          <Text style={styles.helperText}>{copy.timeHint}</Text>

          <View style={styles.presetRow}>
            {quickTimePresets.map((preset) => (
              <Pressable
                key={preset.key}
                onPress={() => void handlePresetTime(preset.time)}
                style={[
                  styles.presetButton,
                  reminders.wateringTime === preset.time ? styles.presetButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    reminders.wateringTime === preset.time ? styles.presetLabelActive : null,
                  ]}
                >
                  {copy[preset.key]}
                </Text>
                <Text
                  style={[
                    styles.presetTime,
                    reminders.wateringTime === preset.time ? styles.presetTimeActive : null,
                  ]}
                >
                  {preset.time}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
          <Text style={styles.sectionTitle}>{copy.customNotes}</Text>
          <Text style={styles.sectionMeta}>{`${reminders.customNotes.length} ${copy.savedLabel}`}</Text>
        </View>

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
            <Pressable
              accessibilityLabel="Remove custom note"
              onPress={() => void removeCustomNote(index)}
              style={styles.trashButton}
            >
              <MaterialIcons name="delete-outline" size={16} color="#B33D68" />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
          <Text style={styles.sectionTitle}>{copy.summary}</Text>
          <Text style={styles.sectionMeta}>{reminders.summaryMode}</Text>
        </View>

        <View style={styles.summaryButtons}>
          <Pressable
            onPress={() =>
              void persistReminders((current) => ({
                ...current,
                summaryMode: "daily",
              }))
            }
            style={[styles.summaryButton, reminders.summaryMode === "daily" ? styles.summaryButtonActive : null]}
          >
            <Text
              style={[
                styles.summaryButtonText,
                reminders.summaryMode === "daily" ? styles.summaryButtonTextActive : null,
              ]}
            >
              {copy.daily}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              void persistReminders((current) => ({
                ...current,
                summaryMode: "weekly",
              }))
            }
            style={[styles.summaryButton, reminders.summaryMode === "weekly" ? styles.summaryButtonActive : null]}
          >
            <Text
              style={[
                styles.summaryButtonText,
                reminders.summaryMode === "weekly" ? styles.summaryButtonTextActive : null,
              ]}
            >
              {copy.weekly}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
          <Text style={styles.sectionTitle}>{copy.notifications}</Text>
          <Text style={styles.sectionMeta}>{`${notificationModes} ${copy.enabledLabel}`}</Text>
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionIconWrap}>
            <MaterialIcons name="notifications-active" size={18} color={colors.primaryDark} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{copy.pushAlerts}</Text>
            <Text style={styles.optionInfo}>{copy.pushAlertsInfo}</Text>
          </View>
          <Pressable
            onPress={() => void handleToggleNotification("push")}
            style={[styles.toggleButton, reminders.notifications.push ? styles.toggleOn : styles.toggleOff]}
          >
            <Text
              style={[
                styles.toggleText,
                reminders.notifications.push ? styles.toggleTextOn : styles.toggleTextOff,
              ]}
            >
              {reminders.notifications.push ? copy.on : copy.off}
            </Text>
          </Pressable>
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionIconWrap}>
            <MaterialIcons name="mail-outline" size={18} color={colors.primaryDark} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{copy.emailAlerts}</Text>
            <Text style={styles.optionInfo}>{copy.emailAlertsInfo}</Text>
          </View>
          <Pressable
            onPress={() => void handleToggleNotification("email")}
            style={[styles.toggleButton, reminders.notifications.email ? styles.toggleOn : styles.toggleOff]}
          >
            <Text
              style={[
                styles.toggleText,
                reminders.notifications.email ? styles.toggleTextOn : styles.toggleTextOff,
              ]}
            >
              {reminders.notifications.email ? copy.on : copy.off}
            </Text>
          </Pressable>
        </View>

        {isExpoGo ? <Text style={styles.helperText}>{copy.pushUnsupported}</Text> : null}

        <Pressable onPress={() => void sendNotification()} style={styles.testButton}>
          <MaterialIcons name="notifications-active" size={16} color={colors.white} />
          <Text style={styles.testButtonText}>{copy.testNotification}</Text>
        </Pressable>
      </View>

      {reminders.inAppMessages.length > 0 ? (
        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
            <Text style={styles.sectionTitle}>{copy.careMessages}</Text>
            <Text style={styles.sectionMeta}>{`${reminders.inAppMessages.length} ${copy.recentLabel}`}</Text>
          </View>

          <View style={styles.messageList}>
            {reminders.inAppMessages.map((message) => (
              <View key={message.id} style={styles.messageBox}>
                <MaterialIcons name="notifications" size={16} color={colors.primaryDark} />
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
  heroCard: {
    backgroundColor: "#584089",
    borderRadius: 28,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroCardCompact: {
    borderRadius: 24,
    padding: spacing.md,
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  liveBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  liveDot: {
    backgroundColor: "#7BFFB5",
    borderRadius: radii.pill,
    height: 8,
    width: 8,
  },
  liveBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
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
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricRowCompact: {
    flexDirection: "column",
  },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    flex: 1,
    minHeight: 82,
    padding: spacing.md,
  },
  metricValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  metricLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  livePanel: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 22,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  livePanelItem: {
    flex: 1,
  },
  livePanelDivider: {
    backgroundColor: "rgba(255,255,255,0.14)",
    height: "100%",
    width: 1,
  },
  livePanelLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  livePanelValue: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
    backgroundColor: "#F6F0FF",
    borderColor: "#DAC8FF",
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  statusText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.soft,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionHeaderCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  optionIconWrap: {
    alignItems: "center",
    backgroundColor: "#EEE6FF",
    borderRadius: 16,
    height: 38,
    justifyContent: "center",
    width: 38,
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
    minWidth: 66,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  toggleOn: {
    backgroundColor: colors.primaryDark,
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
  timeCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  timeInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  timeSaveButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  presetRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  presetButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    flex: 1,
    padding: spacing.md,
  },
  presetButtonActive: {
    backgroundColor: "#E8DFFF",
    borderColor: "#C9B2FF",
    borderWidth: 1,
  },
  presetLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  presetLabelActive: {
    color: colors.primaryDark,
  },
  presetTime: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  presetTimeActive: {
    color: colors.primaryDark,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
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
    backgroundColor: colors.surfaceMuted,
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
    justifyContent: "center",
    minHeight: 48,
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
    alignItems: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  messageText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
