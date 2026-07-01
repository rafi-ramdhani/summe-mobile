const mockStart = jest.fn();
let stopCb: (() => void) | undefined;
jest.mock("react-native-copilot", () => ({
  CopilotProvider: ({ children }: { children: React.ReactNode }) => children,
  CopilotStep: ({ children }: { children: React.ReactNode }) => children,
  walkthroughable: (C: unknown) => C,
  useCopilot: () => ({
    start: mockStart,
    copilotEvents: {
      on: (evt: string, cb: () => void) => {
        if (evt === "stop") stopCb = cb;
      },
      off: () => {},
    },
  }),
}));
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

function renderTour() {
  const qc = createTestQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <OnboardingTour>
        <Text>child</Text>
      </OnboardingTour>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockStart.mockClear();
  (apiFetch as jest.Mock).mockReset();
});

test("auto-starts the tour when tourStatus is not_started", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({
    data: {
      tourStatus: "not_started",
      checklistDismissed: false,
      steps: { createdGroup: null, addedExpense: null, invitedMember: null },
    },
  });
  renderTour();
  await waitFor(() => expect(mockStart).toHaveBeenCalled());
});

test("does not auto-start when already completed", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({
    data: {
      tourStatus: "completed",
      checklistDismissed: false,
      steps: { createdGroup: null, addedExpense: null, invitedMember: null },
    },
  });
  renderTour();
  await waitFor(() => expect(apiFetch).toHaveBeenCalled());
  expect(mockStart).not.toHaveBeenCalled();
});
