import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { InvoiceProvider } from "@/context/InvoiceContext";
import { SettingsProvider } from "@/context/SettingsContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.card },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: "600" as const, color: Colors.text },
        contentStyle: { backgroundColor: Colors.surface },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-invoice"
        options={{
          title: "New Invoice",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="invoice-preview"
        options={{
          title: "Invoice",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <SettingsProvider>
          <InvoiceProvider>
            <RootLayoutNav />
          </InvoiceProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
