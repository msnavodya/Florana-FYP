// Manage shared mobile state for Settings features.
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { clearFeedbacksApi, createFeedback, getFeedbacks } from "../lib/api/feedback";
import { getReminders, saveReminders as saveRemindersApi } from "../lib/api/reminders";
import { storageKeys } from "../lib/storage/keys";
import type { AppSettings, FeedbackEntry, ReminderState } from "../types/app";

const defaultSettings: AppSettings = {
  fontSize: "Medium",
  language: "English",
  wateringReminders: true,
  diseaseAlerts: false,
  weeklySummary: false,
};

const defaultReminders: ReminderState = {
  options: {
    watering: true,
    fertilizing: false,
    pruning: false,
    repotting: false,
    sunlight: true,
  },
  customNotes: [],
  summaryMode: "daily",
  notifications: { push: true, email: false },
  wateringTime: "07:00",
  inAppMessages: [],
};

// Fill any missing reminder branches so older saved payloads still match the latest shape.
function mergeReminderState(partial?: Partial<ReminderState> | null): ReminderState {
  return {
    ...defaultReminders,
    ...(partial || {}),
    options: {
      ...defaultReminders.options,
      ...(partial?.options || {}),
    },
    notifications: {
      ...defaultReminders.notifications,
      ...(partial?.notifications || {}),
    },
    customNotes: Array.isArray(partial?.customNotes) ? partial.customNotes : defaultReminders.customNotes,
    inAppMessages: Array.isArray(partial?.inAppMessages) ? partial.inAppMessages : defaultReminders.inAppMessages,
  };
}

interface SettingsContextValue {
  settings: AppSettings;
  reminders: ReminderState;
  feedbacks: FeedbackEntry[];
  ready: boolean;
  fontScale: number;
  refreshFeedbacks: () => Promise<void>;
  refreshReminders: () => Promise<void>;
  saveSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  setReminders: (value: ReminderState) => Promise<void>;
  addFeedback: (value: Omit<FeedbackEntry, "id" | "createdAt">) => Promise<void>;
  clearFeedbacks: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [reminders, setRemindersState] = useState<ReminderState>(defaultReminders);
  const [feedbacks, setFeedbacksState] = useState<FeedbackEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refreshFeedbacks = useCallback(async () => {
    try {
      const liveFeedbacks = await getFeedbacks();
      setFeedbacksState(liveFeedbacks);
      await AsyncStorage.setItem(storageKeys.feedbacks, JSON.stringify(liveFeedbacks));
    } catch {
      // Keep cached feedbacks when backend is unavailable.
    }
  }, []);

  const refreshReminders = useCallback(async () => {
    try {
      const liveReminders = mergeReminderState(await getReminders());
      setRemindersState(liveReminders);
      await AsyncStorage.setItem(storageKeys.reminders, JSON.stringify(liveReminders));
    } catch {
      // Keep cached reminders when backend is unavailable.
    }
  }, []);

  useEffect(() => {
    // Load cached device data first, then quietly refresh it from the backend when possible.
    Promise.all([
      AsyncStorage.getItem(storageKeys.settings),
      AsyncStorage.getItem(storageKeys.reminders),
      AsyncStorage.getItem(storageKeys.feedbacks),
    ])
      .then(async ([settingsRaw, remindersRaw, feedbackRaw]) => {
        if (settingsRaw) {
          setSettingsState({ ...defaultSettings, ...(JSON.parse(settingsRaw) as Partial<AppSettings>) });
        }
        if (remindersRaw) {
          setRemindersState(mergeReminderState(JSON.parse(remindersRaw) as Partial<ReminderState>));
        }
        if (feedbackRaw) {
          setFeedbacksState(JSON.parse(feedbackRaw) as FeedbackEntry[]);
        }
        await Promise.all([refreshFeedbacks(), refreshReminders()]);
      })
      .finally(() => setReady(true));
  }, [refreshFeedbacks, refreshReminders]);

  useEffect(() => {
    // Refresh the shared feedback and reminder caches in the background while the app stays open.
    const interval = setInterval(() => {
      void refreshFeedbacks();
      void refreshReminders();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshFeedbacks, refreshReminders]);

  const saveSettings = async (partial: Partial<AppSettings>) => {
    // Merge partial updates so each setting row can save independently.
    const next = { ...settings, ...partial };
    setSettingsState(next);
    await AsyncStorage.setItem(storageKeys.settings, JSON.stringify(next));
  };

  const resetSettings = async () => {
    setSettingsState(defaultSettings);
    await AsyncStorage.removeItem(storageKeys.settings);
  };

  const setReminders = async (value: ReminderState) => {
    const normalized = mergeReminderState(value);
    setRemindersState(normalized);
    await AsyncStorage.setItem(storageKeys.reminders, JSON.stringify(normalized));

    try {
      const saved = mergeReminderState(await saveRemindersApi(normalized));
      setRemindersState(saved);
      await AsyncStorage.setItem(storageKeys.reminders, JSON.stringify(saved));
    } catch {
      // Keep local changes when backend is unavailable.
    }
  };

  const addFeedback = async (value: Omit<FeedbackEntry, "id" | "createdAt">) => {
    // Fall back to a local optimistic entry when the backend is unavailable.
    let nextEntry: FeedbackEntry;
    try {
      nextEntry = await createFeedback(value);
    } catch {
      nextEntry = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ...value,
      };
    }

    const next = [nextEntry, ...feedbacks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setFeedbacksState(next);
    await AsyncStorage.setItem(storageKeys.feedbacks, JSON.stringify(next));
  };

  const clearFeedbacks = async () => {
    try {
      await clearFeedbacksApi();
    } catch {
      // Clear local cache even if backend is unavailable.
    }
    setFeedbacksState([]);
    await AsyncStorage.removeItem(storageKeys.feedbacks);
  };

  const fontScale = settings.fontSize === "Large" ? 1.14 : settings.fontSize === "Small" ? 0.92 : 1;

  const value = useMemo(
    () => ({
      settings,
      reminders,
      feedbacks,
      ready,
      fontScale,
      refreshFeedbacks,
      refreshReminders,
      saveSettings,
      resetSettings,
      setReminders,
      addFeedback,
      clearFeedbacks,
    }),
    [settings, reminders, feedbacks, ready, fontScale, refreshFeedbacks, refreshReminders]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return value;
}
