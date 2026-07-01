import { getPasswordScore, MIN_PASSWORD_SCORE } from "@/lib/password";

test("empty password scores 0", async () => {
  expect(await getPasswordScore("")).toBe(0);
});

test("strong password meets minimum", async () => {
  expect(await getPasswordScore("Tr0ub4dour&3xtra")).toBeGreaterThanOrEqual(MIN_PASSWORD_SCORE);
});
