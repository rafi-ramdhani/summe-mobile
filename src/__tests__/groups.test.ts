/* eslint-disable @typescript-eslint/no-explicit-any */
import { isActionable, managedMemberHasActivity } from "@/lib/groups";
import type { Settlement, GroupMember, GroupDetail } from "@/lib/queries";

const base: Settlement = {
  id: "s1",
  groupId: "g1",
  payerId: "m1",
  payeeId: "u2",
  amount: "10.00",
  status: "pending",
  rejectionReason: null,
  createdAt: "",
  updatedAt: "",
};
const members: GroupMember[] = [
  {
    id: "u1",
    role: "owner",
    createdAt: "",
    email: "o@o.com",
    name: "Owner",
    isManaged: false,
    status: "active",
  },
  {
    id: "u2",
    role: "member",
    createdAt: "",
    email: null,
    name: "Mom",
    isManaged: true,
    status: "active",
  },
  {
    id: "m1",
    role: "member",
    createdAt: "",
    email: "p@p.com",
    name: "Payer",
    isManaged: false,
    status: "active",
  },
];

describe("isActionable", () => {
  it("is actionable for the payee", () => {
    expect(isActionable(base, "u2", members)).toBe(true);
  });
  it("is actionable for the owner when payee is managed", () => {
    expect(isActionable(base, "u1", members, "u1")).toBe(true);
  });
  it("is NOT actionable for a non-owner non-payee", () => {
    expect(isActionable(base, "m1", members, "u1")).toBe(false);
  });
  it("is NOT actionable when not pending", () => {
    expect(
      isActionable({ ...base, status: "confirmed" }, "u1", members, "u1"),
    ).toBe(false);
  });
});

const makeGroup = (
  over: Partial<GroupDetail>,
): Pick<GroupDetail, "expenses" | "settlements"> => ({
  expenses: [],
  settlements: [],
  ...over,
});

describe("managedMemberHasActivity", () => {
  it("is true when the member is a settlement payer or payee (even pending)", () => {
    const group = makeGroup({
      settlements: [
        { ...base, payerId: "m9", payeeId: "u1", status: "pending" },
      ],
    });
    expect(managedMemberHasActivity("m9", group)).toBe(true);
  });
  it("is true when the member paid or created an expense", () => {
    const group = makeGroup({
      expenses: [{ id: "e1", paidBy: "m9", createdBy: "u1", items: [] } as any],
    });
    expect(managedMemberHasActivity("m9", group)).toBe(true);
  });
  it("is true when the member is assigned to an expense item", () => {
    const group = makeGroup({
      expenses: [
        {
          id: "e1",
          paidBy: "u1",
          createdBy: "u1",
          items: [{ assignments: [{ assigneeId: "m9" }] }],
        } as any,
      ],
    });
    expect(managedMemberHasActivity("m9", group)).toBe(true);
  });
  it("is false when the member has no expenses or settlements", () => {
    const group = makeGroup({
      expenses: [
        {
          id: "e1",
          paidBy: "u1",
          createdBy: "u1",
          items: [{ assignments: [{ assigneeId: "u2" }] }],
        } as any,
      ],
      settlements: [{ ...base, payerId: "u1", payeeId: "u2" }],
    });
    expect(managedMemberHasActivity("m9", group)).toBe(false);
  });
});
