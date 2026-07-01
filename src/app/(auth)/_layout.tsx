import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);
  if (session) return <Redirect href="/(app)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
