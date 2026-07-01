jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useCurrencies, useCreateGroup } from "@/lib/queries";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => (apiFetch as jest.Mock).mockReset());

test("useCurrencies requests the currencies endpoint", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ data: [] });
  renderHook(() => useCurrencies(), { wrapper });
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/currencies"));
});

test("useCreateGroup POSTs name + currency with an idempotency key", async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ data: { id: "g1" } });
  const { result } = await renderHook(() => useCreateGroup(), { wrapper });
  result.current.mutate({
    data: { name: "Bali Trip", currency: "IDR" },
    idempotencyKey: "key1",
  });
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/groups",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Bali Trip", currency: "IDR" }),
        headers: { "Idempotency-Key": "key1" },
      }),
    ),
  );
});
