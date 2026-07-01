import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";

/**
 * A fresh QueryClient for tests.
 *
 * `gcTime: 0` is critical here: React Query's default gcTime (5 min)
 * schedules a garbage-collection timer per query/mutation that outlives
 * a test's unmount, keeping the Jest worker's event loop alive and
 * triggering "did not exit gracefully" / "worker process failed to exit".
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  });
}

/**
 * Renders `ui` inside a QueryClientProvider backed by a fresh
 * `createTestQueryClient()`. Use this instead of hand-rolling a
 * QueryClientProvider wrapper in screen tests.
 */
export function renderWithClient(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}
