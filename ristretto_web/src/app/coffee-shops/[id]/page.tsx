"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@clerk/nextjs";
import type { CoffeeShop } from "@/types";
import Header from "@/components/Header";

export default function CoffeeShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [coffeeShop, setCoffeeShop] = useState<CoffeeShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shopId = params?.id as string;

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !shopId) return;

    const fetchCoffeeShopDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        // This would typically be a call to your API to get coffee shop details
        // For now we'll mock a fetch with a timeout
        const response = await fetch(`/api/proxy/coffee_shops/${shopId}`);

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setCoffeeShop(data.coffeeShop);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch coffee shop details"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoffeeShopDetail();
  }, [isLoaded, isSignedIn, shopId]);

  const toggleFavorite = async () => {
    if (!isSignedIn || !coffeeShop) return;

    try {
      if (coffeeShop.isFavorite) {
        // Remove from favorites
        const response = await fetch(
          `/api/proxy/favorites?placeId=${coffeeShop.id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setCoffeeShop({
            ...coffeeShop,
            isFavorite: false,
          });
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/proxy/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(coffeeShop),
        });

        if (response.ok) {
          setCoffeeShop({
            ...coffeeShop,
            isFavorite: true,
          });
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleGoBack = () => {
    router.back();
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
        <button
          onClick={handleGoBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to results
        </button>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : coffeeShop ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Hero Section */}
            <div className="relative h-48 bg-gray-300">
              <button
                onClick={toggleFavorite}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
              >
                {coffeeShop.isFavorite ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-gray-500" />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-gray-900">
                  {coffeeShop.name}
                </h1>
                {coffeeShop.rating && (
                  <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">
                      {coffeeShop.rating}
                    </span>
                  </div>
                )}
              </div>

              {coffeeShop.location && (
                <p className="text-gray-600 mt-1">{coffeeShop.location}</p>
              )}

              <div className="mt-6 space-y-4">
                {/* Address */}
                {coffeeShop.address && (
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-800">
                        {coffeeShop.address}
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          coffeeShop.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {coffeeShop.phoneNumber && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a
                      href={`tel:${coffeeShop.phoneNumber}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {coffeeShop.phoneNumber}
                    </a>
                  </div>
                )}

                {/* Website */}
                {coffeeShop.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a
                      href={coffeeShop.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Visit website
                    </a>
                  </div>
                )}

                {/* Hours */}
                {coffeeShop.openingHours &&
                  coffeeShop.openingHours.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Opening Hours
                      </h3>
                      <ul className="space-y-1">
                        {coffeeShop.openingHours.map((hours, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {hours}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              {/* Map View (placeholder) */}
              <div className="mt-8 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Map View</p>
                {/* In a real implementation, you would add a map here using coordinates */}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Coffee shop not found</p>
          </div>
        )}
      </main>
    </div>
  );
}
