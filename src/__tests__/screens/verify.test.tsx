const mockReplace = jest.fn();
const mockUseLocalSearchParams = jest.fn(() => ({}) as Record<string, string>);

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));
jest.mock("@/lib/auth", () => ({ bootstrapAuth: jest.fn() }));
jest.mock("@/lib/secureToken", () => ({ setToken: jest.fn() }));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { apiFetch } from "@/lib/api";
import { bootstrapAuth } from "@/lib/auth";
import { setToken } from "@/lib/secureToken";
import { renderWithClient } from "@/lib/test-utils";
import VerifyScreen from "@/app/(auth)/verify";

function renderScreen() {
  return renderWithClient(<VerifyScreen />);
}

beforeEach(() => {
  mockReplace.mockClear();
  mockUseLocalSearchParams.mockReturnValue({ email: "a@b.com" });
  (apiFetch as jest.Mock).mockReset();
  (bootstrapAuth as jest.Mock).mockReset();
  (setToken as jest.Mock).mockReset();
});

test("verifies the code, stores the token, and routes to setup-profile", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ data: { token: "tok123" } });
  (bootstrapAuth as jest.Mock).mockResolvedValue(undefined);
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("123456"), "123456");
  await fireEvent.press(getByText("Verify Email"));

  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", code: "123456" }),
      }),
    ),
  );
  await waitFor(() => expect(setToken).toHaveBeenCalledWith("tok123"));
  await waitFor(() => expect(bootstrapAuth).toHaveBeenCalled());
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/setup-profile"));
});

test("shows Missing email fallback and a way back to login when email param is absent", async () => {
  mockUseLocalSearchParams.mockReturnValue({});
  const { getByText } = await renderScreen();

  expect(getByText("Invalid Request")).toBeTruthy();
  await fireEvent.press(getByText("Back to Login"));
  expect(mockReplace).toHaveBeenCalledWith("/login");
});

test("resend is cooldown-disabled for 60s, then enabled and calls resend-verification", async () => {
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
      "/auth/resend-verification",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    ),
  );

  jest.useRealTimers();
});
