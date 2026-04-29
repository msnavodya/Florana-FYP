import { apiRequest } from "./client";

export interface PredictionResponse {
  status: string;
  prediction: string;
  confidence: number | string;
  top_predictions?: Array<{
    label: string;
    confidence: number;
  }>;
  image_url?: string;
}

export const predictImage = (formData: FormData) =>
  apiRequest<PredictionResponse>("/predict", {
    method: "POST",
    body: formData,
  });
