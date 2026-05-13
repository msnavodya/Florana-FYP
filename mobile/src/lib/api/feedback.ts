// Wrap mobile API requests related to Feedback.
import { apiRequest } from "./client";
import type { FeedbackEntry } from "../../types/app";

// Read the latest feedback feed for screens that surface community sentiment.
export const getFeedbacks = () =>
  apiRequest<FeedbackEntry[]>("/feedback/", {
    method: "GET",
  });

// Post one new rating and message pair from the mobile feedback form.
export const createFeedback = (payload: { rating: number; message: string }) =>
  apiRequest<FeedbackEntry>("/feedback/", {
    method: "POST",
    body: payload,
  });

// Clear the backend feedback list when the settings screen requests a full reset.
export const clearFeedbacksApi = () =>
  apiRequest<{ message: string }>("/feedback/", {
    method: "DELETE",
  });
