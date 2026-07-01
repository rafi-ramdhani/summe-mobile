import * as SecureStore from "expo-secure-store";

const KEY = "summe.session_token";
let cached: string | null = null;

export async function loadToken(): Promise<void> {
  cached = await SecureStore.getItemAsync(KEY);
}
export function getToken(): string | null {
  return cached;
}
export async function setToken(token: string): Promise<void> {
  cached = token;
  await SecureStore.setItemAsync(KEY, token);
}
export async function clearToken(): Promise<void> {
  cached = null;
  await SecureStore.deleteItemAsync(KEY);
}
