import * as SecureStore from "expo-secure-store";
jest.mock("expo-secure-store");
import { loadToken, getToken, setToken, clearToken } from "@/lib/secureToken";

const mocked = SecureStore as jest.Mocked<typeof SecureStore>;

beforeEach(() => { jest.clearAllMocks(); });

test("loads token into cache", async () => {
  mocked.getItemAsync.mockResolvedValue("tok-123");
  await loadToken();
  expect(getToken()).toBe("tok-123");
});
test("set writes and caches", async () => {
  await setToken("new-tok");
  expect(mocked.setItemAsync).toHaveBeenCalledWith("summe.session_token", "new-tok");
  expect(getToken()).toBe("new-tok");
});
test("clear removes and nulls cache", async () => {
  await setToken("x");
  await clearToken();
  expect(mocked.deleteItemAsync).toHaveBeenCalledWith("summe.session_token");
  expect(getToken()).toBeNull();
});
