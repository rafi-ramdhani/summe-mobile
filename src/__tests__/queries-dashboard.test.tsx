jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useGroups, useAcceptInvitation } from "@/lib/queries";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => (apiFetch as jest.Mock).mockReset());

test("useGroups requests the paginated groups URL", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({
    data: [],
    meta: { pagination: { page: 1, perPage: 20, total: 0, totalPages: 1 } },
  });
  renderHook(() => useGroups("trip", "active", "latest"), { wrapper });
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/groups?page=1&perPage=20&status=active&sortBy=latest&search=trip",
    ),
  );
});

test("useAcceptInvitation PATCHes with an idempotency key", async () => {
  (apiFetch as jest.Mock).mockResolvedValue(undefined);
  const { result } = await renderHook(() => useAcceptInvitation(), { wrapper });
  result.current.mutate({ invitationId: "inv1", idempotencyKey: "key1" });
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/users/me/invitations/inv1/accept",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Idempotency-Key": "key1" },
      }),
    ),
  );
});
