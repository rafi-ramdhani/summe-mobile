jest.mock("@/lib/api");
jest.mock("@/lib/secureToken", () => ({
  getToken: jest.fn(), setToken: jest.fn(), clearToken: jest.fn(() => Promise.resolve()),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)), setItem: jest.fn(), removeItem: jest.fn(),
}));
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/secureToken";
import { bootstrapAuth } from "@/lib/auth";
import { useAuthStore } from "@/stores/authStore";

test("no token → session null, no api call", async () => {
  (getToken as jest.Mock).mockReturnValue(null);
  await bootstrapAuth();
  expect(apiFetch).not.toHaveBeenCalled();
  expect(useAuthStore.getState().session).toBeNull();
});
test("token → fetch me and set session", async () => {
  (getToken as jest.Mock).mockReturnValue("tok");
  (apiFetch as jest.Mock).mockResolvedValue({ data: { id: "1", email: "a@b.c" } });
  await bootstrapAuth();
  expect(useAuthStore.getState().session?.user.email).toBe("a@b.c");
});
