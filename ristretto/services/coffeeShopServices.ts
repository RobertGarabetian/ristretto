import { api } from '../utils/api';

export interface CoffeeShop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isFavorite?: boolean;
}

export interface CoffeeShopParams {
  lat: string;
  lng: string;
  radius?: string;
  max?: string;
}

export async function fetchCoffeeShops(params: CoffeeShopParams, token: string) {
  const queryParams = new URLSearchParams({
    lat: params.lat,
    lng: params.lng,
    radius: params.radius || '500',
    max: params.max || '10',
  }).toString();
  const lat = params.lat;
  const lng = params.lng;
  const radius = params.radius || '500';
  const max = params.max || '10';
  const response = await api.get(`/coffee_shops?lat=${lat}&lng=${lng}&radius=${radius}&max=${max}`, token);
  return response.coffeeShops as CoffeeShop[];
}

export async function fetchCoffeeShopById(id: string, token: string): Promise<CoffeeShop> {
  // This is a placeholder implementation - in a real app, you'd want to
  // call a specific API endpoint to get details for a single coffee shop
  const coffeeShops = await fetchCoffeeShops({
    lat: "37.7937", // Default coordinates
    lng: "-122.3965",
  }, token);
  
  const shop = coffeeShops.find(shop => shop.id === id);
  
  if (!shop) {
    throw new Error(`Coffee shop with ID ${id} not found`);
  }
  
  // Check if it's in favorites
  try {
    const favorites = await fetchFavorites(token);
    const isFavorite = favorites.some(fav => fav.id === id);
    return { ...shop, isFavorite };
  } catch (error) {
    // If favorites fetch fails, continue with shop data
    console.error("Error checking favorite status:", error);
    return shop;
  }
}

export async function fetchFavorites(token: string) {
  const response = await api.get('/favorites', token);
  return response.favorites as CoffeeShop[];
}

export async function addToFavorites(coffeeShop: CoffeeShop, token: string) {
  return api.post('/favorites', coffeeShop, token);
}

export async function removeFromFavorites(placeId: string, token: string) {
  return api.delete(`/favorites?placeId=${placeId}`, token);
}

export async function recordVisit(coffeeShop: CoffeeShop, token: string) {
  return api.post('/visits', coffeeShop, token);
}