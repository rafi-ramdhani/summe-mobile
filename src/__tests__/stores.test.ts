jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve("dark")),
  setItem: jest.fn(() => Promise.resolve()),
}));
jest.mock("nativewind", () => ({ colorScheme: { set: jest.fn() } }));
import { useToastStore } from "@/stores/toastStore";
import { useThemeStore } from "@/stores/themeStore";

test("addToast appends a visible toast", () => {
  // Fake timers so the internal 3000ms/150ms setTimeouts don't leak as
  // open handles past the end of the test run.
  jest.useFakeTimers();
  useToastStore.getState().addToast("hi", "success");
  const t = useToastStore.getState().toasts.at(-1)!;
  expect(t.message).toBe("hi");
  expect(t.isVisible).toBe(true);
  jest.runAllTimers();
  jest.useRealTimers();
});
test("setTheme updates store", () => {
  useThemeStore.getState().setTheme("dark");
  expect(useThemeStore.getState().theme).toBe("dark");
});
