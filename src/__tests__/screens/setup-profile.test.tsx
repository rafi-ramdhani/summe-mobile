const mockReplace = jest.fn();
const mockMutate = jest.fn(
  (
    body: { name: string },
    opts?: {
      onSuccess?: (res: {
        data: { id: string; email: string; name: string };
      }) => void;
      onError?: (err: Error) => void;
    },
  ) =>
    opts?.onSuccess?.({
      data: { id: "1", email: "a@b.com", name: body.name },
    }),
);
const mockUseMe = jest.fn(() => ({
  data: { data: { id: "1", email: "a@b.com", name: null as string | null } },
}));
const mockConsumePostAuthRedirect = jest.fn().mockResolvedValue(null);
const mockStoreSession = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/lib/queries", () => ({
  useMe: () => mockUseMe(),
  useUpdateMe: () => ({ mutate: mockMutate, isPending: false }),
}));
jest.mock("@/lib/postAuthRedirect", () => ({
  consumePostAuthRedirect: () => mockConsumePostAuthRedirect(),
}));
jest.mock("@/lib/auth", () => ({ storeSession: (...args: unknown[]) => mockStoreSession(...args) }));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithClient } from "@/lib/test-utils";
import SetupProfileScreen from "@/app/(app)/setup-profile";

function renderScreen() {
  return renderWithClient(<SetupProfileScreen />);
}

beforeEach(() => {
  mockReplace.mockClear();
  mockMutate.mockClear();
  mockStoreSession.mockClear();
  mockUseMe.mockReturnValue({
    data: { data: { id: "1", email: "a@b.com", name: null } },
  });
  mockConsumePostAuthRedirect.mockReset();
  mockConsumePostAuthRedirect.mockResolvedValue(null);
});

test("Continue is disabled while the name is empty", async () => {
  const { getByText } = await renderScreen();

  const continueButton = getByText("Continue");
  expect(continueButton.parent?.props.accessibilityState.disabled).toBe(true);
});

test("entering a name and pressing Continue updates the profile and routes home", async () => {
  const { getByPlaceholderText, getByText } = await renderScreen();

  await fireEvent.changeText(getByPlaceholderText("Your name"), "  Rafi  ");
  await fireEvent.press(getByText("Continue"));

  await waitFor(() =>
    expect(mockMutate).toHaveBeenCalledWith(
      { name: "Rafi" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    ),
  );
  await waitFor(() =>
    expect(mockStoreSession).toHaveBeenCalledWith({
      user: { id: "1", email: "a@b.com", name: "Rafi" },
    }),
  );
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(app)"));
});

test("pressing Skip for now routes home without calling mutate", async () => {
  const { getByText } = await renderScreen();

  await fireEvent.press(getByText("Skip for now"));

  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(app)"));
  expect(mockMutate).not.toHaveBeenCalled();
});

test("honors a pending post-auth redirect over the authenticated home", async () => {
  mockConsumePostAuthRedirect.mockResolvedValue("/invitations");
  const { getByText } = await renderScreen();

  await fireEvent.press(getByText("Skip for now"));

  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/invitations"));
});

test("seeds the name field from the user's existing name", async () => {
  mockUseMe.mockReturnValue({
    data: { data: { id: "1", email: "a@b.com", name: "Existing Name" } },
  });
  const { getByDisplayValue } = await renderScreen();

  expect(getByDisplayValue("Existing Name")).toBeTruthy();
});
