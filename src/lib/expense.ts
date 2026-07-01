// Working types + pure helpers for the expense editor, ported from
// summe-web's -groups.$groupId_.expenses.$expenseId/{types,helpers}.ts.

export type SplitKind = "equal" | "shares" | "exact" | "percent";

export type ExpenseItem = {
  name: string;
  amount: string;
  baseAmount?: string;
  pcs?: string;
  splitKind: SplitKind;
  assignments: { assigneeId: string; value: string }[];
};

export const toFixedFloatString = (val?: string | number): string => {
  if (val === undefined || val === null || val === "") return "";
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return "";
  return num.toFixed(2);
};

export const formatNumberInput = (val: string): string => {
  if (!val) return "";
  const parts = val.split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";
  if (integerPart === "") integerPart = "0";
  const parsedInt = parseInt(integerPart, 10);
  if (isNaN(parsedInt)) return decimalPart === "." ? "0." : "";
  return parsedInt.toLocaleString("en-US") + decimalPart;
};

export const parseNumberInput = (val: string): string => {
  let numericOnly = val.replace(/[^\d.]/g, "");
  const parts = numericOnly.split(".");
  if (parts.length > 2) {
    numericOnly = parts[0] + "." + parts.slice(1).join("");
  }
  return numericOnly;
};

// Pure logic for split validation
export const validatePercentSplit = (
  assignments: Record<string, string>,
  selectedUserIds: Set<string>,
): boolean => {
  const hasInvalid = Array.from(selectedUserIds).some(
    (id) => (parseFloat(assignments[id]) || 0) <= 0,
  );
  const total = Array.from(selectedUserIds).reduce(
    (acc, id) => acc + (parseFloat(assignments[id]) || 0),
    0,
  );
  return !hasInvalid && total === 100;
};

export const validateExactSplit = (
  assignments: Record<string, string>,
  selectedUserIds: Set<string>,
  targetTotal: number,
): boolean => {
  const hasInvalid = Array.from(selectedUserIds).some(
    (id) => (parseFloat(assignments[id]) || 0) <= 0,
  );
  const total = Array.from(selectedUserIds).reduce(
    (acc, id) => acc + (parseFloat(assignments[id]) || 0),
    0,
  );
  return !hasInvalid && total === targetTotal;
};

export const calculateItemProportionalValues = (
  splitKind: SplitKind,
  assignments: { assigneeId: string; value: string }[],
  totalAmount: number,
): Record<string, number> => {
  const calculated: Record<string, number> = {};
  if (assignments.length === 0) return calculated;

  if (splitKind === "equal") {
    const splitAmt = totalAmount / assignments.length;
    assignments.forEach((a) => {
      calculated[a.assigneeId] = splitAmt;
    });
  } else if (splitKind === "shares") {
    const totalShares = assignments.reduce(
      (sum, a) => sum + (parseFloat(a.value) || 0),
      0,
    );
    if (totalShares > 0) {
      assignments.forEach((a) => {
        calculated[a.assigneeId] =
          (totalAmount * (parseFloat(a.value) || 0)) / totalShares;
      });
    }
  } else if (splitKind === "percent") {
    assignments.forEach((a) => {
      calculated[a.assigneeId] =
        (totalAmount * (parseFloat(a.value) || 0)) / 100;
    });
  } else if (splitKind === "exact") {
    assignments.forEach((a) => {
      calculated[a.assigneeId] = parseFloat(a.value) || 0;
    });
  }

  return calculated;
};

// Maps a working ExpenseItem (display shape with baseAmount/pcs) to the API
// payload shape. Used in BOTH the initial-hash seed and the save handler so
// the two shapes can never drift and change-detection stays accurate.
export const toApiItem = (item: ExpenseItem) => {
  const quantity = Math.max(1, Math.trunc(parseFloat(item.pcs ?? "1") || 1));
  const unitPrice = item.baseAmount ?? item.amount;
  return {
    name: item.name,
    amount: toFixedFloatString(unitPrice) || "0.00",
    quantity,
    splitKind: item.splitKind,
    assignments: item.assignments,
  };
};
