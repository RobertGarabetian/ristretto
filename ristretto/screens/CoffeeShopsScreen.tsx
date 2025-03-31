// screens/CoffeeShopsScreen.tsx
import React, { useState, useEffect } from "react";
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
} from "react-native";
import * as Location from "expo-location";

type CoffeeShop = string;

interface CoffeeShopResponse {
  coffeeShops: CoffeeShop[];
}

export default function CoffeeShopsScreen() {
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [coordinates, setCoordinates] = useState({
    lat: "37.7937",
    lng: "-122.3965",
    radius: "500",
    max: "10",
  });
  const [userLocationLoading, setUserLocationLoading] =
    useState<boolean>(false);

  useEffect(() => {
    fetchCoffeeShops();
  }, []);

  const fetchCoffeeShops = async () => {
    setLoading(true);

    try {
      // Replace with your actual backend URL
      const backendUrl = "http://localhost:8080";
      // Use your server IP, not localhost for mobile
      const url = `${backendUrl}/coffee_shops?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${coordinates.radius}&max=${coordinates.max}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: CoffeeShopResponse = await response.json();
      setCoffeeShops(data.coffeeShops);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to fetch coffee shops",
        [{ text: "OK" }]
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      fetchCoffeeShops();
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

  const renderCoffeeShopItem = ({
    item,
    index,
  }: {
    item: CoffeeShop;
    index: number;
  }) => (
    <View style={styles.listItem}>
      <Text style={styles.shopName}>{item}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView style={styles.scrollContainer}>
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
                  <Text style={styles.buttonText}>Use My Location</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.searchButton]}
                onPress={fetchCoffeeShops}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Coffee Shops Near You</Text>
            <Text style={styles.resultsSubtitle}>
              Showing {coffeeShops.length} results within {coordinates.radius}m
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : coffeeShops.length > 0 ? (
              <FlatList
                data={coffeeShops}
                renderItem={renderCoffeeShopItem}
                keyExtractor={(_, index) => index.toString()}
                style={styles.list}
                scrollEnabled={false} // Disable scrolling in FlatList since we're in a ScrollView
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No coffee shops found in this area.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#4b5563",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  locationButton: {
    backgroundColor: "#4b5563",
  },
  searchButton: {
    backgroundColor: "#3b82f6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  resultsContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  shopName: {
    fontSize: 16,
    color: "#111827",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
});
