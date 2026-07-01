const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock("react-native-pager-view");
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: mockReplace }),
  useLocalSearchParams: () => ({ groupId: "g1" }),
}));
jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return { LinearGradient: View };
});
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import GroupDetailScreen from "@/app/(app)/groups/[groupId]/index";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <GroupDetailScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

const baseGroup = {
  id: "g1",
  name: "Bali Trip",
  role: "owner",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-20T00:00:00.000Z",
  memberCount: 3,
  balance: 0,
  currency: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  status: "active",
  members: [
    {
      id: "u1",
      role: "owner",
      createdAt: "2026-06-01T00:00:00.000Z",
      email: "me@example.com",
      name: "Me",
      status: "active",
      isManaged: false,
    },
    {
      id: "u2",
      role: "member",
      createdAt: "2026-06-02T00:00:00.000Z",
      email: "jane@example.com",
      name: "Jane",
      status: "active",
      isManaged: false,
    },
    {
      id: "m1",
      role: "member",
      createdAt: "2026-06-03T00:00:00.000Z",
      email: null,
      name: "Mom",
      status: "active",
      isManaged: true,
    },
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
      totalAmount: 150000,
      items: [
        {
          id: "i1",
          expenseId: "e1",
          name: "Food",
          amount: 150000,
          quantity: 1,
          splitKind: "equal",
          assignments: [
            { id: "a1", expenseItemId: "i1", assigneeId: "u1", value: 75000 },
            { id: "a2", expenseItemId: "i1", assigneeId: "u2", value: 75000 },
          ],
        },
      ],
    },
  ],
  balances: [
    { userId: "u1", amount: -75000 },
    { userId: "u2", amount: 75000 },
    { userId: "m1", amount: 0 },
  ],
  debts: [],
  settlements: [],
  invitations: [
    { id: "inv1", email: "new@example.com", createdAt: "2026-06-18T00:00:00.000Z" },
  ],
  replacements: [],
};

beforeEach(() => {
  mockBack.mockReset();
  mockReplace.mockReset();
  (apiFetch as jest.Mock).mockReset();
  useAuthStore.setState({
    session: { user: { id: "u1", email: "me@example.com", name: "Me" } },
  });
});

function mockGroup(group: unknown) {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1") return Promise.resolve({ data: group });
    return Promise.resolve(undefined);
  });
}

test("renders the header, meta line, and expenses tab content", async () => {
  mockGroup(baseGroup);
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Bali Trip")).toBeTruthy());
  expect(getByText(/Owner:/)).toBeTruthy();
  expect(getByText(/3 members/)).toBeTruthy();
  expect(getByText(/IDR/)).toBeTruthy();
  expect(getByText("Dinner")).toBeTruthy();
  expect(getByText(/Paid by Jane/)).toBeTruthy();
  expect(getByText(/split 2 ways/)).toBeTruthy();
  expect(getByText("Add expense")).toBeTruthy();
});

test("shows the empty state when there are no expenses", async () => {
  mockGroup({ ...baseGroup, expenses: [] });
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("No expenses yet")).toBeTruthy());
  expect(getByText("Add one to start splitting.")).toBeTruthy();
});

test("shows the group-not-found receipt when the group fails to load", async () => {
  (apiFetch as jest.Mock).mockRejectedValue(new Error("nope"));
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Group not found")).toBeTruthy());
  expect(getByText("Go to groups")).toBeTruthy();
  fireEvent.press(getByText("Go to groups"));
  expect(mockReplace).toHaveBeenCalledWith("/(app)");
});

test("renders balances with signed amounts", async () => {
  mockGroup(baseGroup);
  const { getByText, getAllByText } = await renderScreen();
  await waitFor(() => expect(getByText("Net Balance")).toBeTruthy());
  // "Me (You)" also appears on the members page (all pager pages mount)
  expect(getAllByText("Me (You)").length).toBeGreaterThan(0);
  expect(getByText("-Rp 75,000")).toBeTruthy();
  expect(getByText("+Rp 75,000")).toBeTruthy();
});

test("switching to the balances tab shows the settle-up action", async () => {
  mockGroup(baseGroup);
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Bali Trip")).toBeTruthy());
  await fireEvent.press(getByText("Balances"));
  // u1 owes 75000, so the settle button is enabled and no idle caption shows
  expect(getByText("Settle up")).toBeTruthy();
});

test("shows the nothing-to-settle caption when the user owes nothing", async () => {
  mockGroup({
    ...baseGroup,
    balances: [
      { userId: "u1", amount: 75000 },
      { userId: "u2", amount: -75000 },
    ],
  });
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Bali Trip")).toBeTruthy());
  await fireEvent.press(getByText("Balances"));
  expect(getByText("You don't have anything to settle.")).toBeTruthy();
});

test("renders members with roles, managed badge, and pending invitations", async () => {
  mockGroup(baseGroup);
  const { getByText, getAllByText } = await renderScreen();
  // Member names can appear on multiple pager pages (balances + members)
  await waitFor(() => expect(getAllByText("Jane").length).toBeGreaterThan(0));
  expect(getAllByText("Me (You)").length).toBeGreaterThan(0);
  expect(getAllByText("Mom").length).toBeGreaterThan(0);
  expect(getByText("Managed")).toBeTruthy();
  expect(getByText("Owner")).toBeTruthy();
  expect(getAllByText("Member").length).toBeGreaterThan(0);
  expect(getByText("Pending Invitations")).toBeTruthy();
  expect(getByText("new@example.com")).toBeTruthy();
});

test("owner sees invite and add-managed actions on the members tab", async () => {
  mockGroup(baseGroup);
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Bali Trip")).toBeTruthy());
  await fireEvent.press(getByText("Members"));
  expect(getByText("Invite by email")).toBeTruthy();
  expect(getByText("Add managed member")).toBeTruthy();
});

test("non-owner sees the leave-group action on the members tab", async () => {
  useAuthStore.setState({
    session: { user: { id: "u2", email: "jane@example.com", name: "Jane" } },
  });
  mockGroup(baseGroup);
  const { getByText, queryByText } = await renderScreen();
  await waitFor(() => expect(getByText("Bali Trip")).toBeTruthy());
  await fireEvent.press(getByText("Members"));
  expect(getByText("Leave group")).toBeTruthy();
  expect(queryByText("Invite by email")).toBeNull();
  // Non-owners also do not get the settings icon
  expect(queryByText("Pending Invitations")).toBeNull();
});

test("archived groups show the read-only banner and no action bar", async () => {
  mockGroup({ ...baseGroup, status: "archived" });
  const { getByText, queryByText } = await renderScreen();
  await waitFor(() => expect(getByText("Bali Trip")).toBeTruthy());
  expect(getByText(/archived and read-only/)).toBeTruthy();
  expect(queryByText("Add expense")).toBeNull();
});

test("shows the replacement banner when the current user is the target", async () => {
  mockGroup({
    ...baseGroup,
    replacements: [
      {
        id: "r1",
        managedMemberId: "m1",
        managedMemberName: "Mom",
        targetUserId: "u1",
        requestedBy: "u2",
      },
    ],
  });
  const { getAllByText } = await renderScreen();
  // The banner renders on every pager page, so expect multiple matches
  await waitFor(() =>
    expect(
      getAllByText(/Jane is asking you to take over Mom's history/).length,
    ).toBeGreaterThan(0),
  );
  expect(getAllByText("Confirm").length).toBeGreaterThan(0);
  expect(getAllByText("Decline").length).toBeGreaterThan(0);
});

test("indonesian locale renders translated copy", async () => {
  const { useLocaleStore } = require("@/stores/localeStore");
  useLocaleStore.setState({ locale: "id" });
  mockGroup(baseGroup);
  const { getByText, getAllByText } = await renderScreen();
  await waitFor(() => expect(getByText(/Pemilik:/)).toBeTruthy());
  expect(getByText("Pengeluaran")).toBeTruthy();
  expect(getByText("Saldo")).toBeTruthy();
  // "Anggota" is both the tab label and the member role label
  expect(getAllByText("Anggota").length).toBeGreaterThan(0);
  useLocaleStore.setState({ locale: "en" });
});
