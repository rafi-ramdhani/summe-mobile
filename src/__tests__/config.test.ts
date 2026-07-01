import { STORAGE_KEYS, env } from "@/lib/config";
test("storage keys are namespaced", () => {
  expect(STORAGE_KEYS.theme).toBe("summe.theme");
  expect(STORAGE_KEYS.locale).toBe("summe.locale");
});
test("api base url falls back to localhost", () => {
  expect(env.API_BASE_URL).toContain("http");
});
