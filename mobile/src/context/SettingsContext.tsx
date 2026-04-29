import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { clearFeedbacksApi, createFeedback, getFeedbacks } from "../lib/api/feedback";
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

interface SettingsContextValue {
  settings: AppSettings;
  reminders: ReminderState;
  feedbacks: FeedbackEntry[];
  ready: boolean;
  refreshFeedbacks: () => Promise<void>;
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

  useEffect(() => {
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
          setRemindersState({ ...defaultReminders, ...(JSON.parse(remindersRaw) as Partial<ReminderState>) });
        }
        if (feedbackRaw) {
          setFeedbacksState(JSON.parse(feedbackRaw) as FeedbackEntry[]);
        }
        await refreshFeedbacks();
      })
      .finally(() => setReady(true));
  }, [refreshFeedbacks]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshFeedbacks();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshFeedbacks]);

  const saveSettings = async (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    setSettingsState(next);
    await AsyncStorage.setItem(storageKeys.settings, JSON.stringify(next));
  };

  const resetSettings = async () => {
    setSettingsState(defaultSettings);
    await AsyncStorage.removeItem(storageKeys.settings);
  };

  const setReminders = async (value: ReminderState) => {
    setRemindersState(value);
    await AsyncStorage.setItem(storageKeys.reminders, JSON.stringify(value));
  };

  const addFeedback = async (value: Omit<FeedbackEntry, "id" | "createdAt">) => {
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

  const value = useMemo(
    () => ({
      settings,
      reminders,
      feedbacks,
      ready,
      refreshFeedbacks,
      saveSettings,
      resetSettings,
      setReminders,
      addFeedback,
      clearFeedbacks,
    }),
    [settings, reminders, feedbacks, ready, refreshFeedbacks]
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
