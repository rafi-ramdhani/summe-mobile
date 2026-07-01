import "@/global.css";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { SpaceMono_400Regular, SpaceMono_700Bold } from "@expo-google-fonts/space-mono";
import { queryClient } from "@/lib/queryClient";
import { loadToken } from "@/lib/secureToken";
import { bootstrapAuth } from "@/lib/auth";
import { useThemeStore } from "@/stores/themeStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useIntroStore } from "@/stores/introStore";
import GlobalToasts from "@/components/GlobalToasts";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold,
    SpaceMono_400Regular, SpaceMono_700Bold,
  });
  useEffect(() => {
    (async () => {
      try {
        await loadToken();
        await Promise.all([
          useThemeStore.getState().hydrate(),
          useLocaleStore.getState().hydrate(),
          useIntroStore.getState().hydrate(),
        ]);
        await bootstrapAuth();
      } catch (error) {
        console.warn("Root bootstrap failed; continuing unauthenticated", error);
      } finally {
        setReady(true);
      }
    })();
  }, []);
  useEffect(() => {
    if (ready && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontsLoaded]);
  if (!ready || !fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
          <GlobalToasts />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
