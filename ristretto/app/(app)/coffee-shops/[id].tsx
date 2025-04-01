// app/(app)/coffee-shops/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Image,
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  addToFavorites,
  removeFromFavorites,
  recordVisit,
  CoffeeShop,
  fetchCoffeeShopById,
} from "@/services/coffeeShopServices";

export default function CoffeeShopDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [coffeeShop, setCoffeeShop] = useState<CoffeeShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [recordingVisit, setRecordingVisit] = useState(false);

  useEffect(() => {
    loadCoffeeShopDetails();
  }, [id]);

  const loadCoffeeShopDetails = async () => {
    if (!id || typeof id !== "string") {
      Alert.alert("Error", "Invalid coffee shop ID");
      router.back();
      return;
    }

    setLoading(true);
    try {
      const shop = await fetchCoffeeShopById(id);
      setCoffeeShop(shop);
      setIsFavorite(shop.isFavorite || false);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to load coffee shop details. Please try again."
      );
      console.error("Failed to load coffee shop:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!coffeeShop) return;

    setSavingFavorite(true);
    try {
      if (isFavorite) {
        await removeFromFavorites(coffeeShop.id);
        setIsFavorite(false);
      } else {
        await addToFavorites(coffeeShop);
        setIsFavorite(true);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to ${isFavorite ? "remove from" : "add to"} favorites`
      );
      console.error("Favorite operation failed:", error);
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleRecordVisit = async () => {
    if (!coffeeShop) return;

    setRecordingVisit(true);
    try {
      await recordVisit(coffeeShop);
      Alert.alert("Success", "Your visit has been recorded!");
    } catch (error) {
      Alert.alert("Error", "Failed to record your visit");
      console.error("Record visit failed:", error);
    } finally {
      setRecordingVisit(false);
    }
  };

  const openMaps = () => {
    if (!coffeeShop) return;

    const { latitude, longitude, name } = coffeeShop;
    const label = encodeURIComponent(name);

    // Different formats for iOS and Android
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Couldn't open maps application");
        console.error("Opening maps failed:", err);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: coffeeShop?.name || "Coffee Shop",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleToggleFavorite}
              disabled={savingFavorite || loading}
              style={styles.favoriteButton}
            >
              {savingFavorite ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color={isFavorite ? "#e11d48" : "#6b7280"}
                />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading coffee shop details...</Text>
        </View>
      ) : coffeeShop ? (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.card}>
            {/* Shop Image Placeholder */}
            <View style={styles.imagePlaceholder}>
              <Ionicons name="cafe" size={48} color="#6b7280" />
            </View>

            {/* Shop Details */}
            <View style={styles.detailsSection}>
              <Text style={styles.shopName}>{coffeeShop.name}</Text>

              <View style={styles.locationRow}>
                <Ionicons name="location" size={18} color="#6b7280" />
                <Text style={styles.locationText}>
                  {coffeeShop.latitude.toFixed(6)},{" "}
                  {coffeeShop.longitude.toFixed(6)}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.directionsButton]}
                  onPress={openMaps}
                >
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.visitButton]}
                  onPress={handleRecordVisit}
                  disabled={recordingVisit}
                >
                  {recordingVisit ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}>Record Visit</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Additional info could go here */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About this location</Text>
            <Text style={styles.infoText}>
              This is a coffee shop located at coordinates{" "}
              {coffeeShop.latitude.toFixed(4)},{" "}
              {coffeeShop.longitude.toFixed(4)}.
            </Text>

            {/* You could add more details here like hours, ratings, etc. */}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>
            We couldn't find this coffee shop. It may have been removed.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsSection: {
    padding: 16,
  },
  shopName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#6b7280",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  directionsButton: {
    backgroundColor: "#4b5563",
  },
  visitButton: {
    backgroundColor: "#3b82f6",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 6,
  },
  favoriteButton: {
    padding: 8,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
});
