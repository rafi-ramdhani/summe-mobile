import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useIntroStore } from "@/stores/introStore";

export default function Index() {
  const hasSeenIntro = useIntroStore((s) => s.hasSeenIntro);
  const session = useAuthStore((s) => s.session);
  if (!hasSeenIntro) return <Redirect href="/intro" />;
  return <Redirect href={session ? "/(app)" : "/login"} />;
}
