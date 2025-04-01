// utils/api.ts
const API_URL = 'http://192.168.1.72:8080';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, token?: string) {
  if (!token) {
    throw new Error('Authentication token is required');
  }
  console.log("optionsssss:::::",options)
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  console.log(headers)
  console.log("API Request:", `${API_URL}${endpoint}`);
console.log("Headers:", JSON.stringify(headers));

const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  console.log("Response status:", response.status);
console.log("(------\n\n\n", response)
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.log(errorData)
    throw new Error(errorData?.message || `Error: ${response.status}`);
  }

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