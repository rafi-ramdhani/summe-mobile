const mockReplace = jest.fn();
const mockMarkIntroSeen = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/lib/intro", () => ({
  markIntroSeen: () => mockMarkIntroSeen(),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { AccessibilityInfo } from "react-native";
import { cleanup, fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithClient } from "@/lib/test-utils";
import IntroScreen from "@/app/(auth)/intro";
import { getSlides } from "@/app/(auth)/-intro/slides";

// Force reduced-motion so the 5s auto-advance interval never runs — keeps the
// story deterministic and free of timer-driven act() noise.
beforeEach(() => {
  mockReplace.mockClear();
  mockMarkIntroSeen.mockClear();
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

// Await each press: RNTL v14 + React 19 flush event effects asynchronously, so
// firing presses without awaiting leaks act() work into the following test.
async function advanceToLastSlide(getByLabelText: (label: string) => unknown) {
  const steps = getSlides("en").length - 1;
  for (let i = 0; i < steps; i++) {
    await fireEvent.press(getByLabelText("Next") as never);
  }
}

test("renders the first slide's headline", async () => {
  const { findByText } = await renderWithClient(<IntroScreen />);
  expect(await findByText("Split group expenses")).toBeTruthy();
});

test("advancing through every slide reveals the CTAs", async () => {
  const { getByLabelText, findByText, queryByText } = await renderWithClient(
    <IntroScreen />,
  );
  await findByText("Split group expenses");
  expect(queryByText("Get Started")).toBeNull();

  await advanceToLastSlide(getByLabelText);

  expect(await findByText("Get Started")).toBeTruthy();
  expect(await findByText("Already have an account? Log in")).toBeTruthy();
});

test("Get Started marks the intro seen and replaces to /register", async () => {
  const { getByLabelText, findByText } = await renderWithClient(<IntroScreen />);
  await findByText("Split group expenses");
  await advanceToLastSlide(getByLabelText);

  await fireEvent.press(await findByText("Get Started"));

  await waitFor(() => expect(mockMarkIntroSeen).toHaveBeenCalled());
  expect(mockReplace).toHaveBeenCalledWith("/register");
});

test("the login CTA marks the intro seen and replaces to /login", async () => {
  const { getByLabelText, findByText } = await renderWithClient(<IntroScreen />);
  await findByText("Split group expenses");
  await advanceToLastSlide(getByLabelText);

  await fireEvent.press(await findByText("Already have an account? Log in"));

  await waitFor(() => expect(mockMarkIntroSeen).toHaveBeenCalled());
  expect(mockReplace).toHaveBeenCalledWith("/login");
});
