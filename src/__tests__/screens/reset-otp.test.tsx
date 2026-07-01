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
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { apiFetch } from "@/lib/api";
import { renderWithClient } from "@/lib/test-utils";
import ResetOtpScreen from "@/app/(auth)/reset-otp";

function renderScreen() {
  return renderWithClient(<ResetOtpScreen />);
}

beforeEach(() => {
  mockPush.mockClear();
  mockUseLocalSearchParams.mockReturnValue({ email: "a@b.com" });
  (apiFetch as jest.Mock).mockReset();
});

test("verifies the reset code and routes to reset-password with the returned token", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ data: { token: "tok123" } });
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("123456"), "123456");
  await fireEvent.press(getByText("Verify code"));

  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/verify-reset-otp",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", code: "123456" }),
      }),
    ),
  );
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/reset-password",
      params: { token: "tok123", email: "a@b.com" },
    }),
  );
});

test("shows the length validation message while the code is incomplete, then clears it at 6", async () => {
  const { getByPlaceholderText, getByText, queryByText } = await renderScreen();
  const input = getByPlaceholderText("123456");

  await fireEvent.changeText(input, "123");
  expect(getByText("Code must be exactly 6 characters")).toBeTruthy();

  await fireEvent.changeText(input, "123456");
  expect(queryByText("Code must be exactly 6 characters")).toBeNull();
});

test("shows Missing email fallback and a way back to forgot-password when email param is absent", async () => {
  mockUseLocalSearchParams.mockReturnValue({});
  const { getByText } = await renderScreen();

  expect(getByText("Invalid Request")).toBeTruthy();
  await fireEvent.press(getByText("Back"));
  expect(mockPush).toHaveBeenCalledWith("/forgot-password");
});

test("resend is cooldown-disabled for 60s, then enabled and calls forgot-password", async () => {
  jest.useFakeTimers();
  const { getByText } = await renderScreen();

  expect(getByText("Resend code in 60s")).toBeTruthy();

  for (let i = 0; i < 60; i++) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }

  expect(getByText("Resend code")).toBeTruthy();

  (apiFetch as jest.Mock).mockResolvedValue(undefined);
  await fireEvent.press(getByText("Resend code"));

  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/forgot-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    ),
  );

  jest.useRealTimers();
});
