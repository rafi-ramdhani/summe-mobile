import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Ported verbatim from summe-web/src/lib/cn.ts — className composition helper.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
