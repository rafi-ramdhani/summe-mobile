const mockPush = jest.fn();
const mockUseLocalSearchParams = jest.fn(() => ({}) as Record<string, string>);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));
jest.mock("@/lib/password", () => ({
  ...jest.requireActual("@/lib/password"),
  getPasswordScore: jest.fn(),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { fireEvent, waitFor } from "@testing-library/react-native";
import { apiFetch } from "@/lib/api";
import { getPasswordScore } from "@/lib/password";
import { renderWithClient } from "@/lib/test-utils";
import ResetPasswordScreen from "@/app/(auth)/reset-password";

function renderScreen() {
  return renderWithClient(<ResetPasswordScreen />);
}

beforeEach(() => {
  mockPush.mockClear();
  mockUseLocalSearchParams.mockReturnValue({ token: "tok123" });
  (apiFetch as jest.Mock).mockReset();
  (getPasswordScore as jest.Mock).mockReset();
});

test("resets the password and navigates to /login with the reset-success param on a strong password", async () => {
  (getPasswordScore as jest.Mock).mockResolvedValue(4);
  (apiFetch as jest.Mock).mockResolvedValue(undefined);
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(
    getByPlaceholderText("New password"),
    "StrongPass123!",
  );
  await fireEvent.changeText(
    getByPlaceholderText("Re-enter password"),
    "StrongPass123!",
  );
  await fireEvent.press(getByText("Reset password"));

  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "tok123", password: "StrongPass123!" }),
      }),
    ),
  );
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/login",
      params: { reset: "success" },
    }),
  );
});

test("blocks submit and shows a form error when the password is weak", async () => {
  (getPasswordScore as jest.Mock).mockResolvedValue(1);
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("New password"), "weakpass");
  await fireEvent.changeText(
    getByPlaceholderText("Re-enter password"),
    "weakpass",
  );
  await fireEvent.press(getByText("Reset password"));

  await waitFor(() =>
    expect(getByText(/stronger password/i)).toBeTruthy(),
  );
  expect(apiFetch).not.toHaveBeenCalled();
});

test("shows Invalid Request fallback and routes to /forgot-password when token param is absent", async () => {
  mockUseLocalSearchParams.mockReturnValue({});
  const { getByText } = await renderScreen();

  expect(getByText("Invalid Request")).toBeTruthy();
  await fireEvent.press(getByText("Back"));
  expect(mockPush).toHaveBeenCalledWith("/forgot-password");
});
