import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SignupScreen from "./screen/SignupScreen";
import LoginScreen from "./screen/LoginScreen";
import HomeScreen from "./screen/HomeScreen";
import PredictScreen from "./screen/PredictScreen";
import GameRatingScreen from "./screen/GameRatingScreen";
import { UserProvider } from "./context/UserContext";
import { LeagueProvider } from "./context/LeagueContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <LeagueProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">

          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />

          {/* 🔥 Home은 Tab 화면 */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Predict"
            component={PredictScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="GameRating"
            component={GameRatingScreen}
            options={{ headerShown: false }}
          />

        </Stack.Navigator>
      </NavigationContainer>
      </LeagueProvider>
    </UserProvider>
  );
}