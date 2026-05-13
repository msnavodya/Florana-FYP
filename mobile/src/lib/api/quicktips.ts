// Wrap mobile API requests related to Quicktips.
import { apiRequest } from "./client";
import type { QuickTipsResponse } from "../../types/quicktips";

// Request quick-tip content tailored to the current backend context.
export const getQuickTips = () =>
  apiRequest<QuickTipsResponse>("/quick-tips", {
    method: "GET",
  });
