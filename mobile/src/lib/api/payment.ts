import { apiRequest } from "./client";

interface PaymentNotifyPayload {
  method: "card" | "paypal" | "cod";
  phone: string;
  total: number;
  currency: "LKR" | "USD" | "EUR";
  itemCount: number;
}

export const notifyPayment = (payload: PaymentNotifyPayload) => {
  const formData = new FormData();
  formData.append("method", payload.method);
  formData.append("phone", payload.phone);
  formData.append("total", String(payload.total));
  formData.append("currency", payload.currency);
  formData.append("item_count", String(payload.itemCount));

  return apiRequest<{ status: string }>("/payment-notify", {
    method: "POST",
    body: formData,
  });
};
