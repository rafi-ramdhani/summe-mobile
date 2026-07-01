import { useState } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColorScheme } from "nativewind";
import Text from "@/components/Text";
import Button from "@/components/Button";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const bgRaised = { light: "#ffffff", dark: "#1c1c1f" } as const;
const borderDefault = { light: "#d4d4d2", dark: "#36363b" } as const;

const TOOTH_WIDTH = 16;
const TOOTH_HEIGHT = 9;

// RN port of web's CSS-mask torn edge: a strip of downward triangles drawn
// with SVG, filled like the receipt card and stroked only along the zigzag.
function TornEdge() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";
  const [width, setWidth] = useState(0);

  const teeth = Math.max(1, Math.ceil(width / TOOTH_WIDTH));
  let d = `M 0 0`;
  for (let i = 0; i < teeth; i++) {
    const x = i * TOOTH_WIDTH;
    d += ` L ${x + TOOTH_WIDTH / 2} ${TOOTH_HEIGHT} L ${x + TOOTH_WIDTH} 0`;
  }

  return (
    <View
      // Cancel the card's side borders so the teeth span its full outer width.
      className="-mx-px h-[9px]"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Svg width={width} height={TOOTH_HEIGHT + 1}>
          <Path
            d={`${d} Z`}
            fill={bgRaised[scheme]}
            stroke="none"
          />
          <Path
            d={d}
            fill="none"
            stroke={borderDefault[scheme]}
            strokeWidth={1}
          />
        </Svg>
      )}
    </View>
  );
}

type ReceiptRow = { label: string; value: string };

type ReceiptNotFoundProps = {
  /** Shown in the receipt header, e.g. "RECEIPT #404". */
  receiptLabel: string;
  rows: ReceiptRow[];
  /** Small muted line above the total, e.g. "ITEM NOT FOUND". */
  footerNote: string;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

/**
 * Receipt-themed empty/error state: a torn paper receipt with a heading,
 * message, and a single primary action. Used by the group-not-found state.
 */
export function ReceiptNotFound({
  receiptLabel,
  rows,
  footerNote,
  title,
  message,
  actionLabel,
  onAction,
}: ReceiptNotFoundProps) {
  return (
    <View className="w-full flex-col justify-center items-center gap-7">
      <View className="w-full max-w-[260px]">
        <View className="bg-bg-raised border border-b-0 border-border-default pt-5 px-5 pb-6">
          <View className="flex-col items-center gap-0.5">
            <Text variant="mono-data-strong" className="tracking-[2px]">
              SUMME
            </Text>
            <Text variant="mono-caption" className="text-fg-muted">
              {receiptLabel}
            </Text>
          </View>

          <View className="my-4 border-t border-dashed border-border-default" />

          <View className="flex-col gap-2">
            {rows.map((row) => (
              <LeaderRow key={row.label} label={row.label} value={row.value} />
            ))}
          </View>

          <View className="my-4 border-t border-dashed border-border-default" />

          <View className="flex-col items-center gap-1">
            <Text variant="mono-caption" className="text-fg-muted text-center">
              {footerNote}
            </Text>
            <Text
              variant="mono-data-strong"
              className="text-fg-strong text-center"
            >
              TOTAL --.--
            </Text>
          </View>
        </View>
        <TornEdge />
      </View>

      <View className="flex-col items-center gap-3">
        <Text variant="title-3" className="text-center">
          {title}
        </Text>
        <Text
          variant="body"
          className="text-fg-muted max-w-[280px] text-center"
        >
          {message}
        </Text>
      </View>

      <View className="w-full max-w-[260px]">
        <Button onPress={onAction}>{actionLabel}</Button>
      </View>
    </View>
  );
}

function LeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline gap-2">
      <Text variant="mono-caption" className="text-fg-muted">
        {label}
      </Text>
      <View className="flex-1 -translate-y-[3px] border-b border-dotted border-border-default-emphasized" />
      <Text variant="mono-caption" className="text-fg-default">
        {value}
      </Text>
    </View>
  );
}
