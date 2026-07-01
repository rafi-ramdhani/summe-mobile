import {
  toFixedFloatString,
  formatNumberInput,
  parseNumberInput,
  validatePercentSplit,
  validateExactSplit,
  calculateItemProportionalValues,
  toApiItem,
} from "@/lib/expense";

describe("Expense Helpers", () => {
  describe("toFixedFloatString", () => {
    it("handles valid numbers", () => {
      expect(toFixedFloatString(10)).toBe("10.00");
      expect(toFixedFloatString(10.5)).toBe("10.50");
      expect(toFixedFloatString("10.555")).toBe("10.55");
    });
    it("handles edge cases", () => {
      expect(toFixedFloatString("")).toBe("");
      expect(toFixedFloatString(undefined)).toBe("");
      expect(toFixedFloatString(null as unknown as string)).toBe("");
      expect(toFixedFloatString("abc")).toBe("");
    });
  });

  describe("formatNumberInput", () => {
    it("formats thousands", () => {
      expect(formatNumberInput("1000")).toBe("1,000");
      expect(formatNumberInput("1000000.50")).toBe("1,000,000.50");
    });
    it("handles leading zeros properly", () => {
      expect(formatNumberInput(".5")).toBe("0.5");
    });
  });

  describe("parseNumberInput", () => {
    it("removes non-numeric characters", () => {
      expect(parseNumberInput("1,000.50")).toBe("1000.50");
      expect(parseNumberInput("abc123.45.6")).toBe("123.456");
    });
  });

  describe("Split Validations", () => {
    it("validates percent split to exactly 100", () => {
      expect(
        validatePercentSplit({ u1: "50", u2: "50" }, new Set(["u1", "u2"])),
      ).toBe(true);
      expect(
        validatePercentSplit({ u1: "50", u2: "49" }, new Set(["u1", "u2"])),
      ).toBe(false);
      expect(
        validatePercentSplit({ u1: "100" }, new Set(["u1", "u2"])), // u2 missing
      ).toBe(false);
      expect(
        validatePercentSplit({ u1: "0", u2: "100" }, new Set(["u1", "u2"])), // 0 is invalid
      ).toBe(false);
      expect(
        validatePercentSplit({ u1: "0.5", u2: "99.5" }, new Set(["u1", "u2"])), // < 1 but > 0 is valid
      ).toBe(true);
    });

    it("validates exact split", () => {
      expect(
        validateExactSplit({ u1: "10", u2: "20" }, new Set(["u1", "u2"]), 30),
      ).toBe(true);
      expect(
        validateExactSplit({ u1: "10", u2: "20" }, new Set(["u1", "u2"]), 35),
      ).toBe(false);
      expect(
        validateExactSplit(
          { u1: "0.5", u2: "29.5" },
          new Set(["u1", "u2"]),
          30,
        ),
      ).toBe(true);
      expect(
        validateExactSplit({ u1: "0", u2: "30" }, new Set(["u1", "u2"]), 30),
      ).toBe(false);
    });
  });

  describe("calculateItemProportionalValues", () => {
    it("calculates equal split correctly", () => {
      const result = calculateItemProportionalValues(
        "equal",
        [
          { assigneeId: "u1", value: "1" },
          { assigneeId: "u2", value: "1" },
        ],
        100,
      );
      expect(result).toEqual({ u1: 50, u2: 50 });
    });

    it("calculates shares split correctly", () => {
      const result = calculateItemProportionalValues(
        "shares",
        [
          { assigneeId: "u1", value: "1" },
          { assigneeId: "u2", value: "3" },
        ],
        100,
      );
      expect(result).toEqual({ u1: 25, u2: 75 });
    });

    it("calculates percent split correctly", () => {
      const result = calculateItemProportionalValues(
        "percent",
        [
          { assigneeId: "u1", value: "20" },
          { assigneeId: "u2", value: "80" },
        ],
        200,
      );
      expect(result).toEqual({ u1: 40, u2: 160 });
    });

    it("calculates exact split correctly", () => {
      const result = calculateItemProportionalValues(
        "exact",
        [
          { assigneeId: "u1", value: "25" },
          { assigneeId: "u2", value: "75" },
        ],
        100,
      );
      expect(result).toEqual({ u1: 25, u2: 75 });
    });
  });

  describe("toApiItem", () => {
    it("maps the display shape to the API payload", () => {
      expect(
        toApiItem({
          name: "Food",
          amount: "30000",
          baseAmount: "15000",
          pcs: "2",
          splitKind: "equal",
          assignments: [{ assigneeId: "u1", value: "1" }],
        }),
      ).toEqual({
        name: "Food",
        amount: "15000.00",
        quantity: 2,
        splitKind: "equal",
        assignments: [{ assigneeId: "u1", value: "1" }],
      });
    });
    it("falls back to amount and quantity 1", () => {
      expect(
        toApiItem({
          name: "Food",
          amount: "15000",
          splitKind: "equal",
          assignments: [],
        }),
      ).toEqual({
        name: "Food",
        amount: "15000.00",
        quantity: 1,
        splitKind: "equal",
        assignments: [],
      });
    });
  });
});
