import { useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Input from "@/components/Input";
import { useLocale } from "@/lib/i18n";
import { SortSheet, type SortBy } from "./SortSheet";

const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;
const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;

export function DashboardSearch({
  value,
  onChangeText,
  showSortIcon,
  sortBy,
  onSortChange,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  showSortIcon: boolean;
  sortBy: SortBy;
  onSortChange: (v: SortBy) => void;
  placeholder: string;
}) {
  const locale = useLocale();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <View className="flex-row gap-2 mb-6">
      <View className="relative flex-1 justify-center">
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          className="pr-10"
        />
        <Pressable
          onPress={() => value.length > 0 && onChangeText("")}
          disabled={value.length === 0}
          accessibilityRole="button"
          accessibilityLabel={
            locale === "en" ? "Clear search" : "Hapus pencarian"
          }
          className="absolute right-3 h-full items-center justify-center"
        >
          <Feather
            name={value.length > 0 ? "x" : "search"}
            size={16}
            color={fgMuted[scheme]}
          />
        </Pressable>
      </View>

      {showSortIcon && (
        <>
          <Pressable
            onPress={() => setSortOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={
              locale === "en" ? "Sort groups" : "Urutkan grup"
            }
            className="size-10 items-center justify-center rounded-md border border-border-default bg-bg-base"
          >
            <Feather name="sliders" size={18} color={fgDefault[scheme]} />
          </Pressable>
          <SortSheet
            visible={sortOpen}
            sortBy={sortBy}
            onSelect={onSortChange}
            onClose={() => setSortOpen(false)}
          />
        </>
      )}
    </View>
  );
}
