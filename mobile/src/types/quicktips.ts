// Define shared mobile TypeScript types for Quicktips data.
// One quick-tip card returned by the backend suggestion endpoint.
export interface QuickTipItem {
  id: string;
  category: string;
  title: string;
  tip: string;
  detail: string;
}

// Context snapshot the backend uses to generate relevant quick tips.
export interface QuickTipContext {
  season: string;
  hour: number;
  plant_count: number;
  warning_count: number;
  featured_plant: string | null;
}

// Full quick-tips response returned to the mobile quick-tip screen.
export interface QuickTipsResponse {
  generated_at: string;
  context: QuickTipContext;
  tips: QuickTipItem[];
}
