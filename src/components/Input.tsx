import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "./Text";
import { cn } from "@/lib/cn";

type Variant = "boxed" | "underline";

type Props = {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: Variant;
} & TextInputProps;

// Exact hex values from src/global.css (:root = light, .dark = dark).
const mutedColor = {
  light: "#73736f",
  dark: "#8a8a8f",
} as const;

const fieldVariant: Record<Variant, string> = {
  boxed:
    "bg-bg-base border border-border-default h-12 rounded-md px-4 font-grotesk text-[17px] text-fg-default w-full",
  underline:
    "border-0 border-b border-border-subtle rounded-none px-0 bg-transparent h-12 font-grotesk text-[17px] text-fg-default w-full",
};

export default function Input({
  label,
  error,
  helperText,
  variant = "boxed",
  secureTextEntry,
  className,
  ...rest
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry;
  const { colorScheme } = useColorScheme();
  const mutedHex = mutedColor[colorScheme ?? "light"];

  return (
    <View className="flex-col gap-1">
      {label && (
        <Text variant="caption" className="text-fg-muted">
          {label}
        </Text>
      )}
      <View className="relative justify-center">
        <TextInput
          {...rest}
          secureTextEntry={isPassword && !revealed}
          placeholderTextColor={mutedHex}
          className={cn(fieldVariant[variant], isPassword && "pr-12", className)}
        />
        {isPassword && (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ selected: revealed }}
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            className="absolute right-0 h-12 w-12 items-center justify-center"
          >
            <Ionicons
              name={revealed ? "eye-off" : "eye"}
              size={20}
              color={mutedHex}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text variant="caption" className="text-negative-fg">
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" className="text-fg-muted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
