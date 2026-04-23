import { apiRequest } from "./client";
import type { GrowthRecord, Plant } from "../../types/plants";

export const getPlants = () => apiRequest<Plant[]>("/plants/", { method: "GET" });

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

export const addGrowth = (formData: FormData) =>
  apiRequest<{ status: string; data: GrowthRecord }>("/growth/", {
    method: "POST",
    body: formData,
  });

export const getGrowth = (plantId: string) =>
  apiRequest<{ status: string; data: GrowthRecord[] }>(`/growth/${plantId}`, {
    method: "GET",
  });
