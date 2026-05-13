// Define shared mobile TypeScript types for Shop data.
// One marketplace product listing shown in catalog and season views.
export interface Product {
  id: string;
  name: string;
  price: number;
  season: string;
  image?: string | null;
  stock?: number;
}

// A cart entry extends the product payload with the selected quantity.
export interface CartItem extends Product {
  quantity: number;
}
