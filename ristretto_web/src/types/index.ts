// src/types.ts
export interface Coordinates {
  lat: number;
  lng: number;
  radius: number;
  max: number;
}

export interface CoffeeShop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
}

export interface CoffeeShopDetails extends CoffeeShop {
  address?: string;
  phoneNumber?: string;
  website?: string;
  location?: string;
  rating?: number;
  priceLevel?: number;
  openingHours?: string[];
  photos?: string[];
}