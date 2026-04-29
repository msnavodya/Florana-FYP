import { apiRequest } from "./client";

export type PaymentMethod = "card" | "cod";
export type SupportedCurrency = "LKR" | "USD" | "EUR";

export interface CheckoutItemPayload {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface DeliveryDetailsPayload {
  name: string;
  phone: string;
  email?: string;
  address: string;
  note?: string;
}

export interface PaymentIntentPayload {
  amount: number;
  currency: SupportedCurrency;
  method: PaymentMethod;
  item_count: number;
  items: CheckoutItemPayload[];
  delivery: DeliveryDetailsPayload;
}

export interface PaymentIntentResponse {
  enabled: boolean;
  provider: "stripe" | "cod" | "manual";
  status: string;
  message: string;
  payment_intent_id?: string;
  client_secret?: string;
  publishable_key?: string;
}

export interface PaymentConfirmationPayload extends PaymentIntentPayload {
  payment_intent_id?: string;
  status: "pending" | "requires_action" | "succeeded" | "cod_confirmed" | "failed";
}

export const createPaymentIntent = (payload: PaymentIntentPayload) =>
  apiRequest<PaymentIntentResponse>("/payments/intent", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
  });

export const confirmPayment = (payload: PaymentConfirmationPayload) =>
  apiRequest<{ status: string; order: { _id?: string } }>("/payments/confirm", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
  });
