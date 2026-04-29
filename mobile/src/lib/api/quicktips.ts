import { apiRequest } from "./client";
import type { QuickTipsResponse } from "../../types/quicktips";

export const getQuickTips = () =>
  apiRequest<QuickTipsResponse>("/quick-tips", {
    method: "GET",
  });
