"use client";

import { ArrowPathIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import type { CoffeeShop } from "@/types";
import { useRouter } from "next/navigation";

interface CoffeeShopListProps {
  coffeeShops: CoffeeShop[];
  loading: boolean;
  radius: number;
  onToggleFavorite: (shop: CoffeeShop) => void;
}

export default function CoffeeShopList({
  coffeeShops,
  loading,
  radius,
  onToggleFavorite,
}: CoffeeShopListProps) {
  const router = useRouter();

  const handleShopClick = (shop: CoffeeShop) => {
    router.push(`/coffee-shops/${shop.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg font-medium text-gray-900">
          Coffee Shops Near You
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Showing {coffeeShops.length} results within {radius}m
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
              className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleShopClick(shop)}
            >
              <div className="flex items-center justify-between text-gray-900">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {shop.name}
                    {shop.location && (
                      <span className="ml-2 text-gray-500 text-xs">
                        {shop.location}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation when clicking the heart
                    onToggleFavorite(shop);
                  }}
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
          <p className="text-gray-500">No coffee shops found in this area.</p>
        </div>
      )}
    </div>
  );
}
