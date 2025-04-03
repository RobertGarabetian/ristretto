"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Header from "@/components/Header";
import WelcomeSection from "@/components/WelcomeSection";
import SearchForm from "@/components/SearchForm";
import CoffeeShopList from "@/components/CoffeeShopList";
import type { CoffeeShop, Coordinates } from "@/types";

export default function CoffeeShopsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates>({
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

      const data = await response.json();
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

  const handleCoordinatesChange = (newCoordinates: Coordinates) => {
    setCoordinates(newCoordinates);
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
      <Header isSignedIn={isSignedIn} />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {!isSignedIn ? (
          <WelcomeSection />
        ) : (
          <>
            <SearchForm
              coordinates={coordinates}
              onCoordinatesChange={handleCoordinatesChange}
              onSubmit={fetchCoffeeShops}
              getUserLocation={getUserLocation}
              userLocation={userLocation}
              loading={loading}
            />

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <CoffeeShopList
              coffeeShops={coffeeShops}
              loading={loading}
              radius={coordinates.radius}
              onToggleFavorite={toggleFavorite}
            />
          </>
        )}
      </main>
    </div>
  );
}
