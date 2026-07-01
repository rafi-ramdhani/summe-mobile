import {
  checklistSteps,
  isChecklistComplete,
  isChecklistVisible,
  shouldAutoStartTour,
  type OnboardingData,
} from "@/lib/onboarding";

const base: OnboardingData = {
  tourStatus: "not_started",
  checklistDismissed: false,
  steps: { createdGroup: null, addedExpense: null, invitedMember: null },
};

test("isChecklistVisible is false when undefined", () => {
  expect(isChecklistVisible(undefined)).toBe(false);
});

test("isChecklistVisible is false once dismissed", () => {
  expect(isChecklistVisible({ ...base, checklistDismissed: true })).toBe(false);
});

test("checklistSteps counts done steps", () => {
  const o = { ...base, steps: { ...base.steps, createdGroup: "2026-01-01" } };
  expect(checklistSteps(o).doneCount).toBe(1);
});

test("isChecklistComplete requires all three", () => {
  const o = {
    ...base,
    steps: { createdGroup: "x", addedExpense: "x", invitedMember: "x" },
  };
  expect(isChecklistComplete(o)).toBe(true);
});

test("shouldAutoStartTour only when not_started", () => {
  expect(shouldAutoStartTour(base)).toBe(true);
  expect(shouldAutoStartTour({ ...base, tourStatus: "completed" })).toBe(false);
});
