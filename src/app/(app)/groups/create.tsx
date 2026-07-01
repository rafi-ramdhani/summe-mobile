import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { CurrencySelectModal } from "@/components/CurrencySelectModal";
import { useCreateGroup, useCurrencies } from "@/lib/queries";
import { generateUUID } from "@/lib/api";
import { useLocale } from "@/lib/i18n";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;

export default function CreateGroupScreen() {
  const locale = useLocale();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [showErrors, setShowErrors] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateUUID());

  const createGroup = useCreateGroup();
  const { data: currenciesRes } = useCurrencies();
  const currencies = currenciesRes?.data ?? [];
  const symbol = currencies.find((c) => c.code === currency)?.symbol;

  const nameError =
    showErrors && !name.trim()
      ? locale === "en"
        ? "Group name is required"
        : "Nama grup wajib diisi"
      : undefined;

  const handleCreate = () => {
    if (!name.trim()) {
      setShowErrors(true);
      return;
    }
    createGroup.mutate(
      { data: { name: name.trim(), currency }, idempotencyKey },
      {
        onSuccess: () => {
          setIdempotencyKey(generateUUID());
          // TODO(next-pass): navigate to the group detail screen once it exists.
          router.back();
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={locale === "en" ? "Create group" : "Buat grup"}
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-col gap-6 mt-4">
            <View className="flex-col gap-1">
              <Text variant="caption" className="text-fg-default">
                {locale === "en" ? "Group name" : "Nama grup"}
              </Text>
              <Input
                variant="underline"
                placeholder={
                  locale === "en" ? "e.g. Bali Trip" : "mis. Liburan ke Bali"
                }
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (v.trim()) setShowErrors(false);
                }}
                error={nameError}
                helperText={
                  nameError
                    ? undefined
                    : locale === "en"
                      ? "Visible to members only."
                      : "Hanya terlihat oleh anggota."
                }
              />
            </View>

            <View className="flex-col gap-1">
              <Text variant="caption" className="text-fg-default">
                {locale === "en" ? "Currency" : "Mata uang"}
              </Text>
              <Pressable
                onPress={() => setCurrencyOpen(true)}
                accessibilityRole="button"
                className="flex-row items-center justify-between border-b border-border-subtle py-2"
              >
                <Text variant="body" className="text-fg-default">
                  {currency}
                  {symbol ? ` (${symbol})` : ""}
                </Text>
                <Feather name="chevron-down" size={20} color={fgMuted[scheme]} />
              </Pressable>
            </View>
          </View>

          <View className="mt-auto pt-8 pb-4">
            <Button
              onPress={handleCreate}
              loading={createGroup.isPending}
              disabled={createGroup.isPending}
            >
              {locale === "en" ? "Create group" : "Buat grup"}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CurrencySelectModal
        isOpen={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        selectedCurrency={currency}
        onSelectCurrency={(code) => {
          setCurrency(code);
          setCurrencyOpen(false);
        }}
      />
    </View>
  );
}
