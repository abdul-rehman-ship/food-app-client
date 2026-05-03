export interface FoodItem {
  id?: string;
  name: string;
  price: number;
  description: string;
  ingredients: string[];
  stock: number;
  preparationTime: string;
  sizes: Size[];
  images: string[];
  categoryId: string;
  createdAt: number;
}

export interface Size {
  name: string;
  price: number;
}

export interface Category {
  id?: string;
  name: string;
  createdAt: number;
}
export interface Trailor {
  id?: string;
  name: string;
  number: string;
  phone: string;
  latitude: number;
  longitude: number;
  address: string;
  status: 'available' | 'busy' | 'offline';
  createdAt: number;
}