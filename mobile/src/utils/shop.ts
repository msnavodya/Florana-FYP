export const exchangeRates = { LKR: 1, USD: 0.0033, EUR: 0.003 } as const;
export const currencySymbols = { LKR: "Rs.", USD: "$", EUR: "EUR" } as const;

export const seasons = ["Spring", "Summer", "Autumn", "Winter"] as const;

export const formatPrice = (price: number | string | undefined, currency: keyof typeof exchangeRates) => {
  const converted = Number(price || 0) * exchangeRates[currency];
  return `${currencySymbols[currency]} ${converted.toFixed(2)}`;
};
