import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "./Text";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;

export default function ScreenHeader({
  title,
  onBack,
  isFetching = false,
  right,
}: {
  title: string;
  onBack: () => void;
  isFetching?: boolean;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="px-4 border-b border-border-subtle bg-bg-base"
    >
      <View className="h-14 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1 min-w-0">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="p-2 -ml-2"
          >
            <Feather name="arrow-left" size={24} color={fgDefault[scheme]} />
          </Pressable>
          <Text variant="body-strong" numberOfLines={1}>
            {title}
          </Text>
          {isFetching && (
            <ActivityIndicator size="small" color={fgMuted[scheme]} />
          )}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}
