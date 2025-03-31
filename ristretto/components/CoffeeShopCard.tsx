import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CoffeeShop } from "../lib/api";
import { calculateDistance } from "../lib/location";

interface CoffeeShopCardProps {
  coffeeShop: CoffeeShop;
  userLatitude?: number;
  userLongitude?: number;
  onFavoritePress: () => void;
  onVisitPress: () => void;
}

export default function CoffeeShopCard({
  coffeeShop,
  userLatitude,
  userLongitude,
  onFavoritePress,
  onVisitPress,
}: CoffeeShopCardProps) {
  // Calculate distance if user location is available
  const distance =
    userLatitude && userLongitude
      ? calculateDistance(
          userLatitude,
          userLongitude,
          coffeeShop.latitude,
          coffeeShop.longitude
        )
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{coffeeShop.name}</Text>

        {distance !== null && (
          <Text style={styles.distance}>
            {distance < 1
              ? `${Math.round(distance * 1000)} m`
              : `${distance.toFixed(1)} km`}
            {" away"}
          </Text>
        )}

        <View style={styles.coordinates}>
          <Text style={styles.coordinateText}>
            {coffeeShop.latitude.toFixed(6)}, {coffeeShop.longitude.toFixed(6)}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.favoriteButton]}
          onPress={onFavoritePress}
        >
          <Ionicons
            name={coffeeShop.isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={coffeeShop.isFavorite ? "#ef4444" : "#6b7280"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.visitButton]}
          onPress={onVisitPress}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
  },
  coordinates: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  coordinateText: {
    fontSize: 12,
    color: "#6b7280",
  },
  actionsContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  favoriteButton: {
    backgroundColor: "#fee2e2",
  },
  visitButton: {
    backgroundColor: "#dbeafe",
  },
});
