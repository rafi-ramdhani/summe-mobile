import { Redirect, Stack, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);
  const segments = useSegments();
  const onSetupProfile = segments[segments.length - 1] === "setup-profile";
  if (!session) return <Redirect href="/login" />;
  if (!session.user.name && !onSetupProfile) return <Redirect href="/setup-profile" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
