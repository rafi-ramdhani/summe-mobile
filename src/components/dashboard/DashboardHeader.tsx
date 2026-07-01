import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import { CopilotStep } from "react-native-copilot";
import Text from "@/components/Text";
import { useLocale } from "@/lib/i18n";
import { WalkthroughView } from "@/components/tour/OnboardingTour";

const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;

export default function DashboardHeader() {
  const locale = useLocale();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const iconColor = fgDefault[colorScheme ?? "light"];

  return (
    <View className="flex-row items-center justify-between mb-6">
      <Text variant="title-2">{locale === "en" ? "Groups" : "Grup"}</Text>
      <CopilotStep
        name="create-group"
        order={1}
        text={
          locale === "en"
            ? "Start here. A group holds your shared expenses."
            : "Mulai di sini. Grup menyimpan pengeluaran bersamamu."
        }
      >
        <WalkthroughView>
          <Pressable
            onPress={() => router.push("/(app)/groups/create")}
            accessibilityRole="button"
            accessibilityLabel={locale === "en" ? "Create group" : "Buat grup"}
            className="size-8 items-center justify-center bg-bg-subtle border border-border-subtle rounded-full"
          >
            <Feather name="plus" size={16} color={iconColor} />
          </Pressable>
        </WalkthroughView>
      </CopilotStep>
    </View>
  );
}
