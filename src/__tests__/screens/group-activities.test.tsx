const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ groupId: "g1" }),
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import { render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import GroupActivitiesScreen from "@/app/(app)/groups/[groupId]/activities";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <GroupActivitiesScreen />
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

function paginated(data: unknown[]) {
  return {
    data,
    meta: {
      pagination: { page: 1, perPage: 20, total: data.length, totalPages: 1 },
    },
  };
}

beforeEach(() => {
  mockBack.mockReset();
  (apiFetch as jest.Mock).mockReset();
  useAuthStore.setState({
    session: { user: { id: "u1", email: "me@example.com", name: "Me" } },
  });
});

test("renders activity messages with actor names and amounts", async () => {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1") return Promise.resolve({ data: group });
    if (path.startsWith("/groups/g1/activities"))
      return Promise.resolve(
        paginated([
          {
            id: "a1",
            groupId: "g1",
            userId: "u2",
            action: "expense_created",
            data: { name: "Dinner" },
            createdAt: "2026-06-20T00:00:00.000Z",
          },
          {
            id: "a2",
            groupId: "g1",
            userId: "u1",
            action: "settlement_created",
            data: { amount: "50000" },
            createdAt: "2026-06-21T00:00:00.000Z",
          },
          {
            id: "a3",
            groupId: "g1",
            userId: "u1",
            action: "member_invited",
            data: { email: "new@example.com" },
            createdAt: "2026-06-22T00:00:00.000Z",
          },
        ]),
      );
    return Promise.resolve({ data: null });
  });
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText(/added the expense/)).toBeTruthy());
  expect(getByText("Jane")).toBeTruthy();
  expect(getByText("Dinner")).toBeTruthy();
  expect(getByText(/settled up for/)).toBeTruthy();
  expect(getByText("Rp 50,000")).toBeTruthy();
  expect(getByText(/invited/)).toBeTruthy();
  expect(getByText("new@example.com")).toBeTruthy();
});

test("shows the empty state when there are no activities", async () => {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1") return Promise.resolve({ data: group });
    if (path.startsWith("/groups/g1/activities"))
      return Promise.resolve(paginated([]));
    return Promise.resolve({ data: null });
  });
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("No activities yet")).toBeTruthy());
});

test("shows an error message when activities fail to load", async () => {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1") return Promise.resolve({ data: group });
    return Promise.reject(new Error("boom"));
  });
  const { getByText } = await renderScreen();
  await waitFor(() =>
    expect(getByText("Failed to load activities.")).toBeTruthy(),
  );
});
