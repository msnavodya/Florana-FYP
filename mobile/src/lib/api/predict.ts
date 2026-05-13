// Wrap mobile API requests related to Predict.
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

// Upload a diagnosis image and return the model's prediction summary.
export const predictImage = (formData: FormData) =>
  apiRequest<PredictionResponse>("/predict", {
    method: "POST",
    body: formData,
  });
