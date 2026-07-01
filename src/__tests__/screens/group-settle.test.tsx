const mockBack = jest.fn();
let mockParams: Record<string, string | undefined> = { groupId: "g1" };
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
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
import SettleScreen from "@/app/(app)/groups/[groupId]/settle";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <SettleScreen />
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
    { id: "u1", role: "owner", email: "me@example.com", name: "Me", status: "active", isManaged: false },
    { id: "u2", role: "member", email: "j@example.com", name: "Jane", status: "active", isManaged: false },
    { id: "m1", role: "member", email: null, name: "Mom", status: "active", isManaged: true },
  ],
  expenses: [],
  balances: [],
  settlements: [],
  debts: [
    { from: "u1", to: "u2", amount: 75000 },
    { from: "m1", to: "u2", amount: 30000 },
  ],
};

beforeEach(() => {
  mockBack.mockReset();
  mockParams = { groupId: "g1" };
  (apiFetch as jest.Mock).mockReset();
  useAuthStore.setState({
    session: { user: { id: "u1", email: "me@example.com", name: "Me" } },
  });
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1") return Promise.resolve({ data: group });
    return Promise.resolve({ data: null });
  });
});

test("lists only the current user's transfers with amounts", async () => {
  const { getByText, queryByText } = await renderScreen();
  await waitFor(() => expect(getByText("1 transfers")).toBeTruthy());
  expect(getByText(/Me \(You\) → Jane/)).toBeTruthy();
  expect(getByText("Rp 75,000")).toBeTruthy();
  expect(getByText("Pay")).toBeTruthy();
  // Mom's debt belongs to the managed member, not the current user
  expect(queryByText(/Mom → Jane/)).toBeNull();
});

test("shows the empty state when the user owes nothing", async () => {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1")
      return Promise.resolve({ data: { ...group, debts: [] } });
    return Promise.resolve({ data: null });
  });
  const { getByText } = await renderScreen();
  await waitFor(() =>
    expect(getByText("You don't have any transfers to make.")).toBeTruthy(),
  );
});

test("settle-for-them shows the managed member's transfers when owner", async () => {
  mockParams = { groupId: "g1", as: "m1" };
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Settle for Mom")).toBeTruthy());
  expect(getByText(/Mom → Jane/)).toBeTruthy();
  expect(getByText("Rp 30,000")).toBeTruthy();
});

test("recording a payment posts the settlement and navigates back", async () => {
  const { getByText, getAllByText, getByPlaceholderText } =
    await renderScreen();
  await waitFor(() => expect(getByText("Pay")).toBeTruthy());
  await fireEvent.press(getByText("Pay"));
  // "Record payment" is both the modal title and the submit button
  await waitFor(() =>
    expect(getAllByText("Record payment").length).toBeGreaterThan(1),
  );
  await fireEvent.changeText(getByPlaceholderText("0"), "50000");
  const buttons = getAllByText("Record payment");
  await fireEvent.press(buttons[buttons.length - 1]);
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/groups/g1/settlements",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ payeeId: "u2", amount: "50000" }),
        headers: { "Idempotency-Key": "test-key" },
      }),
    ),
  );
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
});
