import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocale } from "@/lib/i18n";
import { markIntroSeen } from "@/lib/intro";
import IntroStory from "./-intro/IntroStory";

export default function Intro() {
  const locale = useLocale();
  const router = useRouter();

  const finish = (target: "/register" | "/login") => {
    markIntroSeen();
    // Replace so the intro is not left on the back stack; once markIntroSeen has
    // persisted, the entry gate won't route back here.
    router.replace(target);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <IntroStory
        locale={locale}
        onGetStarted={() => finish("/register")}
        onLogin={() => finish("/login")}
      />
    </SafeAreaView>
  );
}
