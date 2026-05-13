// Render the mobile Care Reminder screen.
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { AppMenu } from "../components/AppMenu";
import { BottomNav } from "../components/BottomNav";
import { Screen } from "../components/Screen";
import { TopBar } from "../components/TopBar";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { colors, radii, shadows, spacing, viewport } from "../theme/tokens";
import type { ReminderState } from "../types/app";

type LanguageCode = "en" | "si" | "ta" | "es" | "fr" | "ar" | "hi" | "zh";
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
    noteRemoved: "Your custom reminder deleted.",
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
    eyebrow: "Ã Â¶Â´Ã Â·ÂÃ Â¶Â½ Ã Â¶Å¡Ã Â·ÂÃ Â¶Â½Ã Â·Æ’Ã Â¶Â§Ã Â·â€žÃ Â¶Â±",
    title: "Ã Â·Æ’Ã Â·ÂÃ Â¶Â½Ã Â¶Å¡Ã Â·â€™Ã Â¶Â½Ã Â·â€™ Ã Â¶Â¸Ã Â¶Â­Ã Â¶Å¡Ã Â·Å  Ã Â¶Å¡Ã Â·â€™Ã Â¶Â»Ã Â·â€œÃ Â¶Â¸",
    subtitle: "Ã Â¶Â¢Ã Â¶Â½Ã Â¶Âº Ã Â¶Â¯Ã Â·ÂÃ Â¶Â¸Ã Â·â€œÃ Â¶Â¸ Ã Â·Æ’Ã Â·â€ž Ã Â·Æ’Ã Â·ÂÃ Â¶Â½Ã Â¶Å¡Ã Â·â€™Ã Â¶Â½Ã Â·â€™ Ã Â¶Å¡Ã Â·ÂÃ Â¶Â»Ã Â·Å Ã Â¶ÂºÃ Â¶ÂºÃ Â¶Â±Ã Â·Å  Ã Â·Æ’Ã Â·Å Ã Â·â‚¬Ã Â¶ÂºÃ Â¶â€šÃ Â¶Å¡Ã Â·Å Ã¢â‚¬ÂÃ Â¶Â»Ã Â·â€œÃ Â¶ÂºÃ Â·â‚¬ Ã Â·Æ’Ã Â·â€Ã Â¶Â»Ã Â¶Å¡Ã Â·â€™Ã Â¶Â± Ã Â¶Â´Ã Â·â€™Ã Â¶Â»Ã Â·â€™Ã Â·Æ’Ã Â·â€™Ã Â¶Â¯Ã Â·â€ Ã Â¶Â¢Ã Â¶â€šÃ Â¶Å“Ã Â¶Â¸ Ã Â·Æ’Ã Â·ÂÃ Â¶Â½Ã Â·Æ’Ã Â·â€Ã Â¶Â¸Ã Â·Å Ã Â¶Å¡Ã Â¶Â»Ã Â¶Â«Ã Â¶ÂºÃ Â¶Å¡Ã Â·Å  Ã Â·Æ’Ã Â¶Â¸Ã Â¶Å¸ Ã Â·Æ’Ã Â¶â€šÃ Â·â‚¬Ã Â·â€™Ã Â¶Â°Ã Â·ÂÃ Â¶Â±Ã Â¶Âº Ã Â¶Å¡Ã Â¶Â»Ã Â¶Å“Ã Â¶Â±Ã Â·Å Ã Â¶Â±.",
    activeTasks: "Ã Â·Æ’Ã Â¶Å¡Ã Â·Å Ã¢â‚¬ÂÃ Â¶Â»Ã Â·â€™Ã Â¶Âº Ã Â¶Å¡Ã Â·ÂÃ Â¶Â»Ã Â·Å Ã Â¶ÂºÃ Â¶ÂºÃ Â¶Â±Ã Â·Å ",
    mode: "Ã Â¶Å¡Ã Â·Å Ã¢â‚¬ÂÃ Â¶Â»Ã Â¶Â¸Ã Â¶Âº",
    options: "Ã Â·â‚¬Ã Â·â€™Ã Â¶Å¡Ã Â¶Â½Ã Â·Å Ã Â¶Â´",
    watering: "Ã Â¶Â¢Ã Â¶Â½Ã Â¶Âº Ã Â¶Â¯Ã Â·ÂÃ Â¶Â¸Ã Â·â€œÃ Â¶Â¸",
    wateringInfo: "Ã Â¶Â´Ã Â·ÂÃ Â¶Â½Ã Â¶Â§ Ã Â¶Â¢Ã Â¶Â½Ã Â¶Âº Ã Â¶â€¦Ã Â·â‚¬Ã Â·ÂÃ Â·Å Ã¢â‚¬ÂÃ Â¶Âº Ã Â·â‚¬Ã Â·â€™Ã Â¶Â§ Ã Â¶Â¯Ã Â·ÂÃ Â¶Â±Ã Â·â€Ã Â¶Â¸Ã Â·Å  Ã Â¶Â¯Ã Â·â„¢Ã Â¶Â±Ã Â·Å Ã Â¶Â±",
    fertilizing: "Ã Â¶Â´Ã Â·ÂÃ Â·â€šÃ Â¶Å¡ Ã Â¶Â¯Ã Â·ÂÃ Â¶Â¸Ã Â·â€œÃ Â¶Â¸",
    fertilizingInfo: "Ã Â¶Â´Ã Â·ÂÃ Â·â€šÃ Â¶Å¡ Ã Â¶Â¯Ã Â·ÂÃ Â¶Â¸Ã Â·â€™Ã Â¶Âº Ã Â¶ÂºÃ Â·â€Ã Â¶Â­Ã Â·â€ Ã Â·â‚¬Ã Â·Å¡Ã Â¶Â½Ã Â·ÂÃ Â·â‚¬ Ã Â¶Â¸Ã Â¶Â­Ã Â¶Å¡Ã Â·Å  Ã Â¶Å¡Ã Â¶Â»Ã Â¶Â±Ã Â·Å Ã Â¶Â±",
    pruning: "Ã Â¶Å¡Ã Â¶Â´Ã Â·Å Ã Â¶Â´Ã Â·ÂÃ Â¶Â¯Ã Â·â€ Ã Â¶Å¡Ã Â·â€™Ã Â¶Â»Ã Â·â€œÃ Â¶Â¸",
    pruningInfo: "Ã Â¶Å¡Ã Â·ÂÃ Â¶Â´Ã Â·â€œÃ Â¶Â¸ Ã Â·â€žÃ Â·Â Ã Â·â€žÃ Â·ÂÃ Â¶Â©Ã Â¶Å“Ã Â·ÂÃ Â·Æ’Ã Â·Å Ã Â·â‚¬Ã Â·â€œÃ Â¶Â¸ Ã Â·Æ’Ã Â¶Â³Ã Â·â€žÃ Â·Â Ã Â¶â€¡Ã Â¶Å¸Ã Â·â‚¬Ã Â·â€œÃ Â¶Â¸Ã Â·Å ",
    repotting: "Ã Â¶Â±Ã Â·ÂÃ Â·â‚¬Ã Â¶Â­ Ã Â¶Â¶Ã Â¶Â³Ã Â·â€Ã Â¶Â±Ã Â¶Å¡Ã Â¶Â§ Ã Â¶Â¸Ã Â·ÂÃ Â¶Â»Ã Â·â€ Ã Â¶Å¡Ã Â·â€™Ã Â¶Â»Ã Â·â€œÃ Â¶Â¸",
    repottingInfo: "Ã Â¶Â±Ã Â·ÂÃ Â·â‚¬Ã Â¶Â­ Ã Â¶Â¶Ã Â¶Â³Ã Â·â€Ã Â¶Â±Ã Â¶Å¡Ã Â¶Â§ Ã Â¶Â¸Ã Â·ÂÃ Â¶Â»Ã Â·â€ Ã Â¶Å¡Ã Â·â€¦ Ã Â¶ÂºÃ Â·â€Ã Â¶Â­Ã Â·â€ Ã Â·â‚¬Ã Â·Å¡Ã Â¶Â½Ã Â·ÂÃ Â·â‚¬ Ã Â¶Â¸Ã Â¶Â­Ã Â¶Å¡Ã Â·Å  Ã Â¶Å¡Ã Â¶Â»Ã Â¶Â±Ã Â·Å Ã Â¶Â±",
    sunlight: "Ã Â·â€žÃ Â·â€™Ã Â¶Â»Ã Â·â€ Ã Â¶â€˜Ã Â·â€¦Ã Â·â€™Ã Â¶Âº",
    sunlightInfo: "Ã Â·â‚¬Ã Â¶Â©Ã Â·Â Ã Â·â€žÃ Â·Å“Ã Â¶Â³ Ã Â¶â€ Ã Â¶Â½Ã Â·ÂÃ Â¶Å¡Ã Â¶Âº Ã Â·Æ’Ã Â¶Â³Ã Â·â€žÃ Â·Â Ã Â¶Â´Ã Â·ÂÃ Â¶Â½ Ã Â¶Å“Ã Â·â„¢Ã Â¶Â±Ã Â¶ÂºÃ Â·â€˜Ã Â¶Â¸ Ã Â¶ÂºÃ Â·ÂÃ Â¶Â¢Ã Â¶Â±Ã Â·Â Ã Â¶Å¡Ã Â¶Â»Ã Â¶Â±Ã Â·Å Ã Â¶Â±",
    on: "Ã Â·Æ’Ã Â¶Å¡Ã Â·Å Ã¢â‚¬ÂÃ Â¶Â»Ã Â·â€™Ã Â¶Âº",
    off: "Ã Â¶â€¦Ã Â¶Å¡Ã Â·Å Ã¢â‚¬ÂÃ Â¶Â»Ã Â·â€™Ã Â¶Âº",
    wateringTime: "Ã Â¶Â¢Ã Â¶Â½Ã Â¶Âº Ã Â¶Â¯Ã Â·ÂÃ Â¶Â¸Ã Â·â€œÃ Â¶Â¸Ã Â·Å¡ Ã Â·â‚¬Ã Â·Å¡Ã Â¶Â½Ã Â·ÂÃ Â·â‚¬",
    customNotes: "Ã Â¶â€¦Ã Â¶Â·Ã Â·â€™Ã Â¶Â»Ã Â·â€Ã Â¶Â Ã Â·â€™ Ã Â·Æ’Ã Â¶Â§Ã Â·â€žÃ Â¶Â±Ã Â·Å ",
    addNote: "Ã Â·Æ’Ã Â¶Â§Ã Â·â€žÃ Â¶Â± Ã Â¶â€˜Ã Â¶Å¡Ã Â·Å  Ã Â¶Å¡Ã Â¶Â»Ã Â¶Â±Ã Â·Å Ã Â¶Â±",
    summary: "Ã Â·Æ’Ã Â·ÂÃ Â¶Â»Ã Â·ÂÃ Â¶â€šÃ Â·ÂÃ Â¶Âº",
    daily: "Ã Â¶Â¯Ã Â·â€™Ã Â¶Â±Ã Â¶Â´Ã Â¶Â­Ã Â·Â",
    weekly: "Ã Â·Æ’Ã Â¶Â­Ã Â·â€™Ã Â¶Â´Ã Â¶Â­Ã Â·Â",
    notifications: "Ã Â¶Â¯Ã Â·ÂÃ Â¶Â±Ã Â·â€Ã Â¶Â¸Ã Â·Å Ã Â¶Â¯Ã Â·â€œÃ Â¶Â¸Ã Â·Å ",
    pushAlerts: "Push Ã Â¶Â¯Ã Â·ÂÃ Â¶Â±Ã Â·â€Ã Â¶Â¸Ã Â·Å Ã Â¶Â¯Ã Â·â€œÃ Â¶Â¸Ã Â·Å ",
    pushAlertsInfo: "Browser notification reminders.",
    emailAlerts: "Ã Â·â‚¬Ã Â·â€™Ã Â¶Â¯Ã Â·Å Ã¢â‚¬ÂÃ Â¶ÂºÃ Â·â€Ã Â¶Â­Ã Â·Å  Ã Â¶Â­Ã Â·ÂÃ Â¶Â´Ã Â·ÂÃ Â¶Â½Ã Â·Å  Ã Â¶Â¯Ã Â·ÂÃ Â¶Â±Ã Â·â€Ã Â¶Â¸Ã Â·Å Ã Â¶Â¯Ã Â·â€œÃ Â¶Â¸Ã Â·Å ",
    emailAlertsInfo: "Save your email reminder preference.",
    testNotification: "Ã Â¶Â¯Ã Â·ÂÃ Â¶Â±Ã Â·â€Ã Â¶Â¸Ã Â·Å Ã Â¶Â¯Ã Â·â€œÃ Â¶Â¸ Ã Â¶Â´Ã Â¶Â»Ã Â·â€œÃ Â¶Å¡Ã Â·Å Ã Â·â€šÃ Â·Â Ã Â¶Å¡Ã Â¶Â»Ã Â¶Â±Ã Â·Å Ã Â¶Â±",
    careMessages: "Ã Â·Æ’Ã Â·ÂÃ Â¶Â½Ã Â¶Å¡Ã Â·â€™Ã Â¶Â½Ã Â·â€™ Ã Â¶Â¸Ã Â¶Â­Ã Â¶Å¡Ã Â·Å  Ã Â¶Å¡Ã Â·â€™Ã Â¶Â»Ã Â·â€œÃ Â¶Â¸Ã Â·Å¡ Ã Â¶Â´Ã Â¶Â«Ã Â·â€™Ã Â·â‚¬Ã Â·â€™Ã Â¶Â©",
    next: "Ã Â¶Å Ã Â·â€¦Ã Â¶Å¸",
    paused: "Ã Â¶Â±Ã Â·â‚¬Ã Â¶Â­Ã Â·Â Ã Â¶â€¡Ã Â¶Â­",
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
    noteRemoved: "Your custom reminder deleted.",
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
    eyebrow: "Ã Â®Å¡Ã Â¯â€ Ã Â®Å¸Ã Â®Â¿ Ã Â®â€¦Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®ÂµÃ Â®Â£Ã Â¯Ë†",
    title: "Ã Â®ÂªÃ Â®Â°Ã Â®Â¾Ã Â®Â®Ã Â®Â°Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯Â Ã Â®Â¨Ã Â®Â¿Ã Â®Â©Ã Â¯Ë†Ã Â®ÂµÃ Â¯â€šÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â²Ã Â¯Â",
    subtitle: "Ã Â®Â¤Ã Â®Â¾Ã Â®Â©Ã Â®Â¾Ã Â®â€¢ Ã Â®Å¡Ã Â¯â€¡Ã Â®Â®Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®Å¡Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â®Ã Â®Â¾Ã Â®Â© Ã Â®Â®Ã Â¯Å Ã Â®ÂªÃ Â¯Ë†Ã Â®Â²Ã Â¯Â Ã Â®Â¤Ã Â®Â¿Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â®Ã Â®Â¿Ã Â®Å¸Ã Â®Â²Ã Â¯ÂÃ Â®Å¸Ã Â®Â©Ã Â¯Â Ã Â®Â¨Ã Â¯â‚¬Ã Â®Â°Ã Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Â¯Ã Â¯ÂÃ Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â®Â¿ Ã Â®Â®Ã Â®Â±Ã Â¯ÂÃ Â®Â±Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®ÂªÃ Â®Â°Ã Â®Â¾Ã Â®Â®Ã Â®Â°Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯Â Ã Â®ÂªÃ Â®Â£Ã Â®Â¿Ã Â®â€¢Ã Â®Â³Ã Â¯Ë† Ã Â®â€™Ã Â®Â´Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Â.",
    activeTasks: "Ã Â®Å¡Ã Â¯â€ Ã Â®Â¯Ã Â®Â²Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®â€°Ã Â®Â³Ã Â¯ÂÃ Â®Â³ Ã Â®ÂªÃ Â®Â£Ã Â®Â¿Ã Â®â€¢Ã Â®Â³Ã Â¯Â",
    mode: "Ã Â®Â®Ã Â¯ÂÃ Â®Â±Ã Â¯Ë†",
    options: "Ã Â®ÂµÃ Â®Â¿Ã Â®Â°Ã Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
    watering: "Ã Â®Â¨Ã Â¯â‚¬Ã Â®Â°Ã Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Â¯Ã Â¯ÂÃ Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â®Â¿",
    wateringInfo: "Ã Â®Å¡Ã Â¯â€ Ã Â®Å¸Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯Â Ã Â®Â¨Ã Â¯â‚¬Ã Â®Â°Ã Â¯Â Ã Â®Â¤Ã Â¯â€¡Ã Â®ÂµÃ Â¯Ë†Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®ÂªÃ Â¯â€¹Ã Â®Â¤Ã Â¯Â Ã Â®â€¦Ã Â®Â±Ã Â®Â¿Ã Â®ÂµÃ Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â",
    fertilizing: "Ã Â®â€°Ã Â®Â°Ã Â®Â®Ã Â¯Â Ã Â®â€¡Ã Â®Å¸Ã Â¯ÂÃ Â®Â¤Ã Â®Â²Ã Â¯Â",
    fertilizingInfo: "Ã Â®Å½Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯â€¹Ã Â®Â¤Ã Â¯Â Ã Â®â€°Ã Â®Â°Ã Â®Â®Ã Â¯Â Ã Â®â€¡Ã Â®Å¸ Ã Â®ÂµÃ Â¯â€¡Ã Â®Â£Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®Å½Ã Â®Â©Ã Â¯ÂÃ Â®Â±Ã Â¯Â Ã Â®Â¨Ã Â®Â¿Ã Â®Â©Ã Â¯Ë†Ã Â®ÂµÃ Â¯â€šÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â",
    pruning: "Ã Â®â€¢Ã Â®Â¿Ã Â®Â³Ã Â¯Ë†Ã Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â¯ÂÃ Â®Â±Ã Â¯ÂÃ Â®Â±Ã Â¯Â",
    pruningInfo: "Ã Â®ÂµÃ Â¯â€ Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Â¤Ã Â®Â²Ã Â¯Â Ã Â®Â®Ã Â®Â±Ã Â¯ÂÃ Â®Â±Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®ÂµÃ Â®Å¸Ã Â®Â¿Ã Â®ÂµÃ Â®Â®Ã Â¯Ë†Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¿Ã Â®Â±Ã Â¯ÂÃ Â®â€¢Ã Â®Â¾Ã Â®Â© Ã Â®â€¦Ã Â®Â±Ã Â®Â¿Ã Â®ÂµÃ Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
    repotting: "Ã Â®Â®Ã Â®Â±Ã Â¯Â Ã Â®Â¨Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â®Ã Â¯Â",
    repottingInfo: "Ã Â®Å½Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯â€¹Ã Â®Â¤Ã Â¯Â Ã Â®Â®Ã Â¯â‚¬Ã Â®Â£Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®Â¨Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â®Ã Â¯Â Ã Â®Å¡Ã Â¯â€ Ã Â®Â¯Ã Â¯ÂÃ Â®Â¯ Ã Â®ÂµÃ Â¯â€¡Ã Â®Â£Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®Å½Ã Â®Â©Ã Â¯ÂÃ Â®Â±Ã Â¯Â Ã Â®Â¨Ã Â®Â¿Ã Â®Â©Ã Â¯Ë†Ã Â®ÂµÃ Â¯â€šÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â",
    sunlight: "Ã Â®Å¡Ã Â¯â€šÃ Â®Â°Ã Â®Â¿Ã Â®Â¯ Ã Â®â€™Ã Â®Â³Ã Â®Â¿",
    sunlightInfo: "Ã Â®Å¡Ã Â®Â¿Ã Â®Â±Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤ Ã Â®â€™Ã Â®Â³Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¾Ã Â®â€¢ Ã Â®Å¡Ã Â¯â€ Ã Â®Å¸Ã Â®Â¿Ã Â®â€¢Ã Â®Â³Ã Â¯Ë† Ã Â®Â¨Ã Â®â€¢Ã Â®Â°Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤ Ã Â®ÂªÃ Â®Â°Ã Â®Â¿Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â°Ã Â¯Ë†Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â",
    on: "Ã Â®â€¡Ã Â®Â¯Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯Â",
    off: "Ã Â®Â¨Ã Â®Â¿Ã Â®Â±Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Â",
    wateringTime: "Ã Â®Â¨Ã Â¯â‚¬Ã Â®Â°Ã Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Â¯Ã Â¯ÂÃ Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â®Â¿ Ã Â®Â¨Ã Â¯â€¡Ã Â®Â°Ã Â®Â®Ã Â¯Â",
    customNotes: "Ã Â®Â¤Ã Â®Â©Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¯Ã Â®Â©Ã Â¯Â Ã Â®â€¢Ã Â¯ÂÃ Â®Â±Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
    addNote: "Ã Â®â€¢Ã Â¯ÂÃ Â®Â±Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯Â Ã Â®Å¡Ã Â¯â€¡Ã Â®Â°Ã Â¯Â",
    summary: "Ã Â®Å¡Ã Â¯ÂÃ Â®Â°Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â®Ã Â¯Â",
    daily: "Ã Â®Â¤Ã Â®Â¿Ã Â®Â©Ã Â®Å¡Ã Â®Â°Ã Â®Â¿",
    weekly: "Ã Â®ÂµÃ Â®Â¾Ã Â®Â°Ã Â®Â¾Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â°",
    notifications: "Ã Â®â€¦Ã Â®Â±Ã Â®Â¿Ã Â®ÂµÃ Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
    pushAlerts: "Push Ã Â®â€¦Ã Â®Â±Ã Â®Â¿Ã Â®ÂµÃ Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
    pushAlertsInfo: "Browser notification reminders.",
    emailAlerts: "Ã Â®Â®Ã Â®Â¿Ã Â®Â©Ã Â¯ÂÃ Â®Â©Ã Â®Å¾Ã Â¯ÂÃ Â®Å¡Ã Â®Â²Ã Â¯Â Ã Â®â€¦Ã Â®Â±Ã Â®Â¿Ã Â®ÂµÃ Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â",
    emailAlertsInfo: "Save your email reminder preference.",
    testNotification: "Ã Â®â€¦Ã Â®Â±Ã Â®Â¿Ã Â®ÂµÃ Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯Ë† Ã Â®Å¡Ã Â¯â€¹Ã Â®Â¤Ã Â®Â¿Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â",
    careMessages: "Ã Â®ÂªÃ Â®Â°Ã Â®Â¾Ã Â®Â®Ã Â®Â°Ã Â®Â¿Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯Â Ã Â®Â¨Ã Â®Â¿Ã Â®Â©Ã Â¯Ë†Ã Â®ÂµÃ Â¯â€šÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â²Ã Â¯Â Ã Â®Å¡Ã Â¯â€ Ã Â®Â¯Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®â€¢Ã Â®Â³Ã Â¯Â",
    next: "Ã Â®â€¦Ã Â®Å¸Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Â",
    paused: "Ã Â®Â¨Ã Â®Â¿Ã Â®Â±Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â¤Ã Â¯Â",
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
    noteRemoved: "Your custom reminder deleted.",
    testAdded: "Test reminder added.",
    pushUnsupported: "Push notifications need a development build or production app.",
    pushPermissionDenied: "Push permission is off for this device.",
    activeLabel: "active",
    savedLabel: "saved",
    enabledLabel: "enabled",
    recentLabel: "recent",
    timeFormatPlaceholder: "07:00",
  },
  es: {
    eyebrow: "Plan de plantas",
    title: "Recordatorio de cuidado",
    subtitle: "Organiza riego y tareas de cuidado con un plan limpio que se actualiza en vivo y se guarda automaticamente.",
    activeTasks: "Tareas activas",
    mode: "Modo",
    options: "Opciones",
    watering: "Riego",
    wateringInfo: "Avisa cuando la planta necesite agua",
    fertilizing: "Fertilizacion",
    fertilizingInfo: "Recuerda cuando toca fertilizar",
    pruning: "Poda",
    pruningInfo: "Alertas para recortar y dar forma",
    repotting: "Trasplante",
    repottingInfo: "Recuerda cuando toca trasplantar",
    sunlight: "Luz solar",
    sunlightInfo: "Sugiere mover la planta para mejorar la luz",
    on: "Activo",
    off: "Pausado",
    wateringTime: "Hora de riego",
    customNotes: "Notas personalizadas",
    addNote: "Agregar nota",
    summary: "Resumen",
    daily: "Diario",
    weekly: "Semanal",
    notifications: "Notificaciones",
    pushAlerts: "Alertas push",
    pushAlertsInfo: "Programa recordatorios del dispositivo para tu rutina de riego.",
    emailAlerts: "Alertas por correo",
    emailAlertsInfo: "Guarda tu preferencia de recordatorios por correo para integrarla mas adelante.",
    testNotification: "Enviar recordatorio de prueba",
    careMessages: "Actividad reciente",
    next: "Siguiente",
    paused: "Pausado",
    liveStatus: "Estado en vivo",
    currentTime: "Hora actual",
    scheduledFor: "Programado para",
    quickTimes: "Horarios rapidos",
    morning: "Manana",
    midday: "Mediodia",
    evening: "Tarde",
    autoSave: "Cada cambio se guarda automaticamente.",
    timeHint: "Usa formato de 24 horas como 07:00 o 18:30 para recordatorios diarios confiables.",
    timeInvalid: "Introduce la hora como HH:MM en formato de 24 horas.",
    timeSaved: "Hora del recordatorio actualizada.",
    noteRequired: "Agrega primero una nota.",
    noteAdded: "Recordatorio personalizado agregado.",
    noteRemoved: "Tu recordatorio personalizado fue eliminado.",
    testAdded: "Recordatorio de prueba agregado.",
    pushUnsupported: "Las notificaciones push requieren una compilacion de desarrollo o la app publicada.",
    pushPermissionDenied: "Las notificaciones push estan desactivadas en este dispositivo.",
    activeLabel: "activas",
    savedLabel: "guardadas",
    enabledLabel: "activas",
    recentLabel: "recientes",
    timeFormatPlaceholder: "07:00",
  },
  fr: {
    eyebrow: "Planning vegetal",
    title: "Rappel d'entretien",
    subtitle: "Gardez l'arrosage et les taches de soin bien organises avec un planning clair, en direct et enregistre automatiquement.",
    activeTasks: "Taches actives",
    mode: "Mode",
    options: "Options",
    watering: "Arrosage",
    wateringInfo: "Alerte quand la plante a besoin d'eau",
    fertilizing: "Fertilisation",
    fertilizingInfo: "Rappelle quand fertiliser",
    pruning: "Taille",
    pruningInfo: "Alertes pour tailler et mettre en forme",
    repotting: "Rempotage",
    repottingInfo: "Rappelle quand rempoter",
    sunlight: "Lumiere",
    sunlightInfo: "Suggere de deplacer les plantes pour une meilleure lumiere",
    on: "Active",
    off: "Pause",
    wateringTime: "Heure d'arrosage",
    customNotes: "Notes personnalisees",
    addNote: "Ajouter une note",
    summary: "Resume",
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    notifications: "Notifications",
    pushAlerts: "Alertes push",
    pushAlertsInfo: "Planifie des rappels sur l'appareil pour votre routine d'arrosage.",
    emailAlerts: "Alertes e-mail",
    emailAlertsInfo: "Enregistrez votre preference de rappel par e-mail pour une integration future.",
    testNotification: "Envoyer un rappel de test",
    careMessages: "Activite recente",
    next: "Prochain",
    paused: "En pause",
    liveStatus: "Statut en direct",
    currentTime: "Heure actuelle",
    scheduledFor: "Prevu pour",
    quickTimes: "Horaires rapides",
    morning: "Matin",
    midday: "Midi",
    evening: "Soir",
    autoSave: "Chaque changement est enregistre automatiquement.",
    timeHint: "Utilisez un format 24 h comme 07:00 ou 18:30 pour des rappels fiables.",
    timeInvalid: "Saisissez l'heure au format HH:MM sur 24 heures.",
    timeSaved: "Heure du rappel mise a jour.",
    noteRequired: "Ajoutez d'abord une note.",
    noteAdded: "Rappel personnalise ajoute.",
    noteRemoved: "Votre rappel personnalise a ete supprime.",
    testAdded: "Rappel de test ajoute.",
    pushUnsupported: "Les notifications push necessitent une version de developpement ou l'application publiee.",
    pushPermissionDenied: "Les notifications push sont desactivees sur cet appareil.",
    activeLabel: "actives",
    savedLabel: "enregistrees",
    enabledLabel: "actives",
    recentLabel: "recentes",
    timeFormatPlaceholder: "07:00",
  },
  ar: {
    eyebrow: "Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ù†Ø¨Ø§Øª",
    title: "ØªØ°ÙƒÙŠØ± Ø¨Ø§Ù„Ø¹Ù†Ø§ÙŠØ©",
    subtitle: "Ù†Ø¸Ù‘Ù… Ø§Ù„Ø±ÙŠ ÙˆÙ…Ù‡Ø§Ù… Ø§Ù„Ø¹Ù†Ø§ÙŠØ© Ø¹Ø¨Ø± Ù…Ø®Ø·Ø· ÙˆØ§Ø¶Ø­ ÙŠØªØ­Ø¯Ø« Ù…Ø¨Ø§Ø´Ø±Ø© ÙˆÙŠØ­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹.",
    activeTasks: "Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ù†Ø´Ø·Ø©",
    mode: "Ø§Ù„ÙˆØ¶Ø¹",
    options: "Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª",
    watering: "Ø§Ù„Ø±ÙŠ",
    wateringInfo: "Ø£Ø±Ø³Ù„ ØªÙ†Ø¨ÙŠÙ‡Ø§Ù‹ Ø¹Ù†Ø¯Ù…Ø§ ÙŠØ­ØªØ§Ø¬ Ø§Ù„Ù†Ø¨Ø§Øª Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø§Ø¡",
    fertilizing: "Ø§Ù„ØªØ³Ù…ÙŠØ¯",
    fertilizingInfo: "Ø°ÙƒÙ‘Ø±Ù†ÙŠ Ø¨Ù…ÙˆØ¹Ø¯ Ø§Ù„ØªØ³Ù…ÙŠØ¯",
    pruning: "Ø§Ù„ØªÙ‚Ù„ÙŠÙ…",
    pruningInfo: "ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù„Ù„Ù‚Øµ ÙˆØ§Ù„ØªØ´ÙƒÙŠÙ„",
    repotting: "Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø²Ø±Ø§Ø¹Ø©",
    repottingInfo: "Ø°ÙƒÙ‘Ø±Ù†ÙŠ Ø¨Ù…ÙˆØ¹Ø¯ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø²Ø±Ø§Ø¹Ø©",
    sunlight: "Ø¶ÙˆØ¡ Ø§Ù„Ø´Ù…Ø³",
    sunlightInfo: "Ø§Ù‚ØªØ±Ø­ Ù†Ù‚Ù„ Ø§Ù„Ù†Ø¨Ø§ØªØ§Øª Ù„ØªØ­Ø³ÙŠÙ† Ø§Ù„Ø¶ÙˆØ¡",
    on: "Ù…ÙØ¹Ù„",
    off: "Ù…ØªÙˆÙ‚Ù",
    wateringTime: "ÙˆÙ‚Øª Ø§Ù„Ø±ÙŠ",
    customNotes: "Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ù…Ø®ØµØµØ©",
    addNote: "Ø¥Ø¶Ø§ÙØ© Ù…Ù„Ø§Ø­Ø¸Ø©",
    summary: "Ø§Ù„Ù…Ù„Ø®Øµ",
    daily: "ÙŠÙˆÙ…ÙŠ",
    weekly: "Ø£Ø³Ø¨ÙˆØ¹ÙŠ",
    notifications: "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª",
    pushAlerts: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙÙˆØ±ÙŠØ©",
    pushAlertsInfo: "Ø¬Ø¯ÙˆÙ„Ø© ØªØ°ÙƒÙŠØ±Ø§Øª Ø§Ù„Ø¬Ù‡Ø§Ø² Ù„Ø±ÙˆØªÙŠÙ† Ø§Ù„Ø±ÙŠ Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ.",
    emailAlerts: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø¨Ø±ÙŠØ¯",
    emailAlertsInfo: "Ø§Ø­ÙØ¸ ØªÙØ¶ÙŠÙ„ ØªØ°ÙƒÙŠØ±Ø§Øª Ø§Ù„Ø¨Ø±ÙŠØ¯ Ù„Ø¯Ù…Ø¬Ù‡ Ù„Ø§Ø­Ù‚Ø§Ù‹.",
    testNotification: "Ø¥Ø±Ø³Ø§Ù„ ØªØ°ÙƒÙŠØ± ØªØ¬Ø±ÙŠØ¨ÙŠ",
    careMessages: "Ø§Ù„Ù†Ø´Ø§Ø· Ø§Ù„Ø£Ø®ÙŠØ±",
    next: "Ø§Ù„ØªØ§Ù„ÙŠ",
    paused: "Ù…ØªÙˆÙ‚Ù",
    liveStatus: "Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©",
    currentTime: "Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ø­Ø§Ù„ÙŠ",
    scheduledFor: "Ù…Ø¬Ø¯ÙˆÙ„ Ø¹Ù†Ø¯",
    quickTimes: "Ø£ÙˆÙ‚Ø§Øª Ø³Ø±ÙŠØ¹Ø©",
    morning: "Ø§Ù„ØµØ¨Ø§Ø­",
    midday: "Ø§Ù„Ø¸Ù‡ÙŠØ±Ø©",
    evening: "Ø§Ù„Ù…Ø³Ø§Ø¡",
    autoSave: "ÙŠØªÙ… Ø­ÙØ¸ ÙƒÙ„ ØªØºÙŠÙŠØ± ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹.",
    timeHint: "Ø§Ø³ØªØ®Ø¯Ù… ØªÙ†Ø³ÙŠÙ‚ 24 Ø³Ø§Ø¹Ø© Ù…Ø«Ù„ 07:00 Ø£Ùˆ 18:30 Ù„ØªØ°ÙƒÙŠØ±Ø§Øª ÙŠÙˆÙ…ÙŠØ© Ø¯Ù‚ÙŠÙ‚Ø©.",
    timeInvalid: "Ø£Ø¯Ø®Ù„ Ø§Ù„ÙˆÙ‚Øª Ø¨ØµÙŠØºØ© HH:MM Ø¨Ù†Ø¸Ø§Ù… 24 Ø³Ø§Ø¹Ø©.",
    timeSaved: "ØªÙ… ØªØ­Ø¯ÙŠØ« ÙˆÙ‚Øª Ø§Ù„ØªØ°ÙƒÙŠØ±.",
    noteRequired: "Ø£Ø¶Ù Ù…Ù„Ø§Ø­Ø¸Ø© Ø£ÙˆÙ„Ø§Ù‹.",
    noteAdded: "ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© ØªØ°ÙƒÙŠØ± Ù…Ø®ØµØµ.",
    noteRemoved: "ØªÙ… Ø­Ø°Ù Ø§Ù„ØªØ°ÙƒÙŠØ± Ø§Ù„Ù…Ø®ØµØµ.",
    testAdded: "ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© ØªØ°ÙƒÙŠØ± ØªØ¬Ø±ÙŠØ¨ÙŠ.",
    pushUnsupported: "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„ÙÙˆØ±ÙŠØ© ØªØ­ØªØ§Ø¬ Ø¥Ù„Ù‰ Ù†Ø³Ø®Ø© ØªØ·ÙˆÙŠØ± Ø£Ùˆ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…Ù†Ø´ÙˆØ±.",
    pushPermissionDenied: "Ø¥Ø°Ù† Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„ÙÙˆØ±ÙŠØ© Ù…Ø¹Ø·Ù„ Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø².",
    activeLabel: "Ù†Ø´Ø·Ø©",
    savedLabel: "Ù…Ø­ÙÙˆØ¸Ø©",
    enabledLabel: "Ù…ÙØ¹Ù„Ø©",
    recentLabel: "Ø­Ø¯ÙŠØ«Ø©",
    timeFormatPlaceholder: "07:00",
  },
  hi: {
    eyebrow: "à¤ªà¥Œà¤§à¤¾ à¤¶à¥‡à¤¡à¥à¤¯à¥‚à¤²",
    title: "à¤¦à¥‡à¤–à¤­à¤¾à¤² à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤°",
    subtitle: "à¤ªà¤¾à¤¨à¥€ à¤¦à¥‡à¤¨à¥‡ à¤”à¤° à¤¦à¥‡à¤–à¤­à¤¾à¤² à¤•à¥‡ à¤•à¤¾à¤®à¥‹à¤‚ à¤•à¥‹ à¤¸à¤¾à¤« à¤ªà¥à¤²à¤¾à¤¨à¤° à¤®à¥‡à¤‚ à¤µà¥à¤¯à¤µà¤¸à¥à¤¥à¤¿à¤¤ à¤°à¤–à¥‡à¤‚ à¤œà¥‹ à¤°à¥€à¤¯à¤² à¤Ÿà¤¾à¤‡à¤® à¤®à¥‡à¤‚ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¹à¥‹à¤¤à¤¾ à¤¹à¥ˆ à¤”à¤° à¤…à¤ªà¤¨à¥‡ à¤†à¤ª à¤¸à¥‡à¤µ à¤¹à¥‹ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆà¥¤",
    activeTasks: "à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤¾à¤°à¥à¤¯",
    mode: "à¤®à¥‹à¤¡",
    options: "à¤µà¤¿à¤•à¤²à¥à¤ª",
    watering: "à¤ªà¤¾à¤¨à¥€ à¤¦à¥‡à¤¨à¤¾",
    wateringInfo: "à¤œà¤¬ à¤ªà¥Œà¤§à¥‡ à¤•à¥‹ à¤ªà¤¾à¤¨à¥€ à¤šà¤¾à¤¹à¤¿à¤ à¤¤à¤¬ à¤¸à¥‚à¤šà¤¿à¤¤ à¤•à¤°à¥‡à¤‚",
    fertilizing: "à¤–à¤¾à¤¦ à¤¦à¥‡à¤¨à¤¾",
    fertilizingInfo: "à¤•à¤¬ à¤–à¤¾à¤¦ à¤¦à¥‡à¤¨à¥€ à¤¹à¥ˆ à¤¯à¤¹ à¤¯à¤¾à¤¦ à¤¦à¤¿à¤²à¤¾à¤à¤‚",
    pruning: "à¤›à¤‚à¤Ÿà¤¾à¤ˆ",
    pruningInfo: "à¤•à¤¾à¤Ÿà¤¨à¥‡ à¤”à¤° à¤†à¤•à¤¾à¤° à¤¦à¥‡à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤…à¤²à¤°à¥à¤Ÿ",
    repotting: "à¤¦à¥‹à¤¬à¤¾à¤°à¤¾ à¤—à¤®à¤²à¤¾ à¤¬à¤¦à¤²à¤¨à¤¾",
    repottingInfo: "à¤•à¤¬ à¤¦à¥‹à¤¬à¤¾à¤°à¤¾ à¤—à¤®à¤²à¤¾ à¤¬à¤¦à¤²à¤¨à¤¾ à¤¹à¥ˆ à¤¯à¤¹ à¤¯à¤¾à¤¦ à¤¦à¤¿à¤²à¤¾à¤à¤‚",
    sunlight: "à¤§à¥‚à¤ª",
    sunlightInfo: "à¤¬à¥‡à¤¹à¤¤à¤° à¤°à¥‹à¤¶à¤¨à¥€ à¤•à¥‡ à¤²à¤¿à¤ à¤ªà¥Œà¤§à¥‹à¤‚ à¤•à¥‹ à¤¸à¥à¤¥à¤¾à¤¨ à¤¬à¤¦à¤²à¤¨à¥‡ à¤•à¤¾ à¤¸à¥à¤à¤¾à¤µ à¤¦à¥‡à¤‚",
    on: "à¤šà¤¾à¤²à¥‚",
    off: "à¤¬à¤‚à¤¦",
    wateringTime: "à¤ªà¤¾à¤¨à¥€ à¤¦à¥‡à¤¨à¥‡ à¤•à¤¾ à¤¸à¤®à¤¯",
    customNotes: "à¤•à¤¸à¥à¤Ÿà¤® à¤¨à¥‹à¤Ÿà¥à¤¸",
    addNote: "à¤¨à¥‹à¤Ÿ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚",
    summary: "à¤¸à¤¾à¤°à¤¾à¤‚à¤¶",
    daily: "à¤¦à¥ˆà¤¨à¤¿à¤•",
    weekly: "à¤¸à¤¾à¤ªà¥à¤¤à¤¾à¤¹à¤¿à¤•",
    notifications: "à¤¸à¥‚à¤šà¤¨à¤¾à¤à¤‚",
    pushAlerts: "à¤ªà¥à¤¶ à¤…à¤²à¤°à¥à¤Ÿ",
    pushAlertsInfo: "à¤†à¤ªà¤•à¥€ à¤ªà¤¾à¤¨à¥€ à¤¦à¥‡à¤¨à¥‡ à¤•à¥€ à¤¦à¤¿à¤¨à¤šà¤°à¥à¤¯à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤¡à¤¿à¤µà¤¾à¤‡à¤¸ à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤° à¤¸à¥‡à¤Ÿ à¤•à¤°à¥‡à¤‚à¥¤",
    emailAlerts: "à¤ˆà¤®à¥‡à¤² à¤…à¤²à¤°à¥à¤Ÿ",
    emailAlertsInfo: "à¤­à¤µà¤¿à¤·à¥à¤¯ à¤•à¥‡ à¤à¤•à¥€à¤•à¤°à¤£ à¤•à¥‡ à¤²à¤¿à¤ à¤ˆà¤®à¥‡à¤² à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤° à¤ªà¤¸à¤‚à¤¦ à¤¸à¤¹à¥‡à¤œà¥‡à¤‚à¥¤",
    testNotification: "à¤Ÿà¥‡à¤¸à¥à¤Ÿ à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤° à¤­à¥‡à¤œà¥‡à¤‚",
    careMessages: "à¤¹à¤¾à¤² à¤•à¥€ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿",
    next: "à¤…à¤—à¤²à¤¾",
    paused: "à¤°à¥à¤•à¤¾ à¤¹à¥à¤†",
    liveStatus: "à¤²à¤¾à¤‡à¤µ à¤¸à¥à¤¥à¤¿à¤¤à¤¿",
    currentTime: "à¤µà¤°à¥à¤¤à¤®à¤¾à¤¨ à¤¸à¤®à¤¯",
    scheduledFor: "à¤¨à¤¿à¤¯à¤¤ à¤¸à¤®à¤¯",
    quickTimes: "à¤¤à¥à¤µà¤°à¤¿à¤¤ à¤¸à¤®à¤¯",
    morning: "à¤¸à¥à¤¬à¤¹",
    midday: "à¤¦à¥‹à¤ªà¤¹à¤°",
    evening: "à¤¶à¤¾à¤®",
    autoSave: "à¤¹à¤° à¤¬à¤¦à¤²à¤¾à¤µ à¤…à¤ªà¤¨à¥‡ à¤†à¤ª à¤¸à¥‡à¤µ à¤¹à¥‹ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆà¥¤",
    timeHint: "à¤µà¤¿à¤¶à¥à¤µà¤¸à¤¨à¥€à¤¯ à¤¦à¥ˆà¤¨à¤¿à¤• à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤° à¤•à¥‡ à¤²à¤¿à¤ 24-à¤˜à¤‚à¤Ÿà¥‡ à¤•à¤¾ à¤¸à¤®à¤¯ à¤œà¥ˆà¤¸à¥‡ 07:00 à¤¯à¤¾ 18:30 à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤°à¥‡à¤‚à¥¤",
    timeInvalid: "à¤¸à¤®à¤¯ HH:MM à¤•à¥‡ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ 24-à¤˜à¤‚à¤Ÿà¥‡ à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚à¥¤",
    timeSaved: "à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤° à¤¸à¤®à¤¯ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¹à¥‹ à¤—à¤¯à¤¾à¥¤",
    noteRequired: "à¤ªà¤¹à¤²à¥‡ à¤à¤• à¤¨à¥‹à¤Ÿ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚à¥¤",
    noteAdded: "à¤•à¤¸à¥à¤Ÿà¤® à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤° à¤œà¥‹à¤¡à¤¼ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾à¥¤",
    noteRemoved: "à¤†à¤ªà¤•à¤¾ à¤•à¤¸à¥à¤Ÿà¤® à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤° à¤¹à¤Ÿà¤¾ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾à¥¤",
    testAdded: "à¤Ÿà¥‡à¤¸à¥à¤Ÿ à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤° à¤œà¥‹à¤¡à¤¼ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾à¥¤",
    pushUnsupported: "à¤ªà¥à¤¶ à¤¨à¥‹à¤Ÿà¤¿à¤«à¤¿à¤•à¥‡à¤¶à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤¡à¥‡à¤µà¤²à¤ªà¤®à¥‡à¤‚à¤Ÿ à¤¬à¤¿à¤²à¥à¤¡ à¤¯à¤¾ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤à¤ª à¤šà¤¾à¤¹à¤¿à¤à¥¤",
    pushPermissionDenied: "à¤‡à¤¸ à¤¡à¤¿à¤µà¤¾à¤‡à¤¸ à¤ªà¤° à¤ªà¥à¤¶ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¬à¤‚à¤¦ à¤¹à¥ˆà¥¤",
    activeLabel: "à¤¸à¤•à¥à¤°à¤¿à¤¯",
    savedLabel: "à¤¸à¤¹à¥‡à¤œà¥‡ à¤—à¤",
    enabledLabel: "à¤¸à¤•à¥à¤·à¤®",
    recentLabel: "à¤¹à¤¾à¤² à¤•à¥‡",
    timeFormatPlaceholder: "07:00",
  },
  zh: {
    eyebrow: "æ¤ç‰©æ—¥ç¨‹",
    title: "å…»æŠ¤æé†’",
    subtitle: "ç”¨ä¸€ä¸ªæ¸…æ™°çš„è®¡åˆ’é¢æ¿ç®¡ç†æµ‡æ°´ä¸Žå…»æŠ¤ä»»åŠ¡ï¼Œå†…å®¹ä¼šå®žæ—¶æ›´æ–°å¹¶è‡ªåŠ¨ä¿å­˜ã€‚",
    activeTasks: "æ´»è·ƒä»»åŠ¡",
    mode: "æ¨¡å¼",
    options: "é€‰é¡¹",
    watering: "æµ‡æ°´",
    wateringInfo: "å½“æ¤ç‰©éœ€è¦æµ‡æ°´æ—¶æé†’ä½ ",
    fertilizing: "æ–½è‚¥",
    fertilizingInfo: "æé†’æ–½è‚¥æ—¶é—´",
    pruning: "ä¿®å‰ª",
    pruningInfo: "ä¿®å‰ªå’Œæ•´å½¢æé†’",
    repotting: "æ¢ç›†",
    repottingInfo: "æé†’æ¢ç›†æ—¶é—´",
    sunlight: "å…‰ç…§",
    sunlightInfo: "å»ºè®®ç§»åŠ¨æ¤ç‰©ä»¥èŽ·å¾—æ›´å¥½å…‰ç…§",
    on: "å¼€å¯",
    off: "å…³é—­",
    wateringTime: "æµ‡æ°´æ—¶é—´",
    customNotes: "è‡ªå®šä¹‰å¤‡æ³¨",
    addNote: "æ·»åŠ å¤‡æ³¨",
    summary: "æ‘˜è¦",
    daily: "æ¯æ—¥",
    weekly: "æ¯å‘¨",
    notifications: "é€šçŸ¥",
    pushAlerts: "æŽ¨é€æé†’",
    pushAlertsInfo: "ä¸ºä½ çš„æµ‡æ°´ä¹ æƒ¯å®‰æŽ’è®¾å¤‡æé†’ã€‚",
    emailAlerts: "é‚®ä»¶æé†’",
    emailAlertsInfo: "ä¿å­˜ä½ çš„é‚®ä»¶æé†’åå¥½ï¼Œä¾¿äºŽåŽç»­æŽ¥å…¥ã€‚",
    testNotification: "å‘é€æµ‹è¯•æé†’",
    careMessages: "æœ€è¿‘æ´»åŠ¨",
    next: "ä¸‹ä¸€æ¬¡",
    paused: "å·²æš‚åœ",
    liveStatus: "å®žæ—¶çŠ¶æ€",
    currentTime: "å½“å‰æ—¶é—´",
    scheduledFor: "è®¡åˆ’æ—¶é—´",
    quickTimes: "å¿«æ·æ—¶é—´",
    morning: "æ—©ä¸Š",
    midday: "ä¸­åˆ",
    evening: "å‚æ™š",
    autoSave: "æ¯æ¬¡æ›´æ”¹éƒ½ä¼šè‡ªåŠ¨ä¿å­˜ã€‚",
    timeHint: "è¯·ä½¿ç”¨ 24 å°æ—¶åˆ¶ï¼Œä¾‹å¦‚ 07:00 æˆ– 18:30ï¼Œä»¥èŽ·å¾—å¯é çš„æ¯æ—¥æé†’ã€‚",
    timeInvalid: "è¯·è¾“å…¥ 24 å°æ—¶åˆ¶ HH:MM æ—¶é—´ã€‚",
    timeSaved: "æé†’æ—¶é—´å·²æ›´æ–°ã€‚",
    noteRequired: "è¯·å…ˆæ·»åŠ å¤‡æ³¨ã€‚",
    noteAdded: "å·²æ·»åŠ è‡ªå®šä¹‰æé†’ã€‚",
    noteRemoved: "ä½ çš„è‡ªå®šä¹‰æé†’å·²åˆ é™¤ã€‚",
    testAdded: "å·²æ·»åŠ æµ‹è¯•æé†’ã€‚",
    pushUnsupported: "æŽ¨é€é€šçŸ¥éœ€è¦å¼€å‘ç‰ˆæœ¬æˆ–æ­£å¼å‘å¸ƒçš„åº”ç”¨ã€‚",
    pushPermissionDenied: "æ­¤è®¾å¤‡æœªå¼€å¯æŽ¨é€æƒé™ã€‚",
    activeLabel: "æ´»è·ƒ",
    savedLabel: "å·²ä¿å­˜",
    enabledLabel: "å·²å¯ç”¨",
    recentLabel: "æœ€è¿‘",
    timeFormatPlaceholder: "07:00",
  },
};

// Expo Go cannot run scheduled native notifications, so we guard those features here.
const isExpoGo = Constants.executionEnvironment === "storeClient";
const supportsNativeNotifications = Platform.OS !== "web" && !isExpoGo;

function getNotificationsModule() {
  if (!supportsNativeNotifications) {
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

function formatScheduleLabel(
  target: Date | null,
  fallback: string,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (!target) {
    return fallback;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const dayDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86400000);
  const timeLabel = target.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (dayDiff === 0) {
    return t("care_today_time", { time: timeLabel });
  }

  if (dayDiff === 1) {
    return t("care_tomorrow_time", { time: timeLabel });
  }

  return `${target.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeLabel}`;
}

function formatCountdown(
  target: Date | null,
  fallback: string,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (!target) {
    return fallback;
  }

  const remainingMs = target.getTime() - Date.now();
  if (remainingMs <= 0) {
    return t("care_now");
  }

  const totalMinutes = Math.max(1, Math.floor(remainingMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return t("care_hours_minutes_left", { hours, minutes });
  }

  return t("care_minutes_left", { minutes });
}

function formatActivityMessage(message: string) {
  return `${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${message}`;
}

export function CareReminderScreen() {
  const { height, width } = useWindowDimensions();
  // Tighten spacing and stacking on shorter or narrower screens.
  const compact = width <= viewport.compactWidth || height <= viewport.compactHeight;
  const { languageCode, t } = useLanguage();
  const localizedLanguageCode: LanguageCode =
    languageCode === "si" ||
    languageCode === "ta" ||
    languageCode === "es" ||
    languageCode === "fr" ||
    languageCode === "ar" ||
    languageCode === "hi" ||
    languageCode === "zh"
      ? languageCode
      : "en";
  const fallbackCopy = careCopy[localizedLanguageCode];
  // Prefer live translation keys, but keep a stable fallback placeholder from the local copy map.
  const copy = useMemo(
    () =>
      ({
        eyebrow: t("care_eyebrow"),
        title: t("care_title"),
        subtitle: t("care_subtitle"),
        activeTasks: t("care_active_tasks"),
        mode: t("care_mode"),
        options: t("care_options"),
        watering: t("watering"),
        wateringInfo: t("wateringInfo"),
        fertilizing: t("fertilizing"),
        fertilizingInfo: t("fertilizingInfo"),
        pruning: t("pruning"),
        pruningInfo: t("pruningInfo"),
        repotting: t("repotting"),
        repottingInfo: t("repottingInfo"),
        sunlight: t("sunlight"),
        sunlightInfo: t("sunlightInfo"),
        on: t("on"),
        off: t("off"),
        wateringTime: t("care_watering_time"),
        customNotes: t("care_custom_notes"),
        addNote: t("add_custom_note"),
        summary: t("care_summary"),
        daily: t("care_daily"),
        weekly: t("care_weekly"),
        notifications: t("notifications"),
        pushAlerts: t("care_push_alerts"),
        pushAlertsInfo: t("care_push_alerts_info"),
        emailAlerts: t("care_email_alerts"),
        emailAlertsInfo: t("care_email_alerts_info"),
        testNotification: t("care_test_notification"),
        careMessages: t("care_messages"),
        next: t("care_next"),
        paused: t("care_paused"),
        liveStatus: t("care_live_status"),
        currentTime: t("care_current_time"),
        scheduledFor: t("care_scheduled_for"),
        quickTimes: t("care_quick_times"),
        morning: t("care_morning"),
        midday: t("care_midday"),
        evening: t("care_evening"),
        autoSave: t("care_auto_save"),
        timeHint: t("care_time_hint"),
        timeInvalid: t("care_time_invalid"),
        timeSaved: t("care_time_saved"),
        noteRequired: t("care_note_required"),
        noteAdded: t("care_note_added"),
        noteRemoved: t("care_note_removed"),
        testAdded: t("care_test_added"),
        pushUnsupported: t("care_push_unsupported"),
        pushPermissionDenied: t("care_push_permission_denied"),
        activeLabel: t("care_active_label"),
        savedLabel: t("saved"),
        enabledLabel: t("care_enabled_label"),
        recentLabel: t("care_recent_label"),
        toggleAction: t("care_toggle_action"),
        timeFormatPlaceholder: fallbackCopy.timeFormatPlaceholder,
      }) as const,
    [fallbackCopy.timeFormatPlaceholder, t]
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [newCustomNote, setNewCustomNote] = useState("");
  const [status, setStatus] = useState("");
  const [liveNow, setLiveNow] = useState(() => Date.now());
  const [wateringTimeInput, setWateringTimeInput] = useState("");
  // These refs let the screen replace pending timers instead of stacking duplicates.
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { reminders, setReminders } = useSettings();
  const remindersRef = useRef(reminders);

  useEffect(() => {
    // Keep the editable input and mutable ref aligned with the latest persisted reminder state.
    remindersRef.current = reminders;
    setWateringTimeInput(reminders.wateringTime);
  }, [reminders]);

  useEffect(() => {
    // Refresh the live clock/countdown once per second for the hero summary.
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
    // Centralize reminder writes so every interaction updates the same source of truth.
    const next = updater(remindersRef.current);
    remindersRef.current = next;
    await setReminders(next);
    return next;
  };

  const createReminderMessage = (current: ReminderState) =>
    t("care_reminder_message", { time: formatTimeLabel(current.wateringTime) });

  const addInAppMessage = async (message: string) => {
    await persistReminders((current) => ({
      ...current,
      inAppMessages: [{ id: Date.now(), text: formatActivityMessage(message) }, ...current.inAppMessages].slice(0, 6),
    }));
  };

  const ensurePushPermission = async () => {
    if (!supportsNativeNotifications) {
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

    // Rebuild the native schedule from scratch so device reminders always match current settings.
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
        title: t("care_notification_title"),
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

    // Queue a local in-app reminder and immediately schedule the following cycle.
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
    const nextState = !remindersRef.current.options[key];
    await persistReminders((current) => ({
      ...current,
      options: { ...current.options, [key]: !current.options[key] },
    }));
    showStatus(t("care_toggle_updated", { name: copy[key], on: nextState ? copy.on : copy.off }));
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
      // Snap the field back to the last saved valid time if the manual edit is malformed.
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
            title: t("care_notification_title"),
            body: message,
          },
          trigger: null,
        });
      }
    }

    showStatus(copy.testAdded);
  };

  // Drive the summary cards from the same reminder state shown below.
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
    ? formatScheduleLabel(nextReminderDate, copy.paused, t)
    : copy.paused;
  const liveCountdownLabel = formatCountdown(nextReminderDate, copy.paused, t);
  const summaryModeLabel = reminders.summaryMode === "daily" ? copy.daily : copy.weekly;
  const liveClockLabel = new Date(liveNow).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: compact ? undefined : "2-digit",
  });

  // Render the mobile Care Reminder screen and its main interactive sections.
  return (
    <Screen contentStyle={compact ? styles.pageContentCompact : styles.pageContent}>
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

        <View style={[styles.heroMetricsWrap, compact ? styles.heroMetricsWrapCompact : null]}>
          <View style={[styles.metricCard, compact ? styles.metricCardCompact : null]}>
            <Text style={styles.metricValue}>{activeTasks}</Text>
            <Text style={styles.metricLabel}>{copy.activeTasks}</Text>
          </View>
          <View style={[styles.metricCard, compact ? styles.metricCardCompact : null]}>
            <Text style={styles.metricValue}>{notificationModes}</Text>
            <Text style={styles.metricLabel}>{copy.notifications}</Text>
          </View>
        </View>

        <View style={[styles.liveBoard, compact ? styles.liveBoardCompact : null]}>
          <View style={styles.liveBoardCard}>
            <Text style={styles.liveBoardLabel}>{copy.currentTime}</Text>
            <Text style={styles.liveBoardValue}>{liveClockLabel}</Text>
          </View>
          <View style={styles.liveBoardCard}>
            <Text style={styles.liveBoardLabel}>{copy.scheduledFor}</Text>
            <Text style={styles.liveBoardValue} numberOfLines={1}>
              {reminders.options.watering ? formatTimeLabel(reminders.wateringTime) : copy.paused}
            </Text>
          </View>
          <View style={styles.liveBoardCard}>
            <Text style={styles.liveBoardLabel}>{copy.next}</Text>
            <Text style={styles.liveBoardValue} numberOfLines={1}>
              {liveCountdownLabel}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryChip}>{nextReminderLabel}</Text>
          <Text style={styles.summaryChip}>{`${copy.mode}: ${summaryModeLabel}`}</Text>
          <Text style={styles.summaryChip}>{copy.autoSave}</Text>
        </View>
      </View>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <View style={[styles.sectionCard, compact ? styles.sectionCardCompact : null]}>
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
              accessibilityLabel={t("care_toggle_action", { name: copy[option.titleKey] })}
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
        <View style={[styles.sectionCard, styles.scheduleCard, compact ? styles.sectionCardCompact : null]}>
          <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
            <Text style={styles.sectionTitle}>{copy.wateringTime}</Text>
            <Text style={styles.sectionMeta}>{nextReminderLabel}</Text>
          </View>

          <View style={[styles.scheduleShell, compact ? styles.scheduleShellCompact : null]}>
            <View style={styles.scheduleOverview}>
              <View style={styles.scheduleTimeCluster}>
                <Text style={styles.scheduleTimeValue}>
                  {formatTimeLabel(reminders.wateringTime)}
                </Text>
                <Text style={styles.scheduleTimeCaption}>{copy.scheduledFor}</Text>
              </View>
              <View style={styles.scheduleCountdownPill}>
                <Text style={styles.scheduleCountdownText}>{liveCountdownLabel}</Text>
              </View>
            </View>

            <View style={[styles.timeEditorRow, compact ? styles.timeEditorRowCompact : null]}>
              <View style={styles.timeInputWrap}>
                <MaterialIcons name="schedule" size={16} color={colors.textMuted} style={styles.timeInputIcon} />
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
              </View>
              <Pressable
                accessibilityLabel={t("save_watering_time")}
                onPress={() => void commitWateringTime(wateringTimeInput)}
                style={[styles.timeSaveButton, compact ? styles.timeSaveButtonCompact : null]}
              >
                <MaterialIcons name="check" size={18} color={colors.white} />
              </Pressable>
            </View>
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

      <View style={[styles.sectionCard, compact ? styles.sectionCardCompact : null]}>
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
          <Pressable accessibilityLabel={t("add_custom_note")} onPress={() => void addCustomNote()} style={styles.addButton}>
            <MaterialIcons name="add" size={18} color={colors.white} />
          </Pressable>
        </View>

        {reminders.customNotes.map((note, index) => (
          <View key={`${note}-${index}`} style={styles.customNoteRow}>
            <Text style={styles.customNoteText}>{note}</Text>
            <Pressable
              accessibilityLabel={t("remove_custom_note")}
              onPress={() => void removeCustomNote(index)}
              style={styles.trashButton}
            >
              <MaterialIcons name="delete-outline" size={16} color="#B33D68" />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={[styles.sectionCard, compact ? styles.sectionCardCompact : null]}>
        <View style={[styles.sectionHeader, compact ? styles.sectionHeaderCompact : null]}>
          <Text style={styles.sectionTitle}>{copy.summary}</Text>
          <Text style={styles.sectionMeta}>{summaryModeLabel}</Text>
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

      <View style={[styles.sectionCard, compact ? styles.sectionCardCompact : null]}>
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

        {!supportsNativeNotifications ? <Text style={styles.helperText}>{copy.pushUnsupported}</Text> : null}

        <Pressable onPress={() => void sendNotification()} style={styles.testButton}>
          <MaterialIcons name="notifications-active" size={16} color={colors.white} />
          <Text style={styles.testButtonText}>{copy.testNotification}</Text>
        </Pressable>
      </View>

      {reminders.inAppMessages.length > 0 ? (
        <View style={[styles.sectionCard, compact ? styles.sectionCardCompact : null]}>
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
  pageContent: {
    gap: spacing.md,
  },
  pageContentCompact: {
    gap: spacing.sm,
  },
  heroCard: {
    backgroundColor: "#543A88",
    borderRadius: 30,
    gap: spacing.md,
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
    fontSize: 27,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 22,
  },
  heroMetricsWrap: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroMetricsWrapCompact: {
    flexDirection: "column",
  },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 22,
    flex: 1,
    minHeight: 84,
    padding: spacing.md,
  },
  metricCardCompact: {
    minHeight: 74,
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
  liveBoard: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  liveBoardCompact: {
    flexDirection: "column",
  },
  liveBoardCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    flex: 1,
    minHeight: 74,
    padding: spacing.md,
  },
  liveBoardLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  liveBoardValue: {
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
    padding: 20,
    ...shadows.soft,
  },
  sectionCardCompact: {
    borderRadius: 20,
    padding: spacing.md,
  },
  scheduleCard: {
    paddingBottom: spacing.md,
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
    borderColor: "rgba(124,92,255,0.1)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 74,
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
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
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
  scheduleShell: {
    backgroundColor: "#F5F0FF",
    borderColor: "rgba(124,92,255,0.1)",
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  scheduleShellCompact: {
    borderRadius: 18,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  scheduleOverview: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scheduleTimeCluster: {
    flex: 1,
  },
  scheduleTimeValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  scheduleTimeCaption: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  scheduleCountdownPill: {
    backgroundColor: colors.white,
    borderColor: "rgba(124,92,255,0.16)",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  scheduleCountdownText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  timeEditorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  timeEditorRowCompact: {
    alignItems: "stretch",
  },
  timeInputWrap: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    minHeight: 46,
    paddingHorizontal: spacing.sm,
  },
  timeInputIcon: {
    marginRight: 6,
  },
  timeInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    minHeight: 44,
    paddingRight: spacing.xs,
  },
  timeSaveButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  timeSaveButtonCompact: {
    width: 44,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  presetButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: "rgba(124,92,255,0.1)",
    borderRadius: 16,
    borderWidth: 1,
    minWidth: "31%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  presetButtonActive: {
    backgroundColor: "#E8DFFF",
    borderColor: "#C9B2FF",
    borderWidth: 1,
  },
  presetLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  presetLabelActive: {
    color: colors.primaryDark,
  },
  presetTime: {
    color: colors.textMuted,
    fontSize: 11,
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
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  customNoteRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    borderColor: "rgba(124,92,255,0.08)",
    borderWidth: 1,
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
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
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
    borderRadius: 16,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
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
    borderColor: "rgba(124,92,255,0.08)",
    borderRadius: 18,
    borderWidth: 1,
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
