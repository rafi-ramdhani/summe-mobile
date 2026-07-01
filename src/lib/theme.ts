import { useColorScheme } from "nativewind";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const bgBase = { light: "#fafaf9", dark: "#0c0c0d" } as const;

// Native stack scenes default to a white background, which flashes during
// push/pop transitions before NativeWind paints the screen's own bg class.
// Feed this into every Stack's `contentStyle` so scenes are themed natively.
export function useScreenBackground(): string {
  const { colorScheme } = useColorScheme();
  return bgBase[colorScheme ?? "light"];
}
