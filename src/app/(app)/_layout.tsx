import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);
  if (!session) return <Redirect href="/login" />;
  if (!session.user.name) return <Redirect href="/setup-profile" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
