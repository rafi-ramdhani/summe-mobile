import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Text from "@/components/Text";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;
const negativeFg = { light: "#b91c1c", dark: "#f87171" } as const;

export function AvatarMenu({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  const goProfile = () => {
    onClose();
    router.push("/(app)/profile");
  };

  const handleLogout = async () => {
    onClose();
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      qc.clear();
      await logout();
      router.replace("/login");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1">
        <View
          style={{ paddingTop: insets.top + 52, paddingRight: 16 }}
          className="items-end"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-52 bg-bg-raised border border-border-subtle rounded-md py-1"
          >
            <Pressable
              onPress={goProfile}
              className="flex-row items-center gap-3 px-4 py-2"
            >
              <Feather name="user" size={16} color={fgDefault[scheme]} />
              <Text variant="body" className="text-fg-default">
                {locale === "en" ? "Profile" : "Profil"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              className="flex-row items-center gap-3 px-4 py-2"
            >
              <Feather name="log-out" size={16} color={negativeFg[scheme]} />
              <Text variant="body" className="text-negative-fg">
                {locale === "en" ? "Logout" : "Keluar"}
              </Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
