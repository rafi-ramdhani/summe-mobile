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
jest.mock("@/lib/auth", () => ({ bootstrapAuth: jest.fn() }));
jest.mock("@/components/GoogleButton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { fireEvent, waitFor } from "@testing-library/react-native";
import { apiFetch, ApiError } from "@/lib/api";
import { bootstrapAuth } from "@/lib/auth";
import { renderWithClient } from "@/lib/test-utils";
import LoginScreen from "@/app/(auth)/login";

function renderScreen() {
  return renderWithClient(<LoginScreen />);
}

beforeEach(() => {
  mockPush.mockClear();
  mockUseLocalSearchParams.mockReturnValue({});
  (apiFetch as jest.Mock).mockReset();
  (bootstrapAuth as jest.Mock).mockReset();
});

test("submits credentials and bootstraps", async () => {
  (apiFetch as jest.Mock).mockResolvedValue(undefined);
  (bootstrapAuth as jest.Mock).mockResolvedValue(undefined);
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("you@email.com"), "a@b.com");
  await fireEvent.changeText(getByPlaceholderText("Your password"), "secret12");
  await fireEvent.press(getByText("Log in"));

  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", password: "secret12" }),
      }),
    ),
  );
  await waitFor(() => expect(bootstrapAuth).toHaveBeenCalled());
});

test("redirects to /verify when login reports email_not_verified", async () => {
  (apiFetch as jest.Mock).mockRejectedValue(new ApiError(403, "Forbidden"));
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("you@email.com"), "a@b.com");
  await fireEvent.changeText(getByPlaceholderText("Your password"), "secret12");
  await fireEvent.press(getByText("Log in"));

  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/verify",
      params: { email: "a@b.com" },
    }),
  );
  expect(bootstrapAuth).not.toHaveBeenCalled();
});

test("shows the password reset success banner when reset=success", async () => {
  mockUseLocalSearchParams.mockReturnValue({ reset: "success" });
  const { getByText } = await renderScreen();

  expect(
    getByText("Password updated. Please log in with your new password."),
  ).toBeTruthy();
  expect(getByText("Password reset successfully.")).toBeTruthy();
});
