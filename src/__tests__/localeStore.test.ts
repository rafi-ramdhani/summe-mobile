jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve("id")),
  setItem: jest.fn(() => Promise.resolve()),
}));
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocaleStore } from "@/stores/localeStore";
import { STORAGE_KEYS } from "@/lib/config";

test("hydrate reads persisted locale", async () => {
  await useLocaleStore.getState().hydrate();
  expect(useLocaleStore.getState().locale).toBe("id");
});

test("setLocale updates and persists", () => {
  useLocaleStore.getState().setLocale("en");
  expect(useLocaleStore.getState().locale).toBe("en");
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.locale, "en");
});

test("regression: importing @/lib/i18n before @/stores/localeStore does not leave locale undefined", () => {
  // Guards against a require-cycle bug: i18n.ts imports useLocaleStore, and
  // localeStore.ts used to import DEFAULT_LOCALE/isValidLocale back from
  // i18n.ts. Since zustand's `create(initializer)` runs synchronously at
  // module-eval time, if @/lib/i18n was required first, the circular
  // require returned i18n's still-incomplete exports (DEFAULT_LOCALE
  // undefined), so the store's initial `locale` silently became
  // `undefined` instead of "en". The fix moves the shared constants into
  // a dependency-free leaf module (@/lib/locale) that neither i18n.ts nor
  // localeStore.ts's counterpart depends on circularly.
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/lib/i18n");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useLocaleStore: isolatedStore } = require("@/stores/localeStore");
    expect(isolatedStore.getState().locale).toBe("en");
  });
});
