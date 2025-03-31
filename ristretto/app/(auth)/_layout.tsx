import { Stack } from "expo-router";
import { SignedOutProtected } from "../../lib/auth";
import React from "react";

export default function AuthLayout() {
  return (
    <SignedOutProtected>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#3b82f6",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        <Stack.Screen
          name="sign-in"
          options={{
            title: "Sign In",
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            title: "Sign Up",
          }}
        />
      </Stack>
    </SignedOutProtected>
  );
}
