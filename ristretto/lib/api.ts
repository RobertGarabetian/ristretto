import { useAuth } from "./auth";
import Constants from "expo-constants";

// Get the API URL from environment variables or use a default
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

// Types
export interface CoffeeShop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
}

export interface User {
  id: number;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  placeId: string;
  name: string;
  visitedAt: string;
}

// API client class
class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  // Helper method for making authenticated requests
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    // Return null for 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Get coffee shops near a location
  async getCoffeeShops(lat: number, lng: number, radius: number = 500, max: number = 10) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      max: max.toString(),
    });

    const data = await this.fetchWithAuth(`/coffee_shops?${params.toString()}`);
    return data.coffeeShops as CoffeeShop[];
  }

  // Get user profile
  async getUserProfile() {
    const data = await this.fetchWithAuth('/user');
    return data as User;
  }

  // Get favorite coffee shops
  async getFavorites() {
    const data = await this.fetchWithAuth('/favorites');
    return data.favorites as CoffeeShop[];
  }

  // Add a coffee shop to favorites
  async addFavorite(coffeeShop: CoffeeShop) {
    return this.fetchWithAuth('/favorites', {
      method: 'POST',
      body: JSON.stringify(coffeeShop),
    });
  }

  // Remove a coffee shop from favorites
  async removeFavorite(placeId: string) {
    return this.fetchWithAuth(`/favorites?placeId=${placeId}`, {
      method: 'DELETE',
    });
  }

  // Get visits
  async getVisits() {
    const data = await this.fetchWithAuth('/visits');
    return data.visits as Visit[];
  }

  // Add a visit
  async addVisit(coffeeShop: CoffeeShop) {
    return this.fetchWithAuth('/visits', {
      method: 'POST',
      body: JSON.stringify(coffeeShop),
    });
  }

  // Health check (no auth required)
  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.ok;
  }
}

// Hook to use the API client
export function useApi() {
  const { getToken } = useAuth();
  return new ApiClient(API_URL, getToken);
}