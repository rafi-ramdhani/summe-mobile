const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: mockReplace }),
  useLocalSearchParams: () => ({ groupId: "g1" }),
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
  generateUUID: () => "test-key",
}));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import GroupSettingsScreen from "@/app/(app)/groups/[groupId]/settings";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <GroupSettingsScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

const group = {
  id: "g1",
  name: "Bali Trip",
  status: "active",
  currency: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  members: [
    { id: "u1", role: "owner", email: "me@example.com", name: "Me", isManaged: false },
    { id: "u2", role: "member", email: "j@example.com", name: "Jane", isManaged: false },
  ],
};

beforeEach(() => {
  mockBack.mockReset();
  mockReplace.mockReset();
  (apiFetch as jest.Mock).mockReset();
  useAuthStore.setState({
    session: { user: { id: "u1", email: "me@example.com", name: "Me" } },
  });
  (apiFetch as jest.Mock).mockImplementation(
    (path: string, init?: RequestInit) => {
      if (path === "/groups/g1" && !init)
        return Promise.resolve({ data: group });
      if (path === "/currencies")
        return Promise.resolve({
          data: [{ code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" }],
        });
      return Promise.resolve({ data: group });
    },
  );
});

test("prefills the group name and currency, hides Save until changed", async () => {
  const { getByText, getByDisplayValue, queryByText } = await renderScreen();
  await waitFor(() => expect(getByDisplayValue("Bali Trip")).toBeTruthy());
  expect(getByText(/IDR/)).toBeTruthy();
  expect(getByText("Danger Zone")).toBeTruthy();
  expect(getByText("Archive group")).toBeTruthy();
  expect(getByText("Delete group")).toBeTruthy();
  expect(queryByText("Save Changes")).toBeNull();
});

test("renaming shows Save Changes and PATCHes the group", async () => {
  const { getByText, getByDisplayValue } = await renderScreen();
  await waitFor(() => expect(getByDisplayValue("Bali Trip")).toBeTruthy());
  await fireEvent.changeText(getByDisplayValue("Bali Trip"), "Lombok Trip");
  await waitFor(() => expect(getByText("Save Changes")).toBeTruthy());
  await fireEvent.press(getByText("Save Changes"));
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/groups/g1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Lombok Trip", currency: "IDR" }),
        headers: { "Idempotency-Key": "test-key" },
      }),
    ),
  );
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
});

test("shows Unarchive for archived groups", async () => {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1")
      return Promise.resolve({ data: { ...group, status: "archived" } });
    if (path === "/currencies") return Promise.resolve({ data: [] });
    return Promise.resolve({ data: null });
  });
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Unarchive group")).toBeTruthy());
});

test("non-owners are not authorized", async () => {
  useAuthStore.setState({
    session: { user: { id: "u2", email: "j@example.com", name: "Jane" } },
  });
  const { getByText } = await renderScreen();
  await waitFor(() =>
    expect(
      getByText("You are not authorized to view this page."),
    ).toBeTruthy(),
  );
});
