const mockStart = jest.fn();
let stopCb: (() => void) | undefined;
let mockIsLastStep = false;
jest.mock("react-native-copilot", () => ({
  CopilotProvider: ({ children }: { children: React.ReactNode }) => children,
  CopilotStep: ({ children }: { children: React.ReactNode }) => children,
  walkthroughable: (C: unknown) => C,
  useCopilot: () => ({
    start: mockStart,
    isLastStep: mockIsLastStep,
    copilotEvents: {
      on: (evt: string, cb: () => void) => {
        if (evt === "stop") stopCb = cb;
      },
      off: () => {},
    },
  }),
}));

function fireStop() {
  stopCb?.();
}
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import { render, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import { OnboardingTour } from "@/components/tour/OnboardingTour";
import Text from "@/components/Text";

function tourTree() {
  return (
    <QueryClientProvider client={qc}>
      <OnboardingTour>
        <Text>child</Text>
      </OnboardingTour>
    </QueryClientProvider>
  );
}

let qc: ReturnType<typeof createTestQueryClient>;

async function renderTour() {
  qc = createTestQueryClient();
  return render(tourTree());
}

function patchCalls() {
  return (apiFetch as jest.Mock).mock.calls.filter(
    (call) => call[1]?.method === "PATCH",
  );
}

beforeEach(() => {
  mockStart.mockClear();
  (apiFetch as jest.Mock).mockReset();
  mockIsLastStep = false;
  stopCb = undefined;
});

test("auto-starts the tour when tourStatus is not_started", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({
    data: {
      tourStatus: "not_started",
      checklistDismissed: false,
      steps: { createdGroup: null, addedExpense: null, invitedMember: null },
    },
  });
  await renderTour();
  await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));
});

test("does not auto-start when already completed", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({
    data: {
      tourStatus: "completed",
      checklistDismissed: false,
      steps: { createdGroup: null, addedExpense: null, invitedMember: null },
    },
  });
  await renderTour();
  await waitFor(() => expect(apiFetch).toHaveBeenCalled());
  expect(mockStart).not.toHaveBeenCalled();
});

test("records completed status when stop fires after reaching the last step", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({
    data: {
      tourStatus: "not_started",
      checklistDismissed: false,
      steps: { createdGroup: null, addedExpense: null, invitedMember: null },
    },
  });
  const { rerender } = await renderTour();
  await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));

  mockIsLastStep = true;
  await rerender(tourTree());

  expect(stopCb).toBeDefined();
  fireStop();

  await waitFor(() => expect(patchCalls().length).toBeGreaterThan(0));
  const [, options] = patchCalls()[0];
  expect(JSON.parse(options.body)).toEqual({ tourStatus: "completed" });
});

test("records skipped status when stop fires before reaching the last step", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({
    data: {
      tourStatus: "not_started",
      checklistDismissed: false,
      steps: { createdGroup: null, addedExpense: null, invitedMember: null },
    },
  });
  await renderTour();
  await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));

  expect(stopCb).toBeDefined();
  fireStop();

  await waitFor(() => expect(patchCalls().length).toBeGreaterThan(0));
  const [, options] = patchCalls()[0];
  expect(JSON.parse(options.body)).toEqual({ tourStatus: "skipped" });
});
