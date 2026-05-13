// Handle mobile local storage for Keys data.
// Keep every AsyncStorage key in one place so reads and clears stay aligned across the app.
export const storageKeys = {
  token: "mobile_token",
  user: "mobile_user",
  cart: "mobile_cart",
  feedbacks: "mobile_feedbacks",
  currency: "mobile_currency",
  currencyRates: "mobile_currency_rates",
  currencyRatesUpdatedAt: "mobile_currency_rates_updated_at",
  appLanguage: "mobile_app_language",
  settings: "mobile_settings",
  reminders: "mobile_reminders",
  searchHistory: "mobile_search_history",
} as const;
