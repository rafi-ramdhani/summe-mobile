const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));
const mockLogout = jest.fn();
jest.mock("@/lib/auth", () => ({ logout: () => mockLogout() }));

import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import { useThemeStore } from "@/stores/themeStore";
import { useLocaleStore } from "@/stores/localeStore";
import { SettingsMenu } from "@/components/dashboard/SettingsMenu";
import { AvatarMenu } from "@/components/dashboard/AvatarMenu";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function wrap(ui: ReactElement) {
  const qc = createTestQueryClient();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockLogout.mockReset();
  (apiFetch as jest.Mock).mockReset().mockResolvedValue(undefined);
  useThemeStore.setState({ theme: "light" });
  useLocaleStore.setState({ locale: "en" });
});

test("settings menu toggles the theme", async () => {
  await wrap(<SettingsMenu visible onClose={jest.fn()} />);
  await fireEvent.press(screen.getByText("Theme"));
  expect(useThemeStore.getState().theme).toBe("dark");
});

test("settings menu toggles the locale", async () => {
  await wrap(<SettingsMenu visible onClose={jest.fn()} />);
  await fireEvent.press(screen.getByText("Language"));
  expect(useLocaleStore.getState().locale).toBe("id");
});

test("avatar menu navigates to profile", async () => {
  await wrap(<AvatarMenu visible onClose={jest.fn()} />);
  await fireEvent.press(screen.getByText("Profile"));
  expect(mockPush).toHaveBeenCalledWith("/(app)/profile");
});

test("avatar menu logs out via the logout endpoint", async () => {
  await wrap(<AvatarMenu visible onClose={jest.fn()} />);
  await fireEvent.press(screen.getByText("Logout"));
  expect(apiFetch).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
});
