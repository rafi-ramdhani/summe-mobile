// Leaf module: locale constants/types with NO app imports.
// Kept dependency-free so it can be imported by both `@/lib/i18n` and
// `@/stores/localeStore` without creating a require cycle between them
// (localeStore must NOT import from i18n.ts, and i18n.ts imports the
// store; see the module-eval-order bug this file fixes).

export type Locale = "id" | "en";
export const VALID_LOCALES: Locale[] = ["id", "en"];
export const DEFAULT_LOCALE: Locale = "en";

export function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && VALID_LOCALES.includes(value as Locale);
}
