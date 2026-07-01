jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import { render, fireEvent } from "@testing-library/react-native";
import { renderWithClient } from "@/lib/test-utils";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import type { OnboardingData } from "@/lib/onboarding";

const onboarding: OnboardingData = {
  tourStatus: "completed",
  checklistDismissed: false,
  steps: { createdGroup: "2026-01-01", addedExpense: null, invitedMember: null },
};

test("renders step labels and 1 / 3 progress", async () => {
  const { getByText } = await renderWithClient(
    <GettingStartedChecklist onboarding={onboarding} onReplayTour={() => {}} />,
  );
  expect(getByText("Get started")).toBeTruthy();
  expect(getByText("1 / 3")).toBeTruthy();
  expect(getByText("Create your first group")).toBeTruthy();
});

test("replay button calls onReplayTour", async () => {
  const onReplayTour = jest.fn();
  const { getByText } = await renderWithClient(
    <GettingStartedChecklist
      onboarding={onboarding}
      onReplayTour={onReplayTour}
    />,
  );
  await fireEvent.press(getByText("Replay tour"));
  expect(onReplayTour).toHaveBeenCalled();
});
