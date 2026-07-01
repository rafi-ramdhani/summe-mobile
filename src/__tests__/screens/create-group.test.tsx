const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn() }),
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
  generateUUID: () => "test-key",
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import CreateGroupScreen from "@/app/(app)/groups/create";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <CreateGroupScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockBack.mockReset();
  mockPush.mockReset();
  (apiFetch as jest.Mock).mockReset();
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/currencies") return Promise.resolve({ data: [] });
    if (path === "/groups") return Promise.resolve({ data: { id: "g1" } });
    return Promise.resolve({ data: null });
  });
});

test("shows a required error when submitting an empty name", async () => {
  await renderScreen();
  const buttons = screen.getAllByText("Create group");
  fireEvent.press(buttons[buttons.length - 1]);
  await waitFor(() =>
    expect(screen.getByText("Group name is required")).toBeTruthy(),
  );
  expect(apiFetch).not.toHaveBeenCalledWith("/groups", expect.anything());
});

test("creates the group and navigates back", async () => {
  await renderScreen();
  await fireEvent.changeText(
    screen.getByPlaceholderText("e.g. Bali Trip"),
    "Bali Trip",
  );
  const buttons = screen.getAllByText("Create group");
  await fireEvent.press(buttons[buttons.length - 1]);
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/groups",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Bali Trip", currency: "IDR" }),
        headers: { "Idempotency-Key": "test-key" },
      }),
    ),
  );
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
});
