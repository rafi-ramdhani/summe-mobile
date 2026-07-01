import { useLocaleStore } from "@/stores/localeStore";
import type { Locale } from "@/lib/locale";

export type { Locale } from "@/lib/locale";
export { VALID_LOCALES, DEFAULT_LOCALE, isValidLocale } from "@/lib/locale";

export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale);
}
