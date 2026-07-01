import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useAppError } from "@/lib/error";
import { loginOptions, useAppForm } from "@/lib/form";
import { apiFetch } from "@/lib/api";
import { bootstrapAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import Text from "@/components/Text";
import Button from "@/components/Button";
import GoogleButton from "@/components/GoogleButton";

export default function LoginScreen() {
  const { normalizeError } = useAppError();
  const locale = useLocale();
  const router = useRouter();
  const { reset, error } = useLocalSearchParams<{
    reset?: string;
    error?: string;
  }>();

  const { mutateAsync } = useMutation({
    mutationFn: async (value: { email: string; password: string }) => {
      try {
        await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify(value),
        });
        await bootstrapAuth();
      } catch (err: unknown) {
        const appError = normalizeError(err);
        if (appError.code === "email_not_verified") {
          router.push({
            pathname: "/verify",
            params: { email: value.email },
          });
        } else {
          throw err;
        }
      }
    },
  });

  const form = useAppForm({
    ...loginOptions,
    onSubmit: async ({ value, formApi }) => {
      try {
        await mutateAsync(value);
      } catch (submitErr) {
        const appError = normalizeError(submitErr);
        formApi.setErrorMap({
          onSubmit: {
            form: appError.message,
            fields: {},
          },
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
                  {locale === "en"
                    ? "Welcome back."
                    : "Selamat datang kembali."}
                </Text>
                <Text variant="body" className="text-fg-muted">
                  {locale === "en"
                    ? "Log in to your account."
                    : "Masuk ke akun Anda."}
                </Text>
                {reset === "success" && (
                  <Text variant="caption" className="text-positive-fg">
                    {locale === "en"
                      ? "Password updated. Please log in with your new password."
                      : "Kata sandi diperbarui. Silakan masuk dengan kata sandi baru."}
                  </Text>
                )}
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
                        <field.Input
                          label="Password"
                          placeholder={
                            locale === "en"
                              ? "Your password"
                              : "Kata sandi Anda"
                          }
                          value={field.state.value}
                          onChangeText={field.handleChange}
                          secureTextEntry
                          error={errorMessage}
                        />
                      );
                    }}
                  />
                  <Link href="/forgot-password" className="self-end">
                    <Text variant="caption" className="underline text-fg-muted">
                      {locale === "en" ? "Forgot password?" : "Lupa kata sandi?"}
                    </Text>
                  </Link>
                </View>
                <View className="flex-col gap-2">
                  {reset === "success" && (
                    <Text
                      variant="caption"
                      className="text-positive-fg"
                      role="status"
                    >
                      {locale === "en"
                        ? "Password reset successfully."
                        : "Kata sandi berhasil direset."}
                    </Text>
                  )}
                  {error && (
                    <Text
                      variant="caption"
                      className="text-negative-fg"
                      role="alert"
                    >
                      {locale === "en"
                        ? "Google sign-in failed. Please try again."
                        : "Masuk dengan Google gagal. Silakan coba lagi."}
                    </Text>
                  )}
                  <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
                    {(submitError) => {
                      const isString = (item: unknown): item is string => {
                        return typeof item === "string";
                      };

                      if (isString(submitError)) {
                        return (
                          <Text
                            role="alert"
                            variant="caption"
                            className="text-negative-fg"
                          >
                            {submitError}
                          </Text>
                        );
                      }

                      return null;
                    }}
                  </form.Subscribe>
                  <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => {
                      return (
                        <Button
                          loading={isSubmitting}
                          onPress={() => form.handleSubmit()}
                        >
                          {locale === "en" ? "Log in" : "Masuk"}
                        </Button>
                      );
                    }}
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
              <View className="flex-col gap-2 mt-auto pt-6">
                <View className="flex-row justify-center">
                  <Text variant="caption" className="text-fg-muted">
                    {locale === "en"
                      ? "Don't have an account? "
                      : "Belum punya akun? "}
                    <Link href="/register">
                      <Text variant="caption" className="underline">
                        {locale === "en" ? "Sign up" : "Daftar"}
                      </Text>
                    </Link>
                  </Text>
                </View>
                <View className="flex-row justify-center">
                  <Link href="/intro">
                    <Text variant="caption" className="underline text-fg-muted">
                      {locale === "en" ? "What is Summe?" : "Apa itu Summe?"}
                    </Text>
                  </Link>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
