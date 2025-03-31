import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

import * as SplashScreen from "expo-splash-screen";
import { useCallback } from "react";
import { View } from "react-native";
import { useFonts } from "@expo-google-fonts/inter";
import React from "react";
import { ClerkProvider } from "@clerk/clerk-expo";

// Keep the splash screen visible while we initialize resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InterRegular: require("../assets/fonts/Inter-Regular.ttf"),
    InterMedium: require("../assets/fonts/Inter-Medium.ttf"),
    InterSemiBold: require("../assets/fonts/Inter-SemiBold.ttf"),
    InterBold: require("../assets/fonts/Inter-Bold.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ClerkProvider tokenCache={tokenCache}>
        <StatusBar style="auto" />
        <Slot />
      </ClerkProvider>
    </View>
  );
}
