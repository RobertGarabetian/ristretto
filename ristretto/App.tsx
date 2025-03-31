// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import CoffeeShopsScreen from "./screens/CoffeeShopsScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="CoffeeShops"
          component={CoffeeShopsScreen}
          options={{ title: "Nearby Coffee Shops" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
