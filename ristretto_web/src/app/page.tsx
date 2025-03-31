// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  MapPinIcon,
  ArrowPathIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";

type CoffeeShop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
};

interface CoffeeShopResponse {
  coffeeShops: CoffeeShop[];
}

export default function CoffeeShopsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState({
    lat: 37.7937,
    lng: -122.3965,
    radius: 500,
    max: 10,
  });
  const [userLocation, setUserLocation] = useState<boolean>(false);

  const fetchCoffeeShops = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        lat: coordinates.lat.toString(),
        lng: coordinates.lng.toString(),
        radius: coordinates.radius.toString(),
        max: coordinates.max.toString(),
      });

      const response = await fetch(
        `/api/proxy/coffee_shops?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: CoffeeShopResponse = await response.json();
      setCoffeeShops(data.coffeeShops || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch coffee shops"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (shop: CoffeeShop) => {
    if (!isSignedIn) return;

    try {
      if (shop.isFavorite) {
        // Remove from favorites
        const response = await fetch(
          `/api/proxy/favorites?placeId=${shop.id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setCoffeeShops(
            coffeeShops.map((s) =>
              s.id === shop.id ? { ...s, isFavorite: false } : s
            )
          );
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/proxy/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(shop),
        });

        if (response.ok) {
          setCoffeeShops(
            coffeeShops.map((s) =>
              s.id === shop.id ? { ...s, isFavorite: true } : s
            )
          );
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      setUserLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            ...coordinates,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setUserLocation(false);
        },
        (error) => {
          setError("Unable to retrieve your location");
          setUserLocation(false);
          console.error(error);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchCoffeeShops();
    }
  }, [isLoaded, isSignedIn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCoffeeShops();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCoordinates({
      ...coordinates,
      [name]: parseFloat(value),
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Coffee Shop Finder
          </h1>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {!isSignedIn ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Welcome to Coffee Shop Finder
            </h2>
            <p className="mb-6 text-gray-600">
              Sign in to discover coffee shops near you.
            </p>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                Sign In to Continue
              </button>
            </SignInButton>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="lat"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="lat"
                      name="lat"
                      value={coordinates.lat}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lng"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="lng"
                      name="lng"
                      value={coordinates.lng}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="radius"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Radius (meters)
                    </label>
                    <input
                      type="number"
                      id="radius"
                      name="radius"
                      value={coordinates.radius}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="max"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Max Results
                    </label>
                    <input
                      type="number"
                      id="max"
                      name="max"
                      value={coordinates.max}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={getUserLocation}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={userLocation}
                  >
                    {userLocation ? (
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <MapPinIcon className="h-5 w-5 mr-2" />
                    )}
                    Use My Location
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      "Search Coffee Shops"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Coffee Shops Near You
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Showing {coffeeShops.length} results within{" "}
                  {coordinates.radius}m
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : coffeeShops.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {coffeeShops.map((shop) => (
                    <li
                      key={shop.id}
                      className="px-4 py-4 sm:px-6 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {shop.name}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleFavorite(shop)}
                          className="ml-4 flex-shrink-0 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {shop.isFavorite ? (
                            <HeartSolidIcon className="h-6 w-6 text-red-500" />
                          ) : (
                            <HeartIcon className="h-6 w-6 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No coffee shops found in this area.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
