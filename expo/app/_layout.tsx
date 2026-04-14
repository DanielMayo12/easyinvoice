import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { InvoiceProvider } from '@/context/InvoiceContext';
import { SettingsProvider } from '@/context/SettingsContext';
import Colors from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 2 } },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back', contentStyle: { backgroundColor: Colors.background }, headerShadowVisible: false, animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-invoice" options={{ title: 'New Invoice', presentation: 'modal', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary, headerTitleStyle: { color: Colors.text, fontWeight: '600' as const, fontSize: 17 } }} />
      <Stack.Screen name="invoice-preview" options={{ title: 'Invoice', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary, headerTitleStyle: { color: Colors.text, fontWeight: '600' as const, fontSize: 17 } }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SettingsProvider>
          <InvoiceProvider>
            <StatusBar style="dark" />
            <RootLayoutNav />
          </InvoiceProvider>
        </SettingsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
