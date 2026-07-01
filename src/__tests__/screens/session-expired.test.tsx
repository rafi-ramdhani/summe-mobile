const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { fireEvent } from "@testing-library/react-native";
import { renderWithClient } from "@/lib/test-utils";
import { useAuthStore } from "@/stores/authStore";
import SessionExpiredScreen from "@/app/(auth)/session-expired";

function renderScreen() {
  return renderWithClient(<SessionExpiredScreen />);
}

beforeEach(() => {
  mockPush.mockClear();
  useAuthStore.setState({ sessionExpired: true });
});

test("renders session expired copy", async () => {
  const { getByText } = await renderScreen();

  expect(getByText("Session expired")).toBeTruthy();
  expect(
    getByText(
      "Your session has expired. Please log in again to continue.",
    ),
  ).toBeTruthy();
});

test("pressing Go to login clears sessionExpired and navigates to /login", async () => {
  const { getByText } = await renderScreen();

  await fireEvent.press(getByText("Go to login"));

  expect(mockPush).toHaveBeenCalledWith("/login");
  expect(useAuthStore.getState().sessionExpired).toBe(false);
});
