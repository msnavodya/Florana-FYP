// Wrap mobile API requests related to Reminders.
import { apiRequest } from "./client";
import type { ReminderState } from "../../types/app";

// Load the latest care-reminder settings saved for this user.
export const getReminders = () =>
  apiRequest<ReminderState>("/care-reminders/", {
    method: "GET",
  });

// Clone nested reminder data before sending it so the API receives a plain serializable payload.
export const saveReminders = (payload: ReminderState) =>
  apiRequest<ReminderState>("/care-reminders/", {
    method: "PUT",
    body: {
      ...payload,
      options: { ...payload.options },
      notifications: { ...payload.notifications },
      customNotes: [...payload.customNotes],
      inAppMessages: payload.inAppMessages.map((entry) => ({ ...entry })),
    },
  });
