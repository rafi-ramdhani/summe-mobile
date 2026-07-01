import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import Text from "./Text";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "negative";
type Props = {
  variant?: Variant; loading?: boolean; children: React.ReactNode;
} & Omit<PressableProps, "children">;

const box: Record<Variant, string> = {
  primary: "bg-fg-default",
  secondary: "bg-bg-subtle border border-border-default",
  negative: "bg-negative-fg border border-negative-fg",
};
const txt: Record<Variant, string> = {
  primary: "text-fg-inverse", secondary: "text-fg-default", negative: "text-fg-inverse",
};

export default function Button({ variant = "primary", loading = false, disabled, children, ...rest }: Props) {
  const blocked = disabled || loading;
  return (
    <Pressable
      disabled={blocked}
      className={cn("h-12 px-4 rounded-md flex-row justify-center items-center", box[variant], blocked && "opacity-60")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#27272a" : "#fafaf9"} />
      ) : (
        <Text variant="body-strong" className={txt[variant]}>{children}</Text>
      )}
    </Pressable>
  );
}
