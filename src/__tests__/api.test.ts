jest.mock("@/lib/secureToken", () => ({ getToken: jest.fn(() => "tok-9") }));
import { apiFetch, ApiError } from "@/lib/api";

const okJson = (data: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response);

beforeEach(() => { global.fetch = jest.fn(); });

test("sends bearer + X-Client mobile", async () => {
  (global.fetch as jest.Mock).mockReturnValue(okJson({ ok: 1 }));
  await apiFetch("/users/me");
  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(init.headers.Authorization).toBe("Bearer tok-9");
  expect(init.headers["X-Client"]).toBe("mobile");
});
test("throws ApiError on non-2xx", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false, status: 401, statusText: "Unauthorized",
    json: () => Promise.resolve({ message: "nope", code: "bad" }),
  });
  await expect(apiFetch("/x")).rejects.toBeInstanceOf(ApiError);
});
test("returns undefined for 204", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 });
  await expect(apiFetch("/x")).resolves.toBeUndefined();
});
