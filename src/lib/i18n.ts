import { useLocaleStore } from "@/stores/localeStore";

export type Locale = "id" | "en";
export const VALID_LOCALES: Locale[] = ["id", "en"];
export const DEFAULT_LOCALE: Locale = "en";
export function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && VALID_LOCALES.includes(value as Locale);
}
export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale);
}
