const mockBack = jest.fn();
let mockParams: Record<string, string> = { groupId: "g1", expenseId: "create" };
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: false }),
  ),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
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
import ExpenseEditorScreen from "@/app/(app)/groups/[groupId]/expenses/[expenseId]";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <ExpenseEditorScreen />
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
  ],
  expenses: [
    {
      id: "e1",
      groupId: "g1",
      name: "Dinner",
      paidBy: "u2",
      createdBy: "u2",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
      isSettled: false,
      totalAmount: 30000,
      items: [
        {
          id: "i1",
          expenseId: "e1",
          name: "Food",
          amount: 15000,
          quantity: 2,
          splitKind: "equal",
          assignments: [
            { id: "a1", expenseItemId: "i1", assigneeId: "u1", value: 1 },
            { id: "a2", expenseItemId: "i1", assigneeId: "u2", value: 1 },
          ],
        },
      ],
    },
  ],
  balances: [],
  debts: [],
  settlements: [],
};

beforeEach(() => {
  mockBack.mockReset();
  mockParams = { groupId: "g1", expenseId: "create" };
  (apiFetch as jest.Mock).mockReset();
  useAuthStore.setState({
    session: { user: { id: "u1", email: "me@example.com", name: "Me" } },
  });
  (apiFetch as jest.Mock).mockImplementation(
    (path: string, init?: RequestInit) => {
      if (path === "/groups/g1" && !init)
        return Promise.resolve({ data: group });
      return Promise.resolve({ data: { id: "new" } });
    },
  );
});

test("create mode shows the scan area and defaults payer to the current user", async () => {
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Scan your receipt")).toBeTruthy());
  expect(getByText("Me (You)")).toBeTruthy();
  expect(getByText("or add manually")).toBeTruthy();
  expect(getByText("Save Expense")).toBeTruthy();
});

test("create mode blocks saving without a name and items", async () => {
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Save Expense")).toBeTruthy());
  await fireEvent.press(getByText("Save Expense"));
  await waitFor(() =>
    expect(getByText("Expense name is required")).toBeTruthy(),
  );
  expect(getByText("At least one item is required")).toBeTruthy();
  expect(apiFetch).not.toHaveBeenCalledWith(
    "/groups/g1/expenses",
    expect.anything(),
  );
});

test("edit mode hydrates the existing expense and updates it", async () => {
  mockParams = { groupId: "g1", expenseId: "e1" };
  const { getByText, getByDisplayValue } = await renderScreen();
  await waitFor(() => expect(getByDisplayValue("Dinner")).toBeTruthy());
  expect(getByText("Food")).toBeTruthy();
  expect(getByText(/2 members/)).toBeTruthy();
  expect(getByText("Update Expense")).toBeTruthy();

  await fireEvent.changeText(getByDisplayValue("Dinner"), "Fancy Dinner");
  await fireEvent.press(getByText("Update Expense"));
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/groups/g1/expenses/e1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Fancy Dinner" }),
        headers: { "Idempotency-Key": "test-key" },
      }),
    ),
  );
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
});

test("edit mode without changes navigates back without a PATCH", async () => {
  mockParams = { groupId: "g1", expenseId: "e1" };
  const { getByText, getByDisplayValue } = await renderScreen();
  await waitFor(() => expect(getByDisplayValue("Dinner")).toBeTruthy());
  await fireEvent.press(getByText("Update Expense"));
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
  expect(apiFetch).not.toHaveBeenCalledWith(
    "/groups/g1/expenses/e1",
    expect.objectContaining({ method: "PATCH" }),
  );
});

test("non-editors see the blocked banner and no save button", async () => {
  mockParams = { groupId: "g1", expenseId: "e1" };
  useAuthStore.setState({
    // u3 is not the creator, payer, or owner
    session: { user: { id: "u3", email: "x@example.com", name: "X" } },
  });
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1")
      return Promise.resolve({
        data: {
          ...group,
          members: [
            ...group.members,
            { id: "u3", role: "member", email: "x@example.com", name: "X", status: "active", isManaged: false },
          ],
        },
      });
    return Promise.resolve({ data: null });
  });
  const { getByText, queryByText } = await renderScreen();
  await waitFor(() =>
    expect(getByText("Cannot modify this expense")).toBeTruthy(),
  );
  expect(
    getByText(/Only the creator or payer of this expense/),
  ).toBeTruthy();
  expect(queryByText("Update Expense")).toBeNull();
});

test("adding an item through the item form updates the list and totals", async () => {
  const { getByText, getAllByText, getByPlaceholderText } =
    await renderScreen();
  await waitFor(() => expect(getByText("or add manually")).toBeTruthy());
  await fireEvent.press(getByText("or add manually"));
  await waitFor(() => expect(getByText("Item Name")).toBeTruthy());

  await fireEvent.changeText(
    getByPlaceholderText("e.g. Car Rental"),
    "Snacks",
  );
  const amountInputs = getAllByText("Amount per item");
  expect(amountInputs.length).toBeGreaterThan(0);
  await fireEvent.changeText(getByPlaceholderText("0"), "5000");
  // Select all members for an equal split
  await fireEvent.press(getByText("Select all"));
  // "Add item" is both the modal title and the submit button
  const addButtons = getAllByText("Add item");
  await fireEvent.press(addButtons[addButtons.length - 1]);

  await waitFor(() => expect(getByText("Snacks")).toBeTruthy());
  expect(getByText("Subtotal")).toBeTruthy();
  expect(getAllByText(/5,000/).length).toBeGreaterThan(0);
});
