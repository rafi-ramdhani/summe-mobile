jest.mock("react-native-pager-view");
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import { waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { render } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import AppHome from "@/app/(app)/index";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <AppHome />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

function paginated(groups: unknown[]) {
  return {
    data: groups,
    meta: { pagination: { page: 1, perPage: 20, total: groups.length, totalPages: 1 } },
  };
}

beforeEach(() => (apiFetch as jest.Mock).mockReset());

test("renders the empty state when there are no groups or invitations", async () => {
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path.startsWith("/groups")) return Promise.resolve(paginated([]));
    if (path === "/users/me/invitations") return Promise.resolve({ data: [] });
    if (path === "/users/me/onboarding")
      return Promise.resolve({
        data: {
          tourStatus: "completed",
          checklistDismissed: true,
          steps: { createdGroup: null, addedExpense: null, invitedMember: null },
        },
      });
    return Promise.resolve(undefined);
  });
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("No groups yet.")).toBeTruthy());
});

test("renders the empty state with invitations-aware copy when a pending invitation exists", async () => {
  const invitation = {
    id: "inv1",
    groupId: "g1",
    name: "Bali Trip",
    inviterName: "Jane",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path.startsWith("/groups")) return Promise.resolve(paginated([]));
    if (path === "/users/me/invitations")
      return Promise.resolve({ data: [invitation] });
    if (path === "/users/me/onboarding")
      return Promise.resolve({
        data: {
          tourStatus: "completed",
          checklistDismissed: true,
          steps: { createdGroup: null, addedExpense: null, invitedMember: null },
        },
      });
    return Promise.resolve(undefined);
  });
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("No groups yet.")).toBeTruthy());
  expect(
    getByText("Accept an invitation above, or create a group of your own."),
  ).toBeTruthy();
  expect(getByText("You have 1 pending invitation")).toBeTruthy();
});

test("renders a group row when active groups exist", async () => {
  const group = {
    id: "g1",
    name: "Bali Trip",
    role: "owner",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-30T00:00:00.000Z",
    memberCount: 3,
    balance: 0,
    currency: { code: "USD", symbol: "$", name: "US Dollar" },
  };
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path.startsWith("/groups?page=1&perPage=20&status=active"))
      return Promise.resolve(paginated([group]));
    if (path.startsWith("/groups")) return Promise.resolve(paginated([]));
    if (path === "/users/me/invitations") return Promise.resolve({ data: [] });
    if (path === "/users/me/onboarding")
      return Promise.resolve({
        data: {
          tourStatus: "completed",
          checklistDismissed: true,
          steps: { createdGroup: null, addedExpense: null, invitedMember: null },
        },
      });
    return Promise.resolve(undefined);
  });
  const { getByText } = await renderScreen();
  await waitFor(() => expect(getByText("Bali Trip")).toBeTruthy());
  expect(getByText("Groups")).toBeTruthy();
});
