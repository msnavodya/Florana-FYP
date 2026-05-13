// Wrap mobile API requests related to Shop.
import { apiRequest } from "./client";
import type { Product } from "../../types/shop";

// Read the current shop catalog for the marketplace and season screens.
export const getProducts = () => apiRequest<Product[]>("/shop/products", { method: "GET" });

// Submit a new product listing with image data from the sell flow.
export const createProduct = (formData: FormData) =>
  apiRequest<Product>("/shop/products", {
    method: "POST",
    body: formData,
  });

// Remove a product listing from both seller views and seasonal collections.
export const deleteProduct = (productId: string) =>
  apiRequest<{ message: string }>(`/shop/products/${productId}`, {
    method: "DELETE",
  });
