import { formatCurrency, formatMemberName } from "@/lib/format";

test("formatCurrency formats a positive amount with a symbol", () => {
  expect(formatCurrency(1234.5, "USD")).toBe("$ 1,234.5");
});

test("formatCurrency renders sub-cent amounts as zero", () => {
  expect(formatCurrency(0.004, "USD")).toBe("$ 0");
});

test("formatCurrency adds an explicit sign when showSign is set", () => {
  expect(formatCurrency(-10, "USD", true)).toBe("-$ 10");
});

test("formatMemberName falls back to the email local-part", () => {
  expect(formatMemberName({ email: "rafi@example.com" })).toBe("rafi");
});

test("formatMemberName marks the current user", () => {
  expect(formatMemberName({ name: "Rafi" }, "en", true)).toBe("Rafi (You)");
});
