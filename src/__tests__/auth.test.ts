jest.mock("@/lib/api");
jest.mock("@/lib/secureToken", () => ({
  getToken: jest.fn(), setToken: jest.fn(), clearToken: jest.fn(() => Promise.resolve()),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)), setItem: jest.fn(), removeItem: jest.fn(),
}));
import AsyncStorage from "@react-native-async-storage/async-storage";
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

test("token → fetch fails + was previously logged in → sessionExpired true, session null", async () => {
  useAuthStore.getState().setSessionExpired(false);
  (getToken as jest.Mock).mockReturnValue("tok");
  (apiFetch as jest.Mock).mockRejectedValue(new Error("network down"));
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue("true");
  await bootstrapAuth();
  expect(useAuthStore.getState().session).toBeNull();
  expect(useAuthStore.getState().sessionExpired).toBe(true);
});

test("token → fetch fails + never logged in before → sessionExpired stays false, session null", async () => {
  useAuthStore.getState().setSessionExpired(false);
  (getToken as jest.Mock).mockReturnValue("tok");
  (apiFetch as jest.Mock).mockRejectedValue(new Error("network down"));
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  await bootstrapAuth();
  expect(useAuthStore.getState().session).toBeNull();
  expect(useAuthStore.getState().sessionExpired).toBe(false);
});
