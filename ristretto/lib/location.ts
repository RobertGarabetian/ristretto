import * as Location from "expo-location";
import { useEffect, useState } from "react";

// Default coordinates (San Francisco)
export const DEFAULT_COORDINATES = {
  latitude: 37.7937,
  longitude: -122.3965,
};

// Location permission and coordinates hook
export function useLocation() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [permissionStatus, setPermissionStatus] = useState<
    Location.PermissionStatus | null
  >(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request location permission and get current position
  const requestAndGetLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== "granted") {
        setError("Location permission denied");
        setLoading(false);
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Location error");
    } finally {
      setLoading(false);
    }
  };

  // Initialize location on mount
  useEffect(() => {
    requestAndGetLocation();
  }, []);

  return {
    location,
    loading,
    error,
    permissionStatus,
    requestAndGetLocation,
  };
}

// Calculate distance between two coordinates in kilometers
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

// Convert degrees to radians
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}