import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../../lib/location";
import { CoffeeShop, useApi } from "../../lib/api";
import CoffeeShopCard from "../../components/CoffeeShopCard";
import { useIsFocused } from "@react-navigation/native";

export default function CoffeeShopsScreen() {
  const api = useApi();
  const isFocused = useIsFocused();
  const {
    location,
    loading: locationLoading,
    error: locationError,
    requestAndGetLocation,
  } = useLocation();

  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useState({
    radius: "500",
    maxResults: "10",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch coffee shops when location changes or screen is focused
  useEffect(() => {
    if (location && isFocused) {
      fetchCoffeeShops();
    }
  }, [location, isFocused]);

  // Function to fetch coffee shops
  const fetchCoffeeShops = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const shops = await api.getCoffeeShops(
        location.latitude,
        location.longitude,
        parseInt(searchParams.radius),
        parseInt(searchParams.maxResults)
      );

      setCoffeeShops(shops);
    } catch (err) {
      console.error("Error fetching coffee shops:", err);
      setError("Failed to fetch coffee shops. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchCoffeeShops();
  };

  // Handle search with new parameters
  const handleSearch = () => {
    fetchCoffeeShops();
    setShowFilters(false);
  };

  // Toggle favorite status for a coffee shop
  const toggleFavorite = async (shop: CoffeeShop) => {
    try {
      if (shop.isFavorite) {
        await api.removeFavorite(shop.id);
      } else {
        await api.addFavorite(shop);
      }

      // Update local state
      setCoffeeShops(
        coffeeShops.map((s) =>
          s.id === shop.id ? { ...s, isFavorite: !s.isFavorite } : s
        )
      );
    } catch (err) {
      console.error("Error toggling favorite:", err);
      Alert.alert("Error", "Failed to update favorite status");
    }
  };

  // Mark a coffee shop as visited
  const markAsVisited = async (shop: CoffeeShop) => {
    try {
      await api.addVisit(shop);
      Alert.alert("Success", `Marked ${shop.name} as visited!`);
    } catch (err) {
      console.error("Error marking as visited:", err);
      Alert.alert("Error", "Failed to mark as visited");
    }
  };

  // Render empty state
  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchCoffeeShops}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (coffeeShops.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cafe-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyText}>No coffee shops found nearby</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchCoffeeShops}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          {locationLoading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : location ? (
            <Text style={styles.locationText}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.locationErrorText}>Location unavailable</Text>
          )}

          <TouchableOpacity
            style={styles.locationButton}
            onPress={requestAndGetLocation}
            disabled={locationLoading}
          >
            <Ionicons name="locate-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={20} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterInputContainer}>
              <Text style={styles.filterLabel}>Radius (m)</Text>
              <TextInput
                style={styles.filterInput}
                keyboardType="numeric"
                value={searchParams.radius}
                onChangeText={(value) =>
                  setSearchParams({ ...searchParams, radius: value })
                }
              />
            </View>

            <View style={styles.filterInputContainer}>
              <Text style={styles.filterLabel}>Max Results</Text>
              <TextInput
                style={styles.filterInput}
                keyboardType="numeric"
                value={searchParams.maxResults}
                onChangeText={(value) =>
                  setSearchParams({ ...searchParams, maxResults: value })
                }
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={coffeeShops}
        renderItem={({ item }) => (
          <CoffeeShopCard
            coffeeShop={item}
            userLatitude={location?.latitude}
            userLongitude={location?.longitude}
            onFavoritePress={() => toggleFavorite(item)}
            onVisitPress={() => markAsVisited(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  locationContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#6b7280",
  },
  locationErrorText: {
    fontSize: 12,
    color: "#ef4444",
  },
  locationButton: {
    marginLeft: 8,
    padding: 4,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  filterInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 4,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
