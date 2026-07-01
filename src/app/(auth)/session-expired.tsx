import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useLocale } from "@/lib/i18n";
import Text from "@/components/Text";
import Button from "@/components/Button";

export default function SessionExpiredScreen() {
  const locale = useLocale();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <View className="flex flex-col items-center pt-8">
        <Text variant="body-strong">Summe</Text>
      </View>
      <View className="flex-1 flex-col justify-center items-center px-5 pt-24 gap-6">
        <View className="flex-col items-center gap-3">
          <Text variant="body-strong">
            {locale === "en" ? "Session expired" : "Sesi berakhir"}
          </Text>
          <Text variant="body" className="text-fg-muted text-center">
            {locale === "en"
              ? "Your session has expired. Please log in again to continue."
              : "Sesi kamu telah berakhir. Silakan masuk kembali untuk melanjutkan."}
          </Text>
        </View>
        <Button
          onPress={() => {
            useAuthStore.getState().setSessionExpired(false);
            router.push("/login");
          }}
        >
          {locale === "en" ? "Go to login" : "Masuk kembali"}
        </Button>
      </View>
    </SafeAreaView>
  );
}
