export interface Product {
  id: string;
  name: string;
  price: number;
  season: string;
  image?: string | null;
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
}
