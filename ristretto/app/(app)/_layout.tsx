import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SignedInProtected } from "../../lib/auth";
import React from "react";

export default function AppLayout() {
  return (
    <SignedInProtected>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#6b7280",
          headerStyle: {
            backgroundColor: "#3b82f6",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="coffee-shops"
          options={{
            title: "Coffee Shops",
            tabBarLabel: "Discover",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cafe-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favorites",
            tabBarLabel: "Favorites",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SignedInProtected>
  );
}
