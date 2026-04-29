export interface QuickTipItem {
  id: string;
  category: string;
  title: string;
  tip: string;
  detail: string;
}

export interface QuickTipContext {
  season: string;
  hour: number;
  plant_count: number;
  warning_count: number;
  featured_plant: string | null;
}

export interface QuickTipsResponse {
  generated_at: string;
  context: QuickTipContext;
  tips: QuickTipItem[];
}
