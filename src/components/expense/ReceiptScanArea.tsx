import { useState } from "react";
import { Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "@/components/Text";
import Button from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useScanReceipt, type ReceiptDraft } from "@/lib/queries";
import { ApiError } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;
const fgInverse = { light: "#fafaf9", dark: "#0c0c0d" } as const;
const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;

type Props = {
  groupId: string;
  locale: Locale;
  onScanned: (draft: ReceiptDraft) => void;
  onAddManually: () => void;
};

export function ReceiptScanArea({
  groupId,
  locale,
  onScanned,
  onAddManually,
}: Props) {
  const en = locale === "en";
  const scanReceipt = useScanReceipt(groupId);
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";
  const [notReceiptOpen, setNotReceiptOpen] = useState(false);

  // The per-day scan quota is generous and most users never reach it, so it is
  // not surfaced proactively. Hitting the limit returns a 429 that the global
  // mutation error toast shows. The buttons only disable while a scan runs.
  const disabled = scanReceipt.isPending;

  const scanAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const draft = await scanReceipt.mutateAsync({
        uri: asset.uri,
        name: asset.fileName ?? "receipt.jpg",
        type: asset.mimeType ?? "image/jpeg",
      });
      onScanned(draft);
    } catch (err) {
      // A non-receipt image gets its own modal (the toast is suppressed for
      // this code); every other error is surfaced by the global mutation toast.
      if (err instanceof ApiError && err.code === "NOT_A_RECEIPT") {
        setNotReceiptOpen(true);
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) await scanAsset(result.assets[0]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) await scanAsset(result.assets[0]);
  };

  return (
    <View className="flex-col gap-2">
      <View className="flex-col items-center gap-3 rounded-xl border border-dashed border-border-default bg-bg-subtle px-4 py-6">
        <View className="w-12 h-12 rounded-full bg-bg-subtle-emphasized items-center justify-center">
          <Feather name="file-text" size={24} color={fgMuted[scheme]} />
        </View>
        <View className="flex-col gap-1">
          <Text variant="body-strong" className="text-center">
            {en ? "Scan your receipt" : "Pindai struk kamu"}
          </Text>
          <Text variant="caption" className="text-fg-muted text-center">
            {en
              ? "We'll read the items for you"
              : "Kami akan membaca itemnya untukmu"}
          </Text>
        </View>

        <View className="flex-row w-full gap-2">
          <View className="flex-1">
            <Button
              variant="primary"
              loading={scanReceipt.isPending}
              disabled={disabled}
              onPress={takePhoto}
            >
              <Feather name="camera" size={16} color={fgInverse[scheme]} />{" "}
              {en ? "Take photo" : "Ambil foto"}
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              loading={scanReceipt.isPending}
              disabled={disabled}
              onPress={pickImage}
            >
              <Feather name="upload" size={16} color={fgDefault[scheme]} />{" "}
              {en ? "Upload" : "Unggah"}
            </Button>
          </View>
        </View>

        {scanReceipt.isPending && (
          <Text variant="caption" className="text-fg-muted">
            {en ? "Scanning..." : "Memindai..."}
          </Text>
        )}
      </View>

      {!scanReceipt.isPending && (
        <Pressable onPress={onAddManually} className="self-center">
          <Text className="text-[12px] text-fg-default underline">
            {en ? "or add manually" : "atau tambah manual"}
          </Text>
        </Pressable>
      )}

      <ConfirmModal
        isOpen={notReceiptOpen}
        hideCancel
        title={en ? "That's not a receipt" : "Itu bukan struk"}
        description={
          en
            ? "We couldn't find a receipt in that image. Try again with a clear photo of a receipt, or add the expense manually."
            : "Kami tidak menemukan struk pada gambar itu. Coba lagi dengan foto struk yang jelas, atau tambahkan pengeluaran secara manual."
        }
        confirmText={en ? "Got it" : "Mengerti"}
        cancelText={en ? "Cancel" : "Batal"}
        onConfirm={() => setNotReceiptOpen(false)}
        onCancel={() => setNotReceiptOpen(false)}
      />
    </View>
  );
}
