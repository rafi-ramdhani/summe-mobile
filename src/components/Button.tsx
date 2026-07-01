import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { useColorScheme } from "nativewind";
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

// Exact hex values from src/global.css (:root = light, .dark = dark).
const spinnerColor = {
  light: { "fg-default": "#27272a", "fg-inverse": "#fafaf9" },
  dark: { "fg-default": "#e4e4e7", "fg-inverse": "#0c0c0d" },
} as const;

export default function Button({ variant = "primary", loading = false, disabled, children, ...rest }: Props) {
  const blocked = disabled || loading;
  const { colorScheme } = useColorScheme();
  const spinnerToken = variant === "secondary" ? "fg-default" : "fg-inverse";
  const spinnerHex = spinnerColor[colorScheme ?? "light"][spinnerToken];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      className={cn("h-12 px-4 rounded-md flex-row justify-center items-center", box[variant], blocked && "opacity-60")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerHex} />
      ) : (
        <Text variant="body-strong" className={txt[variant]}>{children}</Text>
      )}
    </Pressable>
  );
}
