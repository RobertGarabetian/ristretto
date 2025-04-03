"use client";

import type { FormEvent, ChangeEvent } from "react";
import { ArrowPathIcon, MapPinIcon } from "@heroicons/react/24/outline";
import type { Coordinates } from "@/types";

interface SearchFormProps {
  coordinates: Coordinates;
  onCoordinatesChange: (coordinates: Coordinates) => void;
  onSubmit: () => void;
  getUserLocation: () => void;
  userLocation: boolean;
  loading: boolean;
}

export default function SearchForm({
  coordinates,
  onCoordinatesChange,
  onSubmit,
  getUserLocation,
  userLocation,
  loading,
}: SearchFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onCoordinatesChange({
      ...coordinates,
      [name]: Number.parseFloat(value),
    });
  };

  return (
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
  );
}
