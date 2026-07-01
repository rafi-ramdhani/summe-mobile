import { View } from "react-native";
import Text from "@/components/Text";
import { cn } from "@/lib/cn";

export function ActionIndicator({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <View
      className={cn(
        "bg-negative-fg rounded-full min-w-5 px-1.5 py-0.5 items-center justify-center",
        className,
      )}
    >
      <Text
        variant="caption"
        className="text-bg-base text-[10px] font-grotesk-bold leading-none"
      >
        {count}
      </Text>
    </View>
  );
}
