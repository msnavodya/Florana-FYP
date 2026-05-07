export const supportedCurrencies = ["LKR", "USD", "EUR"] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];

export const BASE_CURRENCY: SupportedCurrency = "LKR";
export const defaultExchangeRates: Record<SupportedCurrency, number> = { LKR: 1, USD: 0.0033, EUR: 0.003 };
export const currencySymbols: Record<SupportedCurrency, string> = { LKR: "Rs.", USD: "$", EUR: "EUR" };

export const seasons = ["Spring", "Summer", "Autumn", "Winter"] as const;

export const normalizeExchangeRates = (rates?: Partial<Record<SupportedCurrency, number>>) => ({
  ...defaultExchangeRates,
  ...Object.fromEntries(
    Object.entries(rates || {}).filter(([, value]) => Number.isFinite(value) && Number(value) > 0)
  ),
}) as Record<SupportedCurrency, number>;

export const convertPrice = (
  price: number | string | undefined,
  currency: SupportedCurrency,
  exchangeRates: Partial<Record<SupportedCurrency, number>> = defaultExchangeRates
) => {
  const rates = normalizeExchangeRates(exchangeRates);
  const converted = Number(price || 0) * rates[currency];
  return Number.isFinite(converted) ? Number(converted.toFixed(2)) : 0;
};

export const formatPrice = (
  price: number | string | undefined,
  currency: SupportedCurrency,
  exchangeRates: Partial<Record<SupportedCurrency, number>> = defaultExchangeRates
) => {
  const converted = convertPrice(price, currency, exchangeRates);
  return `${currencySymbols[currency]} ${converted.toFixed(2)}`;
};
