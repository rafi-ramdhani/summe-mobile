import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "@/components/Text";
import { useThemeStore } from "@/stores/themeStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useLocale } from "@/lib/i18n";

export function SettingsMenu({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const locale = useLocale();
  const { theme, setTheme } = useThemeStore();
  const setLocale = useLocaleStore((s) => s.setLocale);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const toggleLocale = () => setLocale(locale === "en" ? "id" : "en");

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
              onPress={toggleTheme}
              className="flex-row items-center justify-between px-4 py-2"
            >
              <Text variant="body" className="text-fg-default">
                {locale === "en" ? "Theme" : "Tema"}
              </Text>
              <Text variant="caption" className="text-fg-muted uppercase">
                {theme}
              </Text>
            </Pressable>
            <Pressable
              onPress={toggleLocale}
              className="flex-row items-center justify-between px-4 py-2"
            >
              <Text variant="body" className="text-fg-default">
                {locale === "en" ? "Language" : "Bahasa"}
              </Text>
              <Text variant="caption" className="text-fg-muted uppercase">
                {locale === "en" ? "EN" : "ID"}
              </Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
