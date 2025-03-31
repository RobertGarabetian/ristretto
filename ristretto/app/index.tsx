import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();

  // Show loading indicator while auth state is being determined
  if (isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isSignedIn) {
    return <Redirect href="/(app)/coffee-shops" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
