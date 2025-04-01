import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { fetchCoffeeShops, CoffeeShop } from "@/services/coffeeShopServices";
import { useAuth } from "@clerk/clerk-expo";

export default function CoffeeShopsScreen() {
  const { getToken } = useAuth();
  let token = getToken();

  const router = useRouter();
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [coordinates, setCoordinates] = useState({
    lat: "37.7937",
    lng: "-122.3965",
    radius: "500",
    max: "10",
  });
  const [userLocationLoading, setUserLocationLoading] =
    useState<boolean>(false);

  useEffect(() => {
    loadCoffeeShops();
  }, []);

  const loadCoffeeShops = async () => {
    setLoading(true);
    console.log(loading);
    try {
      const shops = await fetchCoffeeShops(
        {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: coordinates.radius,
          max: coordinates.max,
        },
        token
      );
      setCoffeeShops(shops);
      console.log(coffeeShops);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to fetch coffee shops"
      );
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCoffeeShops();
  }, []);

  const getUserLocation = async () => {
    setUserLocationLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied",
          [{ text: "OK" }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCoordinates({
        ...coordinates,
        lat: location.coords.latitude.toString(),
        lng: location.coords.longitude.toString(),
      });

      // Fetch coffee shops with new location
      loadCoffeeShops();
    } catch (error) {
      Alert.alert("Error", "Unable to retrieve your location", [
        { text: "OK" },
      ]);
      console.error(error);
    } finally {
      setUserLocationLoading(false);
    }
  };

  const handleInputChange = (name: keyof typeof coordinates, value: string) => {
    setCoordinates({
      ...coordinates,
      [name]: value,
    });
  };

  const handleToggleFavorite = async (shop: CoffeeShop) => {
    try {
      if (shop.isFavorite) {
        await removeFromFavorites(shop.id);
      } else {
        await addToFavorites(shop);
      }

      // Update the local state to reflect the change
      setCoffeeShops((prevShops) =>
        prevShops.map((s) =>
          s.id === shop.id ? { ...s, isFavorite: !s.isFavorite } : s
        )
      );
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to ${shop.isFavorite ? "remove from" : "add to"} favorites`
      );
      console.error("Failed to toggle favorite:", error);
    }
  };

  const navigateToDetail = (shop: CoffeeShop) => {
    router.push(`/coffee-shops/${shop.id}`);
  };

  const renderCoffeeShopItem = ({ item }: { item: CoffeeShop }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigateToDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.name}</Text>
        <Text style={styles.locationText}>
          {Math.round(item.latitude * 10000) / 10000},
          {Math.round(item.longitude * 10000) / 10000}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleToggleFavorite(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={item.isFavorite ? "heart" : "heart-outline"}
          size={24}
          color={item.isFavorite ? "#e11d48" : "#6b7280"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Coffee Shops Near You",
          headerTitleStyle: styles.headerTitle,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={coordinates.lat}
                onChangeText={(text) => handleInputChange("lat", text)}
                keyboardType="numeric"
                placeholder="Latitude"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={coordinates.lng}
                onChangeText={(text) => handleInputChange("lng", text)}
                keyboardType="numeric"
                placeholder="Longitude"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Radius (m)</Text>
              <TextInput
                style={styles.input}
                value={coordinates.radius}
                onChangeText={(text) => handleInputChange("radius", text)}
                keyboardType="numeric"
                placeholder="Radius"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Max Results</Text>
              <TextInput
                style={styles.input}
                value={coordinates.max}
                onChangeText={(text) => handleInputChange("max", text)}
                keyboardType="numeric"
                placeholder="Max"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.locationButton]}
              onPress={getUserLocation}
              disabled={userLocationLoading}
            >
              {userLocationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="location"
                    size={16}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Use My Location</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.searchButton]}
              onPress={loadCoffeeShops}
              disabled={loading && !refreshing}
            >
              {loading && !refreshing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="search"
                    size={16}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Search</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Coffee Shops</Text>
            <Text style={styles.resultsSubtitle}>
              {coffeeShops.length} results within {coordinates.radius}m
            </Text>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Finding coffee shops...</Text>
            </View>
          ) : coffeeShops.length > 0 ? (
            <FlatList
              data={coffeeShops}
              renderItem={renderCoffeeShopItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#3b82f6"]}
                  tintColor="#3b82f6"
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No coffee shops found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search parameters or location
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerTitle: {
    fontWeight: "600",
  },
  keyboardAvoid: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
    color: "#4b5563",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  buttonIcon: {
    marginRight: 6,
  },
  locationButton: {
    backgroundColor: "#4b5563",
  },
  searchButton: {
    backgroundColor: "#3b82f6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  resultsSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  listContent: {
    flexGrow: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#6b7280",
  },
  favoriteButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
