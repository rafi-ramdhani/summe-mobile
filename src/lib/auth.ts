import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore, type Session, type User } from "@/stores/authStore";
import { STORAGE_KEYS } from "./config";
import { apiFetch } from "./api";
import { getToken, clearToken } from "./secureToken";

export async function bootstrapAuth(): Promise<void> {
  if (!getToken()) { await storeSession(null); return; }
  try {
    const data = await apiFetch<{ data: User }>("/users/me");
    await storeSession(data?.data ? { user: data.data } : null);
  } catch {
    const wasLoggedIn = !!(await AsyncStorage.getItem(STORAGE_KEYS.wasLoggedIn));
    await storeSession(null);
    if (wasLoggedIn) useAuthStore.getState().setSessionExpired(true);
  }
}

export async function storeSession(session: Session): Promise<void> {
  useAuthStore.getState().setSession(session);
  if (session !== null) {
    await AsyncStorage.setItem(STORAGE_KEYS.wasLoggedIn, "true");
    useAuthStore.getState().setSessionExpired(false);
  }
}

export async function logout(): Promise<void> {
  try { await apiFetch("/auth/logout", { method: "POST" }); } catch { /* ignore */ }
  await clearToken();
  await AsyncStorage.removeItem(STORAGE_KEYS.wasLoggedIn);
  useAuthStore.getState().setSession(null);
  useAuthStore.getState().setSessionExpired(false);
}

export function hasSession(): boolean { return !!useAuthStore.getState().session; }
export function isSessionExpired(): boolean { return useAuthStore.getState().sessionExpired; }
