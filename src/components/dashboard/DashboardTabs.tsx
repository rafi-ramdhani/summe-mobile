import { Pressable, View } from "react-native";
import Text from "@/components/Text";
import { ActionIndicator } from "@/components/ActionIndicator";
import { cn } from "@/lib/cn";

type Tab = { id: string; label: string; indicator?: number };

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
            <View className="flex-row items-center justify-center gap-1.5">
              <Text
                variant={isActive ? "body-strong" : "body"}
                className={cn(
                  "text-center",
                  isActive ? "text-fg-default" : "text-fg-muted",
                )}
              >
                {tab.label}
              </Text>
              <ActionIndicator count={tab.indicator ?? 0} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
