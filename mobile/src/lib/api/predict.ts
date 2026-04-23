import { apiRequest } from "./client";

export interface PredictionResponse {
  status: string;
  prediction: string;
  confidence: number | string;
  image_url?: string;
}

export const predictImage = (formData: FormData) =>
  apiRequest<PredictionResponse>("/predict", {
    method: "POST",
    body: formData,
  });
