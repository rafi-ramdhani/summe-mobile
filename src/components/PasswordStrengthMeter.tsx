import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { View } from "react-native";
import Text from "./Text";
import { cn } from "@/lib/cn";
import { getPasswordScore } from "@/lib/password";
import type { Locale } from "@/lib/i18n";

type Props = {
  password: string;
  onScoreChange: (score: number) => void;
  locale: Locale;
};

const LABELS: Record<Locale, string[]> = {
  en: ["Very weak", "Weak", "Fair", "Strong", "Very strong"],
  id: ["Sangat lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"],
};

const BAR_COLORS = [
  "bg-negative-fg",
  "bg-negative-fg",
  "bg-fg-muted",
  "bg-fg-default",
  "bg-fg-default",
];

export default function PasswordStrengthMeter({
  password,
  onScoreChange,
  locale,
}: Props) {
  const [score, setScore] = useState(0);

  const onScoreChangeRef = useRef(onScoreChange);
  useLayoutEffect(() => {
    onScoreChangeRef.current = onScoreChange;
  }, [onScoreChange]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      getPasswordScore(password).then((s) => {
        if (!active) return;
        setScore(s);
        onScoreChangeRef.current(s);
      });
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [password]);

  if (!password) return null;

  return (
    <View className="flex flex-col gap-1">
      <View className="flex flex-row gap-1">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= score ? BAR_COLORS[score] : "bg-bg-subtle-emphasized",
            )}
          />
        ))}
      </View>
      <Text variant="caption" className="text-fg-muted">
        {LABELS[locale][score]}
      </Text>
    </View>
  );
}
