import { Redirect, Stack, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useScreenBackground } from "@/lib/theme";

export default function AuthLayout() {
  const session = useAuthStore((s) => s.session);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const segments = useSegments();
  const screenBackground = useScreenBackground();
  const onSessionExpired = segments[segments.length - 1] === "session-expired";
  if (session) return <Redirect href="/(app)" />;
  if (sessionExpired && !onSessionExpired) return <Redirect href="/session-expired" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: screenBackground },
      }}
    />
  );
}
