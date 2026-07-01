import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useMe, useUpdateMe } from "@/lib/queries";
import { useLocale } from "@/lib/i18n";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function ProfileScreen() {
  const locale = useLocale();
  const router = useRouter();
  const { data: userRes, isFetching } = useMe();
  const updateMe = useUpdateMe();
  const user = userRes?.data;

  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current && user?.name != null) {
      setName(user.name);
      seeded.current = true;
    }
  }, [user?.name]);

  const hasChanges = name.trim() !== (user?.name ?? "");

  const handleSave = () => {
    setErrorMsg(null);
    updateMe.mutate(
      { name: name.trim() },
      {
        onSuccess: () => router.back(),
        onError: (err) => setErrorMsg((err as Error).message),
      },
    );
  };

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={locale === "en" ? "Profile" : "Profil"}
        onBack={() => router.back()}
        isFetching={isFetching}
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
                Email
              </Text>
              <Input
                variant="underline"
                value={user?.email ?? ""}
                editable={false}
                className="text-fg-muted"
              />
            </View>

            <View className="flex-col gap-1">
              <Text variant="caption" className="text-fg-default">
                {locale === "en" ? "Name" : "Nama"}
              </Text>
              <Input
                variant="underline"
                placeholder={
                  locale === "en" ? "e.g. John Doe" : "mis. Budi Santoso"
                }
                value={name}
                onChangeText={setName}
                error={errorMsg ?? undefined}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {hasChanges && (
        <View className="p-4 border-t border-border-subtle bg-bg-base">
          <Button onPress={handleSave} loading={updateMe.isPending}>
            {locale === "en" ? "Save Changes" : "Simpan Perubahan"}
          </Button>
        </View>
      )}
    </View>
  );
}
