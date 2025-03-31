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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../../lib/location";
import { CoffeeShop, useApi } from "../../lib/api";
import CoffeeShopCard from "../../components/CoffeeShopCard";
import { useIsFocused } from "@react-navigation/native";

export default function FavoritesScreen() {
  const api = useApi();
  const isFocused = useIsFocused();
  const { location } = useLocation();

  const [favorites, setFavorites] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites when screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchFavorites();
    }
  }, [isFocused]);

  // Function to fetch favorite coffee shops
  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      const shops = await api.getFavorites();
      setFavorites(shops);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Failed to fetch favorites. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  // Remove from favorites
  const removeFromFavorites = async (shop: CoffeeShop) => {
    try {
      await api.removeFavorite(shop.id);

      // Update local state
      setFavorites(favorites.filter((s) => s.id !== shop.id));

      Alert.alert("Success", `Removed ${shop.name} from favorites`);
    } catch (err) {
      console.error("Error removing favorite:", err);
      Alert.alert("Error", "Failed to remove from favorites");
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (favorites.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyText}>No favorite coffee shops yet</Text>
          <Text style={styles.emptySubText}>
            Add coffee shops to your favorites to see them here
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={({ item }) => (
          <CoffeeShopCard
            coffeeShop={item}
            userLatitude={location?.latitude}
            userLongitude={location?.longitude}
            onFavoritePress={() => removeFromFavorites(item)}
            onVisitPress={() => markAsVisited(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Your Favorite Coffee Shops</Text>
            <Text style={styles.headerCount}>
              {favorites.length} {favorites.length === 1 ? "place" : "places"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerCount: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
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
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
