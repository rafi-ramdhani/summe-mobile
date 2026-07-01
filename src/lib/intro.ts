// Non-hook helpers for reading/updating intro state outside React components
// (e.g. router guards, imperative navigation logic).
import { useIntroStore } from "@/stores/introStore";

export function hasSeenIntro(): boolean {
  return useIntroStore.getState().hasSeenIntro;
}

export function markIntroSeen(): void {
  useIntroStore.getState().markSeen();
}

export function hydrateIntro(): Promise<void> {
  return useIntroStore.getState().hydrate();
}
