// app/index.tsx
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  // If auth is still loading, you could show a splash screen here
  if (!isLoaded) {
    return null; // Or a splash screen component
  }

  // If user is not signed in, redirect to auth flow
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // If user is signed in, redirect to main app flow
  return <Redirect href="/(app)/coffee-shops" />;
}
