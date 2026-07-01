const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
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
import SettlementsScreen from "@/app/(app)/groups/[groupId]/settlements";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <SettlementsScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

const members = [
  { id: "u1", role: "owner", email: "me@example.com", name: "Me", status: "active", isManaged: false },
  { id: "u2", role: "member", email: "j@example.com", name: "Jane", status: "active", isManaged: false },
];

const baseSettlement = {
  id: "s1",
  groupId: "g1",
  payerId: "u2",
  payeeId: "u1",
  amount: "50000",
  status: "pending",
  rejectionReason: null,
  createdAt: "2026-06-20T00:00:00.000Z",
  updatedAt: "2026-06-20T00:00:00.000Z",
};

function mockGroup(settlements: unknown[]) {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1")
      return Promise.resolve({
        data: {
          id: "g1",
          name: "Bali Trip",
          status: "active",
          currency: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
          members,
          settlements,
          expenses: [],
          balances: [],
          debts: [],
        },
      });
    return Promise.resolve({ data: null });
  });
}

beforeEach(() => {
  mockBack.mockReset();
  (apiFetch as jest.Mock).mockReset();
  useAuthStore.setState({
    session: { user: { id: "u1", email: "me@example.com", name: "Me" } },
  });
});

test("shows an actionable settlement with accept/decline for the payee", async () => {
  mockGroup([baseSettlement]);
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText(/Jane → Me \(You\)/)).toBeTruthy());
  expect(getByText("Rp 50,000")).toBeTruthy();
  expect(getByText("Accept")).toBeTruthy();
  expect(getByText("Decline")).toBeTruthy();
});

test("shows the empty actionable state", async () => {
  mockGroup([]);
  const { getByText } = await renderScreen();
  await waitFor(() =>
    expect(getByText("You have no actionable settlements.")).toBeTruthy(),
  );
});

test("history tab shows non-actionable settlements with status badges", async () => {
  mockGroup([
    {
      ...baseSettlement,
      id: "s2",
      payerId: "u1",
      payeeId: "u2",
      status: "rejected",
      rejectionReason: "Wrong amount",
    },
  ]);
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("History")).toBeTruthy());
  await fireEvent.press(getByText("History"));
  await waitFor(() => expect(getByText(/Me \(You\) → Jane/)).toBeTruthy());
  expect(getByText("Rejected")).toBeTruthy();
  expect(getByText('"Wrong amount"')).toBeTruthy();
});

test("pending settlement paid by me offers Cancel in history", async () => {
  mockGroup([
    { ...baseSettlement, id: "s3", payerId: "u1", payeeId: "u2" },
  ]);
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("History")).toBeTruthy());
  await fireEvent.press(getByText("History"));
  await waitFor(() => expect(getByText("Cancel")).toBeTruthy());
});
