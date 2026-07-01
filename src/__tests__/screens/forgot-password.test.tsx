const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
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

import { fireEvent, waitFor } from "@testing-library/react-native";
import { apiFetch } from "@/lib/api";
import { renderWithClient } from "@/lib/test-utils";
import ForgotPasswordScreen from "@/app/(auth)/forgot-password";

function renderScreen() {
  return renderWithClient(<ForgotPasswordScreen />);
}

beforeEach(() => {
  mockPush.mockClear();
  (apiFetch as jest.Mock).mockReset();
});

test("submits email and navigates to /reset-otp", async () => {
  (apiFetch as jest.Mock).mockResolvedValue(undefined);
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("you@email.com"), "a@b.com");
  await fireEvent.press(getByText("Send code"));

  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/forgot-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    ),
  );
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/reset-otp",
      params: { email: "a@b.com" },
    }),
  );
});
