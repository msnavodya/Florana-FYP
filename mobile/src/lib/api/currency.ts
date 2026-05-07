import { BASE_CURRENCY, type SupportedCurrency, normalizeExchangeRates } from "../../utils/shop";

const FRANKFURTER_API = "https://api.frankfurter.dev/v2";

interface FrankfurterRateRow {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export interface ExchangeRatesResponse {
  rates: Record<SupportedCurrency, number>;
  updatedAt: string | null;
}

export async function fetchLatestExchangeRates(): Promise<ExchangeRatesResponse> {
  const response = await fetch(`${FRANKFURTER_API}/rates?base=${BASE_CURRENCY}&quotes=USD,EUR`);

  if (!response.ok) {
    throw new Error(`Currency rates request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as FrankfurterRateRow[];
  const rates = normalizeExchangeRates(
    payload.reduce<Partial<Record<SupportedCurrency, number>>>(
      (result, row) => ({ ...result, [row.quote as SupportedCurrency]: Number(row.rate) }),
      { [BASE_CURRENCY]: 1 }
    )
  );

  return {
    rates,
    updatedAt: payload[0]?.date || null,
  };
}
