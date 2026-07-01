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

export type GroupMember = {
  id: string;
  role: "member" | "owner";
  createdAt: string;
  email: string | null;
  name: string | null;
  status?: "active" | "removed";
  isManaged: boolean;
};

export type ExpenseSummary = {
  id: string;
  groupId: string;
  name: string;
  paidBy: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isSettled: boolean;
  discountAmount?: number;
  taxAmount?: number;
  serviceChargeAmount?: number;
  tipAmount?: number;
  totalAmount: number;
  items: {
    id: string;
    expenseId: string;
    name: string;
    amount: number;
    quantity: number;
    splitKind: "equal" | "shares" | "percent" | "exact";
    assignments: {
      id: string;
      expenseItemId: string;
      assigneeId: string;
      value: number;
    }[];
  }[];
};

export type Settlement = {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amount: string;
  status: "pending" | "confirmed" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupDetail = Group & {
  members: GroupMember[];
  expenses: ExpenseSummary[];
  balances: { userId: string; amount: number }[];
  debts: { from: string; to: string; amount: number }[];
  settlements: Settlement[];
  invitations?: { id: string; email: string; createdAt: string }[];
  replacements?: {
    id: string;
    managedMemberId: string;
    managedMemberName: string | null;
    targetUserId: string;
    requestedBy: string;
  }[];
};

export type Activity = {
  id: string;
  groupId: string;
  userId: string | null;
  action:
    | "expense_created"
    | "expense_updated"
    | "expense_deleted"
    | "settlement_created"
    | "settlement_deleted"
    | "settlement_confirmed"
    | "settlement_rejected"
    | "settlement_reverted"
    | "member_joined"
    | "member_removed"
    | "member_left"
    | "member_invited"
    | "invitation_revoked"
    | "group_archived"
    | "group_unarchived"
    | "managed_member_added"
    | "managed_member_removed"
    | "managed_member_replaced"
    | "managed_member_renamed";
  data: {
    expenseId?: string;
    settlementId?: string;
    memberId?: string;
    email?: string;
    name?: string | null;
    amount?: string;
    managedMemberId?: string;
    targetUserId?: string;
  };
  createdAt: string;
};

export function useInfiniteGroupActivities(
  groupId: string,
  sort: "asc" | "desc" = "desc",
) {
  return useInfiniteQuery({
    queryKey: ["groups", groupId, "activities", sort],
    queryFn: ({ pageParam = 1 }) =>
      apiFetch<PaginatedResponse<Activity[]>>(
        `/groups/${groupId}/activities?page=${pageParam}&perPage=20&sort=${sort}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useGroupDetail(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => apiFetch<AppResponse<GroupDetail>>(`/groups/${groupId}`),
    enabled: !!groupId,
  });
}

export function useRevokeInvitation(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      idempotencyKey,
    }: {
      invitationId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/invitations/${invitationId}`, {
        method: "DELETE",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useUpdateGroup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: {
        name?: string;
        currency?: string;
        status?: "active" | "archived";
      };
      idempotencyKey: string;
    }) =>
      apiFetch<AppResponse<Group>>(`/groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      confirmationName,
      idempotencyKey,
    }: {
      groupId: string;
      confirmationName: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          "Idempotency-Key": idempotencyKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmationName }),
      }),
    onSuccess: () => {
      // Intentionally not removing ["groups", groupId] to prevent active
      // observers (like the mounted settings screen) from instantly refetching.
      qc.invalidateQueries({ queryKey: ["groups", "active"] });
      qc.invalidateQueries({ queryKey: ["groups", "archived"] });
    },
  });
}

export function useInviteMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      email,
      idempotencyKey,
    }: {
      email: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      idempotencyKey,
    }: {
      memberId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/members/${memberId}`, {
        method: "DELETE",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useLeaveGroup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey }: { idempotencyKey: string }) =>
      apiFetch(`/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      // The group leaves the user's list. Do not refetch ["groups", groupId]
      // (the user no longer has access).
      qc.invalidateQueries({ queryKey: ["groups", "active"] });
      qc.invalidateQueries({ queryKey: ["groups", "archived"] });
    },
  });
}

export function useCreateSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      idempotencyKey,
      payeeId,
      amount,
      payerId,
    }: {
      idempotencyKey: string;
      payeeId: string;
      amount: string | number;
      payerId?: string;
    }) =>
      apiFetch<AppResponse<{ id: string }>>(`/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          payeeId,
          amount: amount.toString(),
          ...(payerId ? { payerId } : {}),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useDeleteSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      settlementId,
      idempotencyKey,
    }: {
      settlementId: string;
      idempotencyKey: string;
    }) =>
      apiFetch<AppResponse<{ id: string }>>(
        `/groups/${groupId}/settlements/${settlementId}`,
        {
          method: "DELETE",
          headers: { "Idempotency-Key": idempotencyKey },
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useConfirmSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      settlementId,
      idempotencyKey,
    }: {
      settlementId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/settlements/${settlementId}/confirm`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "settlements"] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useRejectSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      settlementId,
      reason,
      idempotencyKey,
    }: {
      settlementId: string;
      reason?: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/settlements/${settlementId}/reject`, {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "settlements"] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useRevertSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      settlementId,
      idempotencyKey,
    }: {
      settlementId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/settlements/${settlementId}/revert`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "settlements"] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useCreateManagedMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      idempotencyKey,
    }: {
      name: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/managed-members`, {
        method: "POST",
        body: JSON.stringify({ name }),
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useRemoveManagedMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      idempotencyKey,
    }: {
      memberId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/managed-members/${memberId}`, {
        method: "DELETE",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useUpdateManagedMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      name,
      idempotencyKey,
    }: {
      memberId: string;
      name: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/managed-members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useCreateReplacement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      targetUserId,
      idempotencyKey,
    }: {
      memberId: string;
      targetUserId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(`/groups/${groupId}/managed-members/${memberId}/replace`, {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

export function useRespondReplacement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      replacementId,
      action,
      idempotencyKey,
    }: {
      replacementId: string;
      action: "confirm" | "decline";
      idempotencyKey: string;
    }) =>
      apiFetch(
        `/groups/${groupId}/managed-members/replacements/${replacementId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ action }),
          headers: { "Idempotency-Key": idempotencyKey },
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "activities"] });
    },
  });
}

export function useCancelReplacement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      replacementId,
      idempotencyKey,
    }: {
      replacementId: string;
      idempotencyKey: string;
    }) =>
      apiFetch(
        `/groups/${groupId}/managed-members/replacements/${replacementId}`,
        {
          method: "DELETE",
          headers: { "Idempotency-Key": idempotencyKey },
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
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
