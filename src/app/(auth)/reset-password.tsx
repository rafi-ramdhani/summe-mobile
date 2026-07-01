import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useAppError } from "@/lib/error";
import { resetPasswordOptions, useAppForm } from "@/lib/form";
import { apiFetch } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import Text from "@/components/Text";
import Button from "@/components/Button";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { getPasswordScore, MIN_PASSWORD_SCORE } from "@/lib/password";

export default function ResetPasswordScreen() {
  const { normalizeError } = useAppError();
  const locale = useLocale();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  // PasswordStrengthMeter requires onScoreChange; the submit gate reads the
  // score directly via getPasswordScore, so the parent doesn't track it.
  const handleScore = useCallback(() => {}, []);
  // Reveal the confirm-password field once a password has been entered. Once
  // shown it stays shown, even if the password is later cleared.
  const [confirmRevealed, setConfirmRevealed] = useState(false);

  const { mutateAsync } = useMutation({
    mutationFn: async (value: { password: string }) => {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: value.password }),
      });
      router.push({
        pathname: "/login",
        params: { reset: "success" },
      });
    },
  });

  const form = useAppForm({
    ...resetPasswordOptions,
    onSubmit: async ({ value, formApi }) => {
      const currentScore = await getPasswordScore(value.password);
      if (currentScore < MIN_PASSWORD_SCORE) {
        formApi.setErrorMap({
          onSubmit: {
            form:
              locale === "en"
                ? "Please choose a stronger password."
                : "Pilih kata sandi yang lebih kuat.",
            fields: {},
          },
        });
        return;
      }
      try {
        await mutateAsync({ password: value.password });
      } catch (error) {
        const appError = normalizeError(error);
        formApi.setErrorMap({
          onSubmit: { form: appError.message, fields: {} },
        });
      }
    },
  });

  if (!token) {
    return (
      <SafeAreaView className="flex-1 bg-bg-base">
        <View className="flex-1 justify-center max-w-sm w-full self-center px-6 py-12">
          <Text variant="title-2" className="mb-2 text-center">
            {locale === "en" ? "Invalid Request" : "Permintaan Tidak Valid"}
          </Text>
          <Text variant="body" className="text-fg-muted mb-8 text-center">
            {locale === "en"
              ? "This reset link is missing or has expired. Please start again."
              : "Tautan reset tidak ada atau telah kedaluwarsa. Silakan mulai ulang."}
          </Text>
          <Button onPress={() => router.push("/forgot-password")}>
            {locale === "en" ? "Back" : "Kembali"}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

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
          <View className="flex-1 px-5 pt-10 pb-8 gap-8">
            <Text variant="body-strong" className="text-center">
              Summe
            </Text>
            <View className="flex-1 gap-8 w-full">
              <View className="flex-col gap-2">
                <Text variant="display">
                  {locale === "en"
                    ? "Set a new password."
                    : "Atur kata sandi baru."}
                </Text>
                <Text variant="body" className="text-fg-muted">
                  {locale === "en"
                    ? "Choose a strong password you don't use elsewhere."
                    : "Pilih kata sandi kuat yang tidak Anda gunakan di tempat lain."}
                </Text>
              </View>
              <View className="flex-col gap-6 w-full">
                <View className="flex-col gap-4">
                  <form.AppField
                    name="password"
                    children={(field) => {
                      const errorMessage = !field.state.meta.isValid
                        ? field.state.meta.errors[
                            field.state.meta.errors.length - 1
                          ]?.message
                        : "";
                      return (
                        <View className="flex-col gap-2">
                          <field.Input
                            label="Password"
                            placeholder={
                              locale === "en"
                                ? "New password"
                                : "Kata sandi baru"
                            }
                            value={field.state.value}
                            onChangeText={(text) => {
                              field.handleChange(text);
                              if (text.length > 0) setConfirmRevealed(true);
                            }}
                            secureTextEntry
                            error={errorMessage}
                          />
                          <PasswordStrengthMeter
                            password={field.state.value}
                            onScoreChange={handleScore}
                            locale={locale}
                          />
                        </View>
                      );
                    }}
                  />
                  {confirmRevealed && (
                    <form.AppField
                      name="confirmPassword"
                      children={(field) => {
                        const errorMessage = !field.state.meta.isValid
                          ? field.state.meta.errors[
                              field.state.meta.errors.length - 1
                            ]?.message
                          : "";
                        return (
                          <field.Input
                            label={
                              locale === "en"
                                ? "Confirm password"
                                : "Konfirmasi kata sandi"
                            }
                            placeholder={
                              locale === "en"
                                ? "Re-enter password"
                                : "Masukkan ulang kata sandi"
                            }
                            value={field.state.value}
                            onChangeText={field.handleChange}
                            secureTextEntry
                            error={errorMessage}
                          />
                        );
                      }}
                    />
                  )}
                </View>
                <View className="flex-col gap-2">
                  <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
                    {(error) =>
                      typeof error === "string" ? (
                        <Text
                          role="alert"
                          variant="caption"
                          className="text-negative-fg"
                        >
                          {error}
                        </Text>
                      ) : null
                    }
                  </form.Subscribe>
                  <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        loading={isSubmitting}
                        onPress={() => form.handleSubmit()}
                      >
                        {locale === "en" ? "Reset password" : "Reset kata sandi"}
                      </Button>
                    )}
                  </form.Subscribe>
                </View>
              </View>
              <View className="flex-row justify-center mt-auto pt-6">
                <Link href="/login">
                  <Text variant="caption" className="underline text-fg-muted">
                    {locale === "en" ? "Back to Login" : "Kembali ke Masuk"}
                  </Text>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
