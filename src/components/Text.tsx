import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

type Variant =
  | "display" | "title-1" | "title-2" | "title-3"
  | "body" | "body-strong" | "label" | "caption"
  | "mono-data" | "mono-data-strong" | "mono-caption";

const variantClass: Record<Variant, string> = {
  display: "font-grotesk-bold text-[48px] leading-[56px] tracking-[-2px]",
  "title-1": "font-grotesk-bold text-[32px] leading-[40px] tracking-[-1px]",
  "title-2": "font-grotesk-bold text-[24px] leading-[32px] tracking-[-1px]",
  "title-3": "font-grotesk-medium text-[20px] leading-[28px]",
  body: "font-grotesk text-[17px] leading-[26px]",
  "body-strong": "font-grotesk-medium text-[17px] leading-[26px]",
  label: "font-grotesk-medium text-[13px] leading-[18px] tracking-[1px]",
  caption: "font-grotesk text-[13px] leading-[18px]",
  "mono-data": "font-mono text-[17px] leading-[26px]",
  "mono-data-strong": "font-mono-bold text-[17px] leading-[26px]",
  "mono-caption": "font-mono text-[13px] leading-[18px]",
};

type Props = { variant?: Variant; className?: string } & TextProps;

export default function Text({ variant = "body", className, ...rest }: Props) {
  return <RNText className={cn(variantClass[variant], "text-fg-default", className)} {...rest} />;
}
