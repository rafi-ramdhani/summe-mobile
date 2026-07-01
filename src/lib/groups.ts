import type { Settlement, GroupMember, GroupDetail } from "./queries";

// Mirrors the backend `assertManagedMemberHasNoActivity` guard: a managed
// member can only be removed when they have nothing related in the group --
// no expense they paid/created, no item assignment, and no settlement (any
// status, including pending). Used to pre-block removal in the UI instead of
// offering a Remove button that the server would reject with a 409.
export const managedMemberHasActivity = (
  memberId: string,
  group: Pick<GroupDetail, "expenses" | "settlements">,
): boolean => {
  const inExpenses = group.expenses.some(
    (expense) =>
      expense.paidBy === memberId ||
      expense.createdBy === memberId ||
      expense.items.some((item) =>
        item.assignments.some(
          (assignment) => assignment.assigneeId === memberId,
        ),
      ),
  );
  if (inExpenses) return true;
  return group.settlements.some(
    (settlement) =>
      settlement.payerId === memberId || settlement.payeeId === memberId,
  );
};

export const isRemovedInvolved = (
  settlement: Settlement,
  members: GroupMember[],
) => {
  const payer = members.find((m) => m.id === settlement.payerId);
  const payee = members.find((m) => m.id === settlement.payeeId);
  return (
    !payer || !payee || payer.status === "removed" || payee.status === "removed"
  );
};

export const isActionable = (
  settlement: Settlement,
  userId: string | undefined,
  members: GroupMember[],
  ownerId?: string,
) => {
  if (settlement.status !== "pending") return false;
  if (isRemovedInvolved(settlement, members)) return false;
  if (!userId) return false;

  if (settlement.payeeId === userId) return true;

  const payee = members.find((m) => m.id === settlement.payeeId);
  if (userId === ownerId && payee?.isManaged) return true;

  return false;
};
