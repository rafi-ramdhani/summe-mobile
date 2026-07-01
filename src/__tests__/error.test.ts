jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { normalizeErrorForTest as normalizeError } from "@/lib/error";
import { ApiError } from "@/lib/api";

test("401 → invalid credentials (en)", () => {
  const e = normalizeError(new ApiError(401, "x"), "en");
  expect(e.code).toBe("invalid_credentials");
});
test("403 → email not verified (id)", () => {
  const e = normalizeError(new ApiError(403, "x"), "id");
  expect(e.code).toBe("email_not_verified");
  expect(e.message).toContain("verifikasi");
});
