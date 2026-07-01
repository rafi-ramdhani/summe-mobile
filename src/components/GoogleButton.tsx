import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Ionicons } from "@expo/vector-icons";
import { env } from "@/lib/config";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/secureToken";
import { bootstrapAuth } from "@/lib/auth";
import Button from "@/components/Button";

WebBrowser.maybeCompleteAuthSession();

export function isGoogleConfigured(): boolean {
  return Boolean(env.GOOGLE_IOS_CLIENT_ID || env.GOOGLE_ANDROID_CLIENT_ID || env.GOOGLE_WEB_CLIENT_ID);
}

export default function GoogleButton() {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: env.GOOGLE_IOS_CLIENT_ID,
    androidClientId: env.GOOGLE_ANDROID_CLIENT_ID,
    webClientId: env.GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.params?.id_token ?? response.authentication?.idToken;
    if (!idToken) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch<{ data: { token: string } }>("/auth/google/mobile", {
          method: "POST",
          body: JSON.stringify({ idToken }),
        });
        if (cancelled) return;
        await setToken(data.data.token);
        await bootstrapAuth();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [response]);

  if (!isGoogleConfigured()) return null;

  return (
    <Button
      variant="secondary"
      loading={loading}
      disabled={!request}
      onPress={() => promptAsync()}
    >
      <Ionicons name="logo-google" size={18} />
      {" "}
      {locale === "en" ? "Continue with Google" : "Lanjutkan dengan Google"}
    </Button>
  );
}
