import { useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "@/components/Text";
import Avatar from "@/components/Avatar";
import { useMe } from "@/lib/queries";
import { useLocale } from "@/lib/i18n";
import { SettingsMenu } from "./SettingsMenu";
import { AvatarMenu } from "./AvatarMenu";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;

export default function DashboardTopBar() {
  const locale = useLocale();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";
  const { data: userRes } = useMe();
  const user = userRes?.data;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  return (
    <View className="flex-row items-center justify-between h-12 mb-2">
      <Text variant="body-strong">Summe</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => setSettingsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={locale === "en" ? "Settings" : "Pengaturan"}
          className="size-8 items-center justify-center rounded-full"
        >
          <Feather name="settings" size={18} color={fgDefault[scheme]} />
        </Pressable>
        <Pressable
          onPress={() => setAvatarOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={locale === "en" ? "Account" : "Akun"}
        >
          <Avatar
            name={user?.name}
            email={user?.email}
            className="size-8 border border-border-default"
          />
        </Pressable>
      </View>

      <SettingsMenu
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <AvatarMenu visible={avatarOpen} onClose={() => setAvatarOpen(false)} />
    </View>
  );
}
