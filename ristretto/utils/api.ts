// utils/api.ts
import { useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// Use environment variables or configure based on build type
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

async function getAuthToken() {
  return await SecureStore.getItemAsync('auth_token');
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, token: string) {
  console.log("here1")
  

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  console.log(headers)
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Error: ${response.status}`);
  }
  console.log("here")


  return response.json();
}

export const api = {
  get: (endpoint: string, token: string) => fetchWithAuth(endpoint, {method: 'GET'}, token),
  post: (endpoint: string, data: any, token: string) => fetchWithAuth(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token),
  delete: (endpoint: string, token: string) => fetchWithAuth(endpoint, {
    method: 'DELETE',
  }, token),
};