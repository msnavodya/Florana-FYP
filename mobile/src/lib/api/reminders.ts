import { apiRequest } from "./client";
import type { ReminderState } from "../../types/app";

export const getReminders = () =>
  apiRequest<ReminderState>("/care-reminders/", {
    method: "GET",
  });

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
