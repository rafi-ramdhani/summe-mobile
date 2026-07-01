import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { STORAGE_KEYS } from "@/lib/config";

type IntroState = {
  hasSeenIntro: boolean;
  markSeen: () => void;
  hydrate: () => Promise<void>;
};

export const useIntroStore = create<IntroState>((set) => ({
  hasSeenIntro: false,
  markSeen: () => {
    AsyncStorage.setItem(STORAGE_KEYS.hasSeenIntro, "true");
    set({ hasSeenIntro: true });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.hasSeenIntro);
    set({ hasSeenIntro: stored === "true" });
  },
}));
