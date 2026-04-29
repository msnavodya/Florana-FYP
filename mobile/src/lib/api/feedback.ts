import { apiRequest } from "./client";
import type { FeedbackEntry } from "../../types/app";

export const getFeedbacks = () =>
  apiRequest<FeedbackEntry[]>("/feedback/", {
    method: "GET",
  });

export const createFeedback = (payload: { rating: number; message: string }) =>
  apiRequest<FeedbackEntry>("/feedback/", {
    method: "POST",
    body: payload,
  });

export const clearFeedbacksApi = () =>
  apiRequest<{ message: string }>("/feedback/", {
    method: "DELETE",
  });
