// summe-mobile port of summe-web/src/routes/{-$locale}/_unauthenticated/-intro/IntroStory.tsx
// Auto-advancing story: progress bars, tap zones (prev/next), and per-slide
// mockups. Behaviour matches web verbatim; web-only APIs swapped for RN ones.
import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import Text from "@/components/Text";
import Button from "@/components/Button";
import type { Locale } from "@/lib/i18n";
import { getSlides } from "./slides";

const SLIDE_MS = 5000;
const TICK_MS = 50;

type Props = {
  onGetStarted: () => void;
  onLogin: () => void;
  locale: Locale;
};

type StoryState = { index: number; progress: number; ctaShown: boolean };

export default function IntroStory({ onGetStarted, onLogin, locale }: Props) {
  const slides = getSlides(locale);
  const lastIndex = slides.length - 1;
  // Combine index + progress into one object so navigation resets progress
  // atomically. `ctaShown` latches true once the last slide is reached and never
  // resets, so the CTAs stay visible even as the story keeps looping.
  const [state, setState] = useState<StoryState>({
    index: 0,
    progress: 0,
    ctaShown: false,
  });
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  // Whether the async reduced-motion check has resolved. RN's
  // AccessibilityInfo.isReduceMotionEnabled() is a Promise (unlike web's
  // synchronous matchMedia), so we hold auto-advance until it settles rather
  // than briefly running the interval and then tearing it down.
  const [motionChecked, setMotionChecked] = useState(false);
  const { index, progress, ctaShown } = state;
  const en = locale === "en";

  // RN equivalent of web's matchMedia("(prefers-reduced-motion: reduce)").
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (!mounted) return;
      setReduced(value);
      setMotionChecked(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Move to `nextIndex`, resetting progress and latching the CTA once the last
  // slide has been reached.
  const goTo = (s: StoryState, nextIndex: number): StoryState => ({
    index: nextIndex,
    progress: 0,
    ctaShown: s.ctaShown || nextIndex === lastIndex,
  });

  const next = () => setState((s) => goTo(s, (s.index + 1) % slides.length));

  const prev = () => setState((s) => goTo(s, Math.max(s.index - 1, 0)));

  useEffect(() => {
    if (!motionChecked || reduced || paused) return;
    const timer = setInterval(() => {
      setState((s) => {
        const nextValue = s.progress + TICK_MS / SLIDE_MS;
        if (nextValue >= 1) {
          // Loop: wrap from the last slide back to the first.
          return goTo(s, (s.index + 1) % slides.length);
        }
        return { ...s, progress: nextValue };
      });
    }, TICK_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionChecked, reduced, paused, slides.length]);

  const slide = slides[index];

  return (
    <View className="relative flex-1 bg-bg-base">
      {/* progress bars */}
      <View className="flex-row gap-1 px-4 pt-3">
        {slides.map((s, i) => (
          <View
            key={s.id}
            className="h-1 flex-1 overflow-hidden rounded-full bg-bg-subtle-emphasized"
          >
            <View
              className="h-full bg-fg-default"
              style={{
                width:
                  i < index
                    ? "100%"
                    : i === index
                      ? `${progress * 100}%`
                      : "0%",
              }}
            />
          </View>
        ))}
      </View>

      {/* top bar: brand */}
      <View className="flex-row items-center px-4 py-3">
        <Text variant="body-strong">Summe</Text>
      </View>

      {/* tap zones (behind content) */}
      <Pressable
        accessibilityLabel={en ? "Previous" : "Sebelumnya"}
        className="absolute inset-y-0 left-0 w-1/3"
        style={{ zIndex: 0 }}
        onPress={prev}
        onPressIn={() => setPaused(true)}
        onPressOut={() => setPaused(false)}
      />
      <Pressable
        accessibilityLabel={en ? "Next" : "Berikutnya"}
        className="absolute inset-y-0 right-0 w-2/3"
        style={{ zIndex: 0 }}
        onPress={next}
        onPressIn={() => setPaused(true)}
        onPressOut={() => setPaused(false)}
      />

      {/* slide content: sits above the tap zones but lets touches fall through */}
      <View
        pointerEvents="none"
        className="relative flex-1 items-center justify-center gap-8 px-6"
        style={{ zIndex: 10 }}
      >
        <slide.Mockup />
        <View className="items-center gap-2">
          <Text variant="title-1" className="text-center">
            {slide.headline}
          </Text>
          <Text variant="body" className="text-center text-fg-muted">
            {slide.subtext}
          </Text>
        </View>
      </View>

      {/* CTAs: revealed on first reaching the last slide, then kept for good */}
      {ctaShown && (
        <View className="gap-3 px-6 pb-10" style={{ zIndex: 10 }}>
          <Button onPress={onGetStarted}>
            {en ? "Get Started" : "Mulai"}
          </Button>
          <Pressable onPress={onLogin} className="items-center">
            <Text variant="caption" className="text-fg-muted">
              {en
                ? "Already have an account? Log in"
                : "Sudah punya akun? Masuk"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
