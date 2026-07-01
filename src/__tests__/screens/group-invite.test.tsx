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
import InviteMemberScreen from "@/app/(app)/groups/[groupId]/invite";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen() {
  const qc = createTestQueryClient();
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <InviteMemberScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockBack.mockReset();
  (apiFetch as jest.Mock).mockReset();
  (apiFetch as jest.Mock).mockImplementation((path: string) => {
    if (path === "/groups/g1")
      return Promise.resolve({ data: { id: "g1", name: "Bali Trip" } });
    return Promise.resolve({ data: null });
  });
});

test("requires an email before sending", async () => {
  const { getByText } = await renderScreen();
  await fireEvent.press(getByText("Send invitation"));
  await waitFor(() =>
    expect(getByText("Email address is required")).toBeTruthy(),
  );
  expect(apiFetch).not.toHaveBeenCalledWith(
    "/groups/g1/invitations",
    expect.anything(),
  );
});

test("flags an invalid email while typing", async () => {
  const { getByText, getByPlaceholderText } = await renderScreen();
  await fireEvent.changeText(
    getByPlaceholderText("name@example.com"),
    "not-an-email",
  );
  await waitFor(() => expect(getByText("Invalid email address")).toBeTruthy());
});

test("sends the invitation and shows the success screen", async () => {
  const { getByText, getByPlaceholderText } = await renderScreen();
  await fireEvent.changeText(
    getByPlaceholderText("name@example.com"),
    "new@example.com",
  );
  await fireEvent.press(getByText("Send invitation"));
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/groups/g1/invitations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "new@example.com" }),
        headers: { "Idempotency-Key": "test-key" },
      }),
    ),
  );
  await waitFor(() => expect(getByText("Invitation sent")).toBeTruthy());
  expect(getByText(/new@example.com/)).toBeTruthy();
  expect(getByText("Send another")).toBeTruthy();
  await fireEvent.press(getByText("Done"));
  expect(mockBack).toHaveBeenCalled();
});

test("send another returns to the form", async () => {
  const { getByText, getByPlaceholderText } = await renderScreen();
  await fireEvent.changeText(
    getByPlaceholderText("name@example.com"),
    "new@example.com",
  );
  await fireEvent.press(getByText("Send invitation"));
  await waitFor(() => expect(getByText("Invitation sent")).toBeTruthy());
  await fireEvent.press(getByText("Send another"));
  await waitFor(() =>
    expect(getByPlaceholderText("name@example.com")).toBeTruthy(),
  );
});
