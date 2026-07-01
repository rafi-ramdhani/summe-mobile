import { View } from "react-native";
import Text from "./Text";
import { cn } from "@/lib/cn";

export type AvatarProps = {
  name?: string | null;
  email?: string | null;
  className?: string;
};

export default function Avatar({ name, email, className }: AvatarProps) {
  const displayName = name || email || "?";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View
      className={cn(
        "rounded-full bg-bg-subtle items-center justify-center min-w-10 min-h-10",
        className || "size-10",
      )}
    >
      <Text variant="caption">{initial}</Text>
    </View>
  );
}
