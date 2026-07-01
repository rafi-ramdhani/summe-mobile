import { useToastStore } from "@/stores/toastStore";

export function comingSoon(locale: "en" | "id"): void {
  useToastStore
    .getState()
    .addToast(locale === "en" ? "Coming soon" : "Segera hadir", "info");
}
