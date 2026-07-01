import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "@/components/Text";
import { useLocale } from "@/lib/i18n";
import { comingSoon } from "@/lib/comingSoon";

const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;

export default function DashboardHeader() {
  const locale = useLocale();
  const { colorScheme } = useColorScheme();
  const iconColor = fgDefault[colorScheme ?? "light"];

  // TODO(next-pass): navigate to /groups/create when the create screen exists.
  return (
    <View className="flex-row items-center justify-between mb-6">
      <Text variant="title-2">{locale === "en" ? "Groups" : "Grup"}</Text>
      <Pressable
        onPress={() => comingSoon(locale)}
        accessibilityRole="button"
        accessibilityLabel={locale === "en" ? "Create group" : "Buat grup"}
        className="size-8 items-center justify-center bg-bg-subtle border border-border-subtle rounded-full"
      >
        <Feather name="plus" size={16} color={iconColor} />
      </Pressable>
    </View>
  );
}
