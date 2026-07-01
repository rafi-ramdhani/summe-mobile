import { Modal, Pressable, View } from "react-native";
import Text from "@/components/Text";
import Button from "@/components/Button";

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  confirmVariant?: "primary" | "negative";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 bg-black/60 items-center justify-center px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-[360px] rounded-md bg-bg-raised border border-border-subtle p-5"
        >
          <Text variant="title-3" className="mb-2">
            {title}
          </Text>
          {description ? (
            <Text variant="body" className="text-fg-muted mb-5">
              {description}
            </Text>
          ) : (
            <View className="mb-5" />
          )}
          <View className="flex-col gap-2">
            <Button
              variant={confirmVariant}
              loading={loading}
              onPress={onConfirm}
            >
              {confirmText}
            </Button>
            <Button variant="secondary" disabled={loading} onPress={onCancel}>
              {cancelText}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
