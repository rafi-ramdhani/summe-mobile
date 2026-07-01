import { Pressable, View } from "react-native";
import Text from "@/components/Text";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: string };

export default function DashboardTabs({
  tabs,
  activeId,
  onChange,
  className,
}: {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <View className={cn("flex-row w-full", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={cn(
              "flex-1 pt-2 pb-3 border-b-2",
              isActive ? "border-fg-default" : "border-border-subtle",
            )}
          >
            <Text
              variant={isActive ? "body-strong" : "body"}
              className={cn(
                "text-center",
                isActive ? "text-fg-default" : "text-fg-muted",
              )}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
