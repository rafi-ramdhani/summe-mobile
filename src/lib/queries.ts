import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { User } from "@/stores/authStore";
import type { OnboardingData } from "@/lib/onboarding";

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

export type Currency = { code: string; symbol: string; name: string };

export type Group = {
  id: string;
  name: string;
  role: "member" | "owner";
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  balance: number;
  currency: Currency;
  archivedAt?: string | null;
  archivedByName?: string | null;
  archivedByEmail?: string | null;
  status?: "active" | "archived";
  pendingActionCount?: number;
};

export type Invitation = {
  id: string;
  groupId: string;
  name: string;
  inviterName: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  data: T;
  meta: {
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
      totalFiltered?: number;
      totalPagesFiltered?: number;
    };
  };
};

export function useGroups(
  searchQuery?: string,
  status: "active" | "archived" = "active",
  sortBy: "latest" | "oldest" | "recent-activity" = "latest",
) {
  return useInfiniteQuery({
    queryKey: ["groups", status, searchQuery, sortBy],
    queryFn: ({ pageParam }) => {
      const searchParam = searchQuery
        ? `&search=${encodeURIComponent(searchQuery)}`
        : "";
      return apiFetch<PaginatedResponse<Group[]>>(
        `/groups?page=${pageParam}&perPage=20&status=${status}&sortBy=${sortBy}${searchParam}`,
      );
    },
    getNextPageParam: (lastPage) => {
      const totalPages =
        lastPage.meta.pagination.totalPagesFiltered ??
        lastPage.meta.pagination.totalPages;
      if (lastPage.meta.pagination.page < totalPages) {
        return lastPage.meta.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: () => apiFetch<AppResponse<Invitation[]>>("/users/me/invitations"),
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      idempotencyKey,
    }: {
      invitationId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/users/me/invitations/${invitationId}/accept`, {
        method: "PATCH",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useRejectInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      idempotencyKey,
    }: {
      invitationId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/users/me/invitations/${invitationId}/reject`, {
        method: "PATCH",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useOnboarding() {
  return useQuery({
    queryKey: ["onboarding"],
    queryFn: () =>
      apiFetch<AppResponse<OnboardingData>>("/users/me/onboarding"),
  });
}

export function useUpdateOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tourStatus?: "completed" | "skipped";
      checklistDismissed?: boolean;
    }) =>
      apiFetch<AppResponse<OnboardingData>>("/users/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ["onboarding"] });
      const previous = qc.getQueryData<AppResponse<OnboardingData>>([
        "onboarding",
      ]);
      if (previous) {
        qc.setQueryData<AppResponse<OnboardingData>>(["onboarding"], {
          data: { ...previous.data, ...patch },
        });
      }
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(["onboarding"], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: () => apiFetch<AppResponse<Currency[]>>("/currencies"),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: { name: string; currency: string };
      idempotencyKey: string;
    }) =>
      apiFetch<AppResponse<Group>>("/groups", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}
