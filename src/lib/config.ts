import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.string().default("http://localhost:3000"),
  APP_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  GOOGLE_IOS_CLIENT_ID: z.string().optional(),
  GOOGLE_ANDROID_CLIENT_ID: z.string().optional(),
  GOOGLE_WEB_CLIENT_ID: z.string().optional(),
});

export const env = envSchema.parse({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export const STORAGE_KEYS = {
  theme: "summe.theme",
  locale: "summe.locale",
  wasLoggedIn: "summe.was_logged_in",
  hasSeenIntro: "summe.has_seen_intro",
  postAuthRedirect: "summe.post_auth_redirect",
} as const;
