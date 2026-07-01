import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useAppError } from "@/lib/error";
import { forgotPasswordOptions, useAppForm } from "@/lib/form";
import { apiFetch } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import Text from "@/components/Text";
import Button from "@/components/Button";

export default function ForgotPasswordScreen() {
  const { normalizeError } = useAppError();
  const locale = useLocale();
  const router = useRouter();

  const { mutateAsync } = useMutation({
    mutationFn: async (value: { email: string }) => {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(value),
      });
      router.push({
        pathname: "/reset-otp",
        params: { email: value.email },
      });
    },
  });

  const form = useAppForm({
    ...forgotPasswordOptions,
    onSubmit: async ({ value, formApi }) => {
      try {
        await mutateAsync(value);
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
                  {locale === "en" ? "Forgot password?" : "Lupa kata sandi?"}
                </Text>
                <Text variant="body" className="text-fg-muted">
                  {locale === "en"
                    ? "Enter your email and we'll send you a 6-digit code to reset it."
                    : "Masukkan email Anda dan kami akan mengirim kode 6 digit untuk meresetnya."}
                </Text>
              </View>
              <View className="flex-col gap-6 w-full">
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
                        onChangeText={(value) => field.handleChange(value)}
                        error={errorMessage}
                      />
                    );
                  }}
                />
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
                        {locale === "en" ? "Send code" : "Kirim kode"}
                      </Button>
                    )}
                  </form.Subscribe>
                </View>
              </View>
              <View className="flex-row justify-center mt-auto pt-6">
                <Link href="/login">
                  <Text variant="caption" className="underline text-fg-muted">
                    {locale === "en" ? "Back to login" : "Kembali ke masuk"}
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
