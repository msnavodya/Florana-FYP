import { apiRequest } from "./client";
import type { Product } from "../../types/shop";

export const getProducts = () => apiRequest<Product[]>("/shop/products", { method: "GET" });

export const createProduct = (formData: FormData) =>
  apiRequest<{ message: string; id: string }>("/shop/products", {
    method: "POST",
    body: formData,
  });

export const deleteProduct = (productId: string) =>
  apiRequest<{ message: string }>(`/shop/products/${productId}`, {
    method: "DELETE",
  });
