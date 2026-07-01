import { Pressable, View } from "react-native";
import Text from "@/components/Text";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { comingSoon } from "@/lib/comingSoon";
import { ActionIndicator } from "@/components/ActionIndicator";
import type { Group } from "@/lib/queries";

export function GroupListItem({
  group,
  isFirst,
}: {
  group: Group;
  isFirst: boolean;
}) {
  const locale = useLocale();
  const balance = Number(group.balance);
  const isZero = Math.abs(balance) < 0.01;
  const sign = isZero ? "" : balance > 0 ? "+" : "-";

  // TODO(next-pass): navigate to /groups/[groupId] when group detail exists.
  return (
    <Pressable
      onPress={() => comingSoon(locale)}
      className={cn(
        "py-4 flex-row items-center justify-between",
        !isFirst && "border-t border-border-subtle border-dashed",
      )}
    >
      <View className="flex-col flex-1 pr-3">
        <View className="flex-row items-center gap-2 mb-1">
          <Text variant="body-strong" numberOfLines={1}>
            {group.name}
          </Text>
          <ActionIndicator count={group.pendingActionCount ?? 0} />
        </View>
        <Text variant="caption" className="text-fg-muted">
          {group.memberCount} {locale === "en" ? "members" : "anggota"} &middot;{" "}
          {formatRelativeTime(group.updatedAt, locale)}
        </Text>
      </View>
      <Text
        variant="mono-data"
        className={cn(
          isZero
            ? "text-fg-muted"
            : balance > 0
              ? "text-positive-fg"
              : "text-negative-fg",
        )}
      >
        {isZero
          ? ""
          : `${sign}${formatCurrency(Math.abs(balance), group.currency)}`}
      </Text>
    </Pressable>
  );
}
