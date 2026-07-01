import { useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "./Text";
import Input from "./Input";
import { cn } from "@/lib/cn";
import { useCurrencies, type Currency } from "@/lib/queries";
import { useLocale } from "@/lib/i18n";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;
const fgStrong = { light: "#18181b", dark: "#fafafa" } as const;

export function CurrencySelectModal({
  isOpen,
  onClose,
  selectedCurrency,
  onSelectCurrency,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: string;
  onSelectCurrency: (code: string) => void;
}) {
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";
  const [search, setSearch] = useState("");

  const { data } = useCurrencies();
  const currencies = data?.data ?? [];

  const q = search.toLowerCase();
  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
  );

  const close = () => {
    setSearch("");
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View
        className="flex-1 bg-bg-base"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center justify-between p-4 border-b border-border-subtle">
          <Text variant="title-2">
            {locale === "en" ? "Currency" : "Mata Uang"}
          </Text>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={locale === "en" ? "Close" : "Tutup"}
            className="p-2 -mr-2"
          >
            <Feather name="x" size={24} color={fgMuted[scheme]} />
          </Pressable>
        </View>

        <View className="p-4 border-b border-border-subtle">
          <View className="relative justify-center">
            <Input
              variant="boxed"
              placeholder={
                locale === "en" ? "Search currency..." : "Cari mata uang..."
              }
              value={search}
              onChangeText={setSearch}
              className="pl-10"
            />
            <View
              pointerEvents="none"
              className="absolute left-3 top-0 bottom-0 justify-center"
            >
              <Feather name="search" size={16} color={fgMuted[scheme]} />
            </View>
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c: Currency) => c.code}
          contentContainerStyle={{ padding: 8 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = selectedCurrency === item.code;
            return (
              <Pressable
                onPress={() => {
                  onSelectCurrency(item.code);
                  setSearch("");
                }}
                className={cn(
                  "flex-row items-center justify-between px-4 py-3 rounded-md",
                  isSelected && "bg-bg-subtle",
                )}
              >
                <View className="flex-row items-baseline gap-1">
                  <Text
                    variant="body"
                    className={
                      isSelected ? "text-fg-strong" : "text-fg-default"
                    }
                  >
                    {item.code}
                  </Text>
                  <Text variant="body" className="text-fg-muted">
                    ({item.symbol})
                  </Text>
                </View>
                {isSelected && (
                  <Feather name="check" size={20} color={fgStrong[scheme]} />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Text variant="body" className="text-fg-muted">
                {locale === "en"
                  ? "No currency found"
                  : "Mata uang tidak ditemukan"}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
