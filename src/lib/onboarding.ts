export type ChecklistKey = "createdGroup" | "addedExpense" | "invitedMember";

export type OnboardingData = {
  tourStatus: "not_started" | "completed" | "skipped";
  checklistDismissed: boolean;
  steps: {
    createdGroup: string | null;
    addedExpense: string | null;
    invitedMember: string | null;
  };
};

export const CHECKLIST_KEYS: readonly ChecklistKey[] = [
  "createdGroup",
  "addedExpense",
  "invitedMember",
];

export function isChecklistVisible(o: OnboardingData | undefined): boolean {
  if (!o) return false;
  return !o.checklistDismissed;
}

export function isChecklistComplete(o: OnboardingData): boolean {
  return CHECKLIST_KEYS.every((k) => o.steps[k] !== null);
}

export function checklistSteps(o: OnboardingData) {
  const items = CHECKLIST_KEYS.map((key) => ({
    key,
    done: o.steps[key] !== null,
  }));
  return { items, doneCount: items.filter((i) => i.done).length };
}

export function shouldAutoStartTour(o: OnboardingData | undefined): boolean {
  return o?.tourStatus === "not_started";
}
