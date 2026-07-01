import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useScreenBackground } from "@/lib/theme";

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);
  const screenBackground = useScreenBackground();
  if (!session) return <Redirect href="/login" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: screenBackground },
      }}
    />
  );
}
