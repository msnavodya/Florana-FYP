// Wrap mobile API requests related to Plants.
import { apiRequest } from "./client";
import type { GrowthRecord, Plant } from "../../types/plants";

// Fetch the full saved plant collection for list and dashboard screens.
export const getPlants = () => apiRequest<Plant[]>("/plants/", { method: "GET" });

// Send a multipart form payload when creating a plant profile with optional media.
export const createPlant = (formData: FormData) =>
  apiRequest<Plant>("/plants/", {
    method: "POST",
    body: formData,
  });

export const deletePlant = (plantId: string) =>
  apiRequest<{ message: string }>(`/plants/${plantId}`, {
    method: "DELETE",
  });

export const getPlantByName = (plantName: string) =>
  apiRequest<Plant>(`/plants/by-name/${encodeURIComponent(plantName)}`, {
    method: "GET",
  });

// Share the same upload path for growth entries so measurements and photos stay together.
export const addGrowth = (formData: FormData) =>
  apiRequest<{ status: string; data: GrowthRecord }>("/growth/", {
    method: "POST",
    body: formData,
  });

export const getGrowth = (plantId: string) =>
  apiRequest<{ status: string; data: GrowthRecord[] }>(`/growth/${plantId}`, {
    method: "GET",
  });
