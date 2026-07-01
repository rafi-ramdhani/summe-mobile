const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import ProfileScreen from "@/app/(app)/profile";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <ProfileScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockBack.mockReset();
  (apiFetch as jest.Mock).mockReset();
  (apiFetch as jest.Mock).mockImplementation(
    (path: string, init?: RequestInit) => {
      if (path === "/users/me" && !init) {
        return Promise.resolve({
          data: { id: "u1", name: "Old Name", email: "a@b.co" },
        });
      }
      return Promise.resolve({
        data: { id: "u1", name: "New Name", email: "a@b.co" },
      });
    },
  );
});

test("prefills the name and hides Save until changed", async () => {
  await renderScreen();
  await waitFor(() => expect(screen.getByDisplayValue("Old Name")).toBeTruthy());
  expect(screen.queryByText("Save Changes")).toBeNull();
});

test("saves the name and navigates back", async () => {
  await renderScreen();
  await waitFor(() => expect(screen.getByDisplayValue("Old Name")).toBeTruthy());
  await fireEvent.changeText(screen.getByDisplayValue("Old Name"), "New Name");
  await fireEvent.press(screen.getByText("Save Changes"));
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/users/me",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      }),
    ),
  );
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
});
