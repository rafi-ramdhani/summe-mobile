import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { STORAGE_KEYS } from "@/lib/config";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "@/lib/locale";

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  hydrate: () => Promise<void>;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => {
    AsyncStorage.setItem(STORAGE_KEYS.locale, locale);
    set({ locale });
  },
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.locale);
    if (isValidLocale(stored)) set({ locale: stored });
  },
}));
