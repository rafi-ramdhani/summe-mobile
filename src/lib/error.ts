import { ApiError } from "./api";
import type { Locale } from "@/lib/i18n";
import { useLocaleStore } from "@/stores/localeStore";

export type AppErrorSource = "auth" | "api" | "form" | "network" | "unknown";

export type AppError = {
  code: string;
  message: string;
  status?: number;
  source: AppErrorSource;
  cause?: unknown;
};

export function useAppError() {
  const locale = useLocaleStore((s) => s.locale);

  return {
    normalizeError: (error: unknown) => normalizeError(error, locale),
  };
}

function normalizeError(error: unknown, locale: Locale): AppError {
  if (isAppError(error)) return error;

  if (error instanceof ApiError) return normalizeApiError(error, locale);

  return {
    code: "unknown_error",
    message:
      locale === "en"
        ? "Something went wrong. Please try again."
        : "Terjadi kesalahan. Silakan coba lagi.",
    source: "unknown",
    cause: error,
  };
}

function normalizeApiError(error: ApiError, locale: Locale): AppError {
  if (error.status === 401) {
    return {
      code: "invalid_credentials",
      message:
        locale === "en"
          ? "Invalid email or password."
          : "Email atau password salah.",
      source: "auth",
      status: error.status,
      cause: error,
    };
  }

  if (error.status === 403) {
    return {
      code: "email_not_verified",
      message:
        locale === "en"
          ? "Please verify your email to log in."
          : "Silakan verifikasi email Anda untuk masuk.",
      source: "auth",
      status: error.status,
      cause: error,
    };
  }

  if (error.status === 409) {
    return {
      code: "email_exists",
      message:
        locale === "en"
          ? "Email is already registered."
          : "Email sudah terdaftar.",
      source: "auth",
      status: error.status,
      cause: error,
    };
  }

  if (error.status === 429) {
    return {
      code: "too_many_requests",
      message:
        locale === "en"
          ? "Too many attempts. Please try again later."
          : "Terlalu banyak percobaan. Silakan coba lagi nanti.",
      source: "api",
      status: error.status,
      cause: error,
    };
  }

  if (error.status === 401) {
    return {
      code: error.code ?? "auth_error",
      message:
        locale === "en"
          ? "Unable to log in. Please try again."
          : "Tidak dapat masuk. Silakan coba lagi.",
      source: "auth",
      status: error.status,
      cause: error,
    };
  }

  return {
    code: error.code ?? "api_error",
    message: locale === "en" ? "Something went wrong." : "Terjadi kesalahan.",
    source: "api",
    status: error.status,
    cause: error,
  };
}

function isAppError(error: unknown): error is AppError {
  return typeof error === "object" && error !== null && "source" in error;
}

export { normalizeError as normalizeErrorForTest };
