// components/CoffeeShopList.tsx
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { CoffeeShop } from "@/types";
import Link from "next/link";

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
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">
            Coffee Shops Near You
          </h2>
          <p className="text-sm text-gray-500">Searching for coffee shops...</p>
        </div>
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium text-gray-900">
          Coffee Shops Near You
        </h2>
        <p className="text-sm text-gray-500">
          Showing {coffeeShops.length} results within {radius}m
        </p>
      </div>

      {coffeeShops.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">No coffee shops found in this area.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {coffeeShops.map((shop) => (
            <li key={shop.id} className="hover:bg-gray-50">
              <Link href={`/coffee-shops/${shop.id}`} className="block">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      {shop.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {(
                        Math.round(
                          Math.sqrt(
                            Math.pow(
                              shop.latitude - parseFloat(String(shop.latitude)),
                              2
                            ) +
                              Math.pow(
                                shop.longitude -
                                  parseFloat(String(shop.longitude)),
                                2
                              ) *
                                111000
                          ) * 10
                        ) / 10
                      ).toFixed(1)}{" "}
                      km away
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFavorite(shop);
                    }}
                    className="p-2 rounded-full hover:bg-gray-200"
                    aria-label={
                      shop.isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    {shop.isFavorite ? (
                      <HeartSolidIcon className="h-6 w-6 text-red-500" />
                    ) : (
                      <HeartIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
