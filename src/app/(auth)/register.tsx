import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useAppError } from "@/lib/error";
import { registerOptions, useAppForm } from "@/lib/form";
import { apiFetch } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import Text from "@/components/Text";
import Button from "@/components/Button";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { getPasswordScore, MIN_PASSWORD_SCORE } from "@/lib/password";
import GoogleButton from "@/components/GoogleButton";

export default function RegisterScreen() {
  const { normalizeError } = useAppError();
  const locale = useLocale();
  const router = useRouter();
  // PasswordStrengthMeter requires onScoreChange; the submit gate reads the
  // score directly via getPasswordScore, so the parent doesn't track it.
  const handleScore = useCallback(() => {}, []);
  // Reveal the confirm-password field once a password has been entered. Once
  // shown it stays shown, even if the password is later cleared.
  const [confirmRevealed, setConfirmRevealed] = useState(false);

  const { mutateAsync } = useMutation({
    mutationFn: async (value: { email: string; password: string }) => {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(value),
      });
      router.push({
        pathname: "/verify",
        params: { email: value.email },
      });
    },
  });

  const form = useAppForm({
    ...registerOptions,
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
        await mutateAsync({ email: value.email, password: value.password });
      } catch (error) {
        const appError = normalizeError(error);
        formApi.setErrorMap({
          onSubmit: { form: appError.message, fields: {} },
        });
      }
    },
  });

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
                  {locale === "en" ? "Create your account." : "Buat akun Anda."}
                </Text>
                <Text variant="body" className="text-fg-muted">
                  {locale === "en"
                    ? "Track trip expenses. Split fairly. Settle cleanly."
                    : "Lacak pengeluaran perjalanan. Bagi dengan adil. Selesaikan dengan rapi."}
                </Text>
              </View>
              <View className="flex-col gap-6 w-full">
                <View className="flex-col gap-4">
                  <form.AppField
                    name="email"
                    children={(field) => {
                      const errorMessage = !field.state.meta.isValid
                        ? field.state.meta.errors[
                            field.state.meta.errors.length - 1
                          ]?.message
                        : "";
                      return (
                        <field.Input
                          label="Email"
                          placeholder="you@email.com"
                          value={field.state.value}
                          onChangeText={field.handleChange}
                          error={errorMessage}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      );
                    }}
                  />
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
                                ? "Choose a password"
                                : "Pilih kata sandi"
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
                        {locale === "en" ? "Sign up" : "Daftar"}
                      </Button>
                    )}
                  </form.Subscribe>
                  <View className="flex-row items-center gap-3 py-1">
                    <View className="h-px flex-1 bg-border" />
                    <Text variant="caption" className="text-fg-muted">
                      {locale === "en" ? "or" : "atau"}
                    </Text>
                    <View className="h-px flex-1 bg-border" />
                  </View>
                  <GoogleButton />
                </View>
              </View>
              <View className="flex-row justify-center mt-auto pt-6">
                <Text variant="caption" className="text-fg-muted">
                  {locale === "en"
                    ? "Already have an account? "
                    : "Sudah punya akun? "}
                  <Link href="/login">
                    <Text variant="caption" className="underline">
                      {locale === "en" ? "Log in" : "Masuk"}
                    </Text>
                  </Link>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
