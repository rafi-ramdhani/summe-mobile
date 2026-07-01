import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "@/components/Text";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";

export type SortBy = "latest" | "oldest" | "recent-activity";

export function SortSheet({
  visible,
  sortBy,
  onSelect,
  onClose,
}: {
  visible: boolean;
  sortBy: SortBy;
  onSelect: (v: SortBy) => void;
  onClose: () => void;
}) {
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const options: { value: SortBy; label: string }[] = [
    {
      value: "recent-activity",
      label: locale === "en" ? "Recent Activity" : "Aktivitas Terakhir",
    },
    { value: "latest", label: locale === "en" ? "Latest" : "Terbaru" },
    { value: "oldest", label: locale === "en" ? "Oldest" : "Terlama" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 bg-black/60 justify-end">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ paddingBottom: insets.bottom + 8 }}
          className="bg-bg-raised rounded-t-md border-t border-border-subtle pt-2"
        >
          {options.map((opt) => {
            const selected = opt.value === sortBy;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                className="px-5 py-4"
              >
                <Text
                  variant={selected ? "body-strong" : "body"}
                  className={cn(selected ? "text-fg-default" : "text-fg-muted")}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
