import type { Locale } from "./i18n";

export function formatCurrency(
  amount: number | string,
  currency: string | { code: string; symbol: string },
  showSign: boolean = false,
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const absAmount = Math.abs(num);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(absAmount);

  let symbol = "";
  if (typeof currency === "string") {
    symbol = currency;
    try {
      const formatter = new Intl.NumberFormat("en", {
        style: "currency",
        currency: currency,
        currencyDisplay: "narrowSymbol",
      });
      const parts = formatter.formatToParts(0);
      symbol =
        parts.find((part) => part.type === "currency")?.value || currency;
    } catch {
      // fallback to currency string
    }
  } else if (currency && currency.symbol) {
    symbol = currency.symbol;
  }

  if (absAmount < 0.01) {
    return `${symbol} 0`;
  }

  if (showSign) {
    if (num < 0) return `-${symbol} ${formatted}`;
    if (num > 0) return `+${symbol} ${formatted}`;
  }
  return `${symbol} ${formatted}`;
}

export function formatRelativeTime(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diffInMs = Math.max(0, now - date.getTime());
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);

  const isEn = locale === "en";
  const isToday = new Date(now).toDateString() === date.toDateString();

  if (isToday) {
    if (diffInSecs < 60) return isEn ? "just now" : "baru saja";
    if (diffInMins < 60)
      return isEn ? `${diffInMins}m ago` : `${diffInMins}m lalu`;
    return isEn ? `${diffInHours}h ago` : `${diffInHours}j lalu`;
  }

  // Fallback for any date before today
  const isCurrentYear = date.getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(isEn ? "en-US" : "id-ID", {
    month: "short",
    day: "numeric",
    year: isCurrentYear ? undefined : "numeric",
  }).format(date);
}

export function formatMemberName(
  member?: {
    name?: string | null;
    email?: string | null;
    status?: "active" | "removed";
  },
  locale?: "en" | "id",
  isCurrentUser?: boolean,
): string {
  if (!member) return "Unknown";

  let displayName =
    member.name || (member.email ? member.email.split("@")[0] : "Unknown");

  if (isCurrentUser && locale) {
    displayName =
      locale === "en" ? `${displayName} (You)` : `${displayName} (Anda)`;
  }

  if (member.status === "removed" && locale) {
    displayName += locale === "en" ? " (Removed)" : " (Dihapus)";
  }

  return displayName;
}
