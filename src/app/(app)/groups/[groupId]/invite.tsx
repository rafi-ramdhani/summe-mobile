import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useInviteMember, useGroupDetail } from "@/lib/queries";
import { generateUUID } from "@/lib/api";
import { useLocale } from "@/lib/i18n";

const EMAIL_RE = /^[^@]+@[^@]+\.[^@]+$/;

function CheckmarkIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Path
        d="M10 24L19 33L38 14"
        stroke="#10B981"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function InviteMemberScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const locale = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateUUID());

  const { data: groupResponse, isFetching } = useGroupDetail(groupId);
  const inviteMutation = useInviteMember(groupId);

  const groupName = groupResponse?.data?.name || "";
  const title = locale === "en" ? "Invite by email" : "Undang via email";

  const validationError =
    email && !EMAIL_RE.test(email)
      ? locale === "en"
        ? "Invalid email address"
        : "Alamat email tidak valid"
      : submitAttempted && !email
        ? locale === "en"
          ? "Email address is required"
          : "Alamat email wajib diisi"
        : undefined;

  const errorText =
    validationError ??
    (inviteMutation.isError
      ? (inviteMutation.error as Error)?.message ||
        (locale === "en"
          ? "Failed to send invitation"
          : "Gagal mengirim undangan")
      : undefined);

  const resetForm = () => {
    setIdempotencyKey(generateUUID());
    setEmail("");
    setSubmitAttempted(false);
    inviteMutation.reset();
    setIsSuccess(false);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!email || !EMAIL_RE.test(email)) return;
    try {
      await inviteMutation.mutateAsync(
        { email, idempotencyKey },
        { onSettled: () => setIdempotencyKey(generateUUID()) },
      );
      setInvitedEmail(email);
      setIsSuccess(true);
    } catch {
      // Surfaced via the mutation error state and the global toast.
    }
  };

  if (isSuccess) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader title={title} onBack={resetForm} isFetching={isFetching} />
        <View className="flex-1 px-4">
          <View className="flex-1 items-center justify-center -mt-20">
            <View className="mb-6">
              <CheckmarkIcon />
            </View>
            <Text variant="title-2" className="text-fg-default mb-2 text-center">
              {locale === "en" ? "Invitation sent" : "Undangan terkirim"}
            </Text>
            <Text variant="caption" className="text-fg-muted text-center">
              {invitedEmail} &middot; {groupName}
            </Text>
            <Text
              variant="body"
              className="text-fg-muted mt-6 text-center max-w-[320px]"
            >
              {locale === "en"
                ? "They'll see it in their inbox and in their app."
                : "Mereka akan melihatnya di kotak masuk dan di aplikasi mereka."}
            </Text>
          </View>
          <View
            className="flex-col gap-3 pt-8"
            style={{ paddingBottom: 16 + insets.bottom }}
          >
            <Button variant="secondary" onPress={resetForm}>
              {locale === "en" ? "Send another" : "Kirim lagi"}
            </Button>
            <Button variant="primary" onPress={() => router.back()}>
              {locale === "en" ? "Done" : "Selesai"}
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={title}
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
          <View className="flex-1 pt-4" style={{ paddingBottom: 16 + insets.bottom }}>
            <View className="flex-col gap-6 mt-4">
              <View className="flex-col gap-1">
                <Text variant="caption" className="text-fg-default">
                  {locale === "en" ? "Email address" : "Alamat email"}
                </Text>
                <Input
                  variant="underline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={errorText}
                  helperText={
                    !errorText
                      ? locale === "en"
                        ? "We'll send them a link to join this group."
                        : "Kami akan mengirimkan tautan untuk bergabung dengan grup ini."
                      : undefined
                  }
                />
              </View>
            </View>
            <View className="mt-auto pt-8">
              <Button
                variant="primary"
                disabled={inviteMutation.isPending || isFetching}
                loading={inviteMutation.isPending}
                onPress={handleSubmit}
              >
                {locale === "en" ? "Send invitation" : "Kirim undangan"}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
