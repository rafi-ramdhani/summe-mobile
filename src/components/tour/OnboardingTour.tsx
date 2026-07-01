import { useEffect, useRef } from "react";
import { View } from "react-native";
import {
  CopilotProvider,
  useCopilot,
  walkthroughable,
} from "react-native-copilot";
import { useColorScheme } from "nativewind";
import { useOnboarding, useUpdateOnboarding } from "@/lib/queries";
import { shouldAutoStartTour } from "@/lib/onboarding";

export const WalkthroughView = walkthroughable(View);

const overlay = { light: "rgba(0,0,0,0.6)", dark: "rgba(0,0,0,0.7)" } as const;

// Bridges copilot's imperative controls to onboarding status. Rendered inside
// CopilotProvider so useCopilot() is available.
function TourController({ manualRef }: { manualRef: React.MutableRefObject<boolean> }) {
  const { start, copilotEvents } = useCopilot();
  const { data } = useOnboarding();
  const update = useUpdateOnboarding();
  const autoStartedRef = useRef(false);
  const reachedStopRef = useRef(false);

  useEffect(() => {
    const onStop = () => {
      reachedStopRef.current = true;
      if (manualRef.current) {
        manualRef.current = false;
        return; // replay must not rewrite status
      }
      update.mutate({ tourStatus: "completed" });
    };
    copilotEvents.on("stop", onStop);
    return () => copilotEvents.off("stop", onStop);
  }, [copilotEvents, update, manualRef]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!shouldAutoStartTour(data?.data)) return;
    autoStartedRef.current = true;
    start();
  }, [data, start]);

  // Expose start via a module-scoped setter (see useTourControls).
  useEffect(() => {
    tourStartRef.current = (opts?: { manual?: boolean }) => {
      manualRef.current = opts?.manual ?? false;
      start();
    };
    return () => {
      tourStartRef.current = null;
    };
  }, [start, manualRef]);

  return null;
}

const tourStartRef: { current: ((opts?: { manual?: boolean }) => void) | null } = {
  current: null,
};

export function useTourControls() {
  return {
    start: (opts?: { manual?: boolean }) => tourStartRef.current?.(opts),
  };
}

export function OnboardingTour({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useColorScheme();
  const manualRef = useRef(false);
  return (
    <CopilotProvider
      overlay="view"
      backdropColor={overlay[colorScheme ?? "light"]}
      animated
      stopOnOutsideClick={false}
    >
      <TourController manualRef={manualRef} />
      {children}
    </CopilotProvider>
  );
}
