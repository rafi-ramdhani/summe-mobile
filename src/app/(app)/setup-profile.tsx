import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { useMe, useUpdateMe } from "@/lib/queries";
import { consumePostAuthRedirect } from "@/lib/postAuthRedirect";
import { useLocale } from "@/lib/i18n";
import Text from "@/components/Text";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function SetupProfileScreen() {
  const locale = useLocale();
  const router = useRouter();
  const { data: userRes } = useMe();
  const updateMe = useUpdateMe();
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const email = userRes?.data?.email;

  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current && userRes?.data?.name) {
      setName(userRes.data.name);
      seeded.current = true;
    }
  }, [userRes?.data?.name]);

  // After onboarding, honor a pending post-auth redirect (e.g. a group invite
  // sent the user here via /register?redirect=/invitations); else go home.
  const goToDashboard = async () => {
    const target = await consumePostAuthRedirect();
    if (target) {
      router.replace(target as Href);
    } else {
      router.replace("/(app)");
    }
  };

  const handleContinue = () => {
    if (!email) return;
    setErrorMsg(null);
    updateMe.mutate(
      { name: name.trim() },
      {
        onSuccess: goToDashboard,
        onError: (err) => setErrorMsg((err as Error).message),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-5 pt-10 gap-8">
            <Text variant="body-strong" className="text-center">
              Summe
            </Text>
            <View className="flex-col gap-2">
              <Text variant="display">
                {locale === "en" ? "Set up your profile." : "Atur profil Anda."}
              </Text>
              <Text variant="body" className="text-fg-muted">
                {locale === "en"
                  ? "We'll use your name to show who paid and who owes."
                  : "Kami memakai nama Anda untuk menampilkan siapa membayar dan siapa berutang."}
              </Text>
            </View>
            <Input
              label={locale === "en" ? "Name" : "Nama"}
              placeholder={locale === "en" ? "Your name" : "Nama Anda"}
              value={name}
              onChangeText={setName}
              error={errorMsg ?? undefined}
            />
            <View className="flex-col gap-3 mt-auto pb-8">
              <Button
                onPress={handleContinue}
                disabled={name.trim().length === 0 || !email}
                loading={updateMe.isPending}
              >
                {locale === "en" ? "Continue" : "Lanjut"}
              </Button>
              <Button variant="secondary" onPress={goToDashboard}>
                {locale === "en" ? "Skip for now" : "Lewati dulu"}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
