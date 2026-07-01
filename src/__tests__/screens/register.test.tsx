const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));
jest.mock("@/components/GoogleButton", () => ({
  __esModule: true,
  default: () => null,
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
import RegisterScreen from "@/app/(auth)/register";

function renderScreen() {
  return renderWithClient(<RegisterScreen />);
}

beforeEach(() => {
  mockPush.mockClear();
  (apiFetch as jest.Mock).mockReset();
  (getPasswordScore as jest.Mock).mockReset();
});

test("blocks submit and shows a form error when the password is weak", async () => {
  (getPasswordScore as jest.Mock).mockResolvedValue(1);
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("you@email.com"), "a@b.com");
  await fireEvent.changeText(
    getByPlaceholderText("Choose a password"),
    "weakpass",
  );
  await fireEvent.changeText(
    getByPlaceholderText("Re-enter password"),
    "weakpass",
  );
  await fireEvent.press(getByText("Sign up"));

  await waitFor(() =>
    expect(getByText(/stronger password/i)).toBeTruthy(),
  );
  expect(apiFetch).not.toHaveBeenCalled();
});

test("reveals confirm password only after typing into password", async () => {
  const { queryByPlaceholderText, getByPlaceholderText } = await renderScreen();

  expect(queryByPlaceholderText("Re-enter password")).toBeNull();

  await fireEvent.changeText(getByPlaceholderText("Choose a password"), "s");

  expect(queryByPlaceholderText("Re-enter password")).toBeTruthy();
});

test("registers and navigates to /verify on a strong password", async () => {
  (getPasswordScore as jest.Mock).mockResolvedValue(4);
  (apiFetch as jest.Mock).mockResolvedValue(undefined);
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("you@email.com"), "a@b.com");
  await fireEvent.changeText(
    getByPlaceholderText("Choose a password"),
    "StrongPass123!",
  );
  await fireEvent.changeText(
    getByPlaceholderText("Re-enter password"),
    "StrongPass123!",
  );
  await fireEvent.press(getByText("Sign up"));

  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", password: "StrongPass123!" }),
      }),
    ),
  );
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/verify",
      params: { email: "a@b.com" },
    }),
  );
});
