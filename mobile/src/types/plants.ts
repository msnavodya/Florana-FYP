export interface Plant {
  _id?: string;
  id?: string;
  name: string;
  species?: string | null;
  flowerId?: string | null;
  flowerCatalog?: string | null;
  location?: string | null;
  specificLocation?: string | null;
  climate?: string | null;
  sunlight?: string | null;
  soilType?: string | null;
  wateringFrequency?: string | null;
  fertilizerSchedule?: string | null;
  lastWatered?: string | null;
  initialSize?: string | null;
  tracking?: boolean;
  image_path?: string | null;
  info?: string | null;
  badges?: string[];
  warning?: boolean;
}

export interface GrowthRecord {
  _id?: string;
  plant_id: string;
  height: string;
  health: string;
  notes?: string | null;
  image_path?: string | null;
  date: string;
}
