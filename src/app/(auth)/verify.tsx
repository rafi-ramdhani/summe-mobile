import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useAppError } from "@/lib/error";
import { apiFetch } from "@/lib/api";
import { bootstrapAuth } from "@/lib/auth";
import { setToken } from "@/lib/secureToken";
import { useLocale } from "@/lib/i18n";
import Text from "@/components/Text";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function VerifyScreen() {
  const locale = useLocale();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { normalizeError } = useAppError();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>(undefined);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const {
    mutateAsync: verifyEmail,
    error: verifyError,
    isPending: isVerifying,
  } = useMutation({
    mutationFn: async (value: { code: string }) => {
      if (!email) throw new Error("Email is required");
      const res = await apiFetch<{ data?: { token?: string } }>(
        "/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ email, code: value.code }),
        },
      );
      if (res?.data?.token) await setToken(res.data.token);
      await bootstrapAuth();
      router.replace("/setup-profile");
    },
  });

  const { mutateAsync: resendCode, error: resendError } = useMutation({
    mutationFn: async () => {
      if (!email) return;
      setResendStatus("loading");
      await apiFetch("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => {
      setResendStatus("idle");
      setCountdown(60);
    },
    onError: () => setResendStatus("error"),
  });

  if (!email) {
    return (
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-1 justify-center max-w-sm w-full self-center px-6 py-12">
          <Text variant="title-2" className="mb-2 text-center">
            {locale === "en" ? "Invalid Request" : "Permintaan Tidak Valid"}
          </Text>
          <Text variant="body" className="text-fg-muted mb-8 text-center">
            {locale === "en"
              ? "Missing email address. Please try registering or logging in again."
              : "Alamat email tidak ditemukan. Silakan coba mendaftar atau masuk kembali."}
          </Text>
          <Button onPress={() => router.replace("/login")}>
            {locale === "en" ? "Back to Login" : "Kembali ke Masuk"}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const appError = verifyError ? normalizeError(verifyError) : null;
  const canSubmit = code.length === 6;
  const resendDisabled = resendStatus === "loading" || countdown > 0;

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
          <View className="flex-1 justify-center max-w-sm w-full self-center px-6 py-12">
            <View className="mb-8">
              <Text variant="title-2" className="mb-2 text-center">
                {locale === "en" ? "Verify your email" : "Verifikasi email Anda"}
              </Text>
              <Text variant="body" className="text-fg-muted text-center">
                {locale === "en"
                  ? "We sent a 6-digit code to "
                  : "Kami mengirimkan kode 6 digit ke "}
                <Text variant="body-strong" className="text-fg-default">
                  {email}
                </Text>
              </Text>
            </View>

            <View className="gap-4">
              <Input
                label={
                  locale === "en" ? "Verification Code" : "Kode Verifikasi"
                }
                value={code}
                onChangeText={(value) => {
                  setCode(value);
                  setCodeError(
                    value.length !== 6
                      ? "Code must be exactly 6 characters"
                      : undefined,
                  );
                }}
                error={codeError}
                placeholder="123456"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
              />

              {appError && (
                <Text variant="caption" className="text-red-500">
                  {appError.message}
                </Text>
              )}

              <Button
                disabled={!canSubmit || isVerifying}
                loading={isVerifying}
                onPress={() => verifyEmail({ code })}
              >
                {locale === "en" ? "Verify Email" : "Verifikasi Email"}
              </Button>
            </View>

            <View className="mt-8 items-center">
              <Text variant="caption" className="text-fg-muted mb-2">
                {locale === "en"
                  ? "Didn't receive the code?"
                  : "Tidak menerima kode?"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: resendDisabled }}
                disabled={resendDisabled}
                onPress={() => resendCode()}
                className={resendDisabled ? "opacity-50" : undefined}
              >
                <Text variant="caption" className="font-grotesk-medium underline text-fg-default">
                  {resendStatus === "loading" &&
                    (locale === "en" ? "Sending..." : "Mengirim...")}
                  {resendStatus !== "loading" &&
                    countdown > 0 &&
                    (locale === "en"
                      ? `Resend code in ${countdown}s`
                      : `Kirim ulang dalam ${countdown}d`)}
                  {resendStatus === "error" &&
                    countdown === 0 &&
                    (locale === "en" ? "Failed. Try again." : "Gagal. Coba lagi.")}
                  {resendStatus === "idle" &&
                    countdown === 0 &&
                    (locale === "en" ? "Resend code" : "Kirim ulang kode")}
                </Text>
              </Pressable>
              {resendError && (
                <Text variant="caption" className="text-red-500 mt-2">
                  {normalizeError(resendError).message}
                </Text>
              )}
            </View>

            <View className="mt-8 items-center">
              <Link href="/login">
                <Text variant="caption" className="underline text-fg-muted">
                  {locale === "en" ? "Back to Login" : "Kembali ke Masuk"}
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
