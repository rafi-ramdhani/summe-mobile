import { View } from "react-native";
import { useToastStore, type ToastType } from "@/stores/toastStore";
import { cn } from "@/lib/cn";
import Text from "./Text";

const cardClassByType: Record<ToastType, string> = {
  error: "bg-negative-bg",
  success: "bg-positive-bg",
  info: "bg-bg-subtle",
};

const textClassByType: Record<ToastType, string> = {
  error: "text-negative-fg",
  success: "text-positive-fg",
  info: "text-fg-default",
};

export default function GlobalToasts() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <View
      pointerEvents="box-none"
      className="absolute top-0 left-0 right-0 items-center pt-2 px-4"
    >
      {toasts.map((toast) => (
        <View
          key={toast.id}
          className={cn("rounded-md px-4 py-2 mb-2", cardClassByType[toast.type])}
        >
          <Text variant="caption" className={textClassByType[toast.type]}>
            {toast.message}
          </Text>
        </View>
      ))}
    </View>
  );
}
