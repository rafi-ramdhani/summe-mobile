import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";
import { create } from "zustand";
import { STORAGE_KEYS } from "@/lib/config";

export type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  hydrate: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  setTheme: (theme) => {
    colorScheme.set(theme);
    AsyncStorage.setItem(STORAGE_KEYS.theme, theme);
    set({ theme });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.theme);
    const theme: Theme = stored === "dark" ? "dark" : "light";
    colorScheme.set(theme);
    set({ theme });
  },
}));
