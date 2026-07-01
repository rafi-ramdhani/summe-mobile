import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { User } from "@/stores/authStore";

type AppResponse<T> = { data: T };

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: () => apiFetch<AppResponse<User>>("/users/me") });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      apiFetch<AppResponse<User>>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
