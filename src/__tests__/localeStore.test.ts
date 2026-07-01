jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve("id")),
  setItem: jest.fn(() => Promise.resolve()),
}));
import { useLocaleStore } from "@/stores/localeStore";

test("hydrate reads persisted locale", async () => {
  await useLocaleStore.getState().hydrate();
  expect(useLocaleStore.getState().locale).toBe("id");
});
test("setLocale updates and persists", () => {
  useLocaleStore.getState().setLocale("en");
  expect(useLocaleStore.getState().locale).toBe("en");
});
