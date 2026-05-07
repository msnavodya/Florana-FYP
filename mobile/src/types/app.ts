export interface FeedbackEntry {
  id: number | string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface AppSettings {
  fontSize: "Small" | "Medium" | "Large";
  language: "English" | "Sinhala" | "Tamil" | "Spanish" | "French" | "Arabic" | "Hindi" | "Chinese";
  wateringReminders: boolean;
  diseaseAlerts: boolean;
  weeklySummary: boolean;
}

export interface ReminderState {
  options: Record<string, boolean>;
  customNotes: string[];
  summaryMode: "daily" | "weekly";
  notifications: {
    push: boolean;
    email: boolean;
  };
  wateringTime: string;
  inAppMessages: Array<{ id: number; text: string }>;
}
