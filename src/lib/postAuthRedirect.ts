import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/lib/config";

let pending: string | null = null;

export async function setPostAuthRedirect(path: string): Promise<void> {
  pending = path;
  await AsyncStorage.setItem(STORAGE_KEYS.postAuthRedirect, path);
}

export async function consumePostAuthRedirect(): Promise<string | null> {
  const path = pending ?? (await AsyncStorage.getItem(STORAGE_KEYS.postAuthRedirect));
  pending = null;
  await AsyncStorage.removeItem(STORAGE_KEYS.postAuthRedirect);
  return path;
}
