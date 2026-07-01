import { Pressable, View } from "react-native";
import Text from "@/components/Text";
import { ActionIndicator } from "@/components/ActionIndicator";
import { cn } from "@/lib/cn";
import { formatCurrency, formatMemberName } from "@/lib/format";
import { isActionable } from "@/lib/groups";
import { comingSoon } from "@/lib/comingSoon";
import type { Locale } from "@/lib/i18n";
import type { GroupDetail } from "@/lib/queries";

export function BalancesTab({
  locale,
  group,
  userId,
}: {
  locale: Locale;
  group: GroupDetail;
  userId?: string;
}) {
  const ownerId = group.members.find((m) => m.role === "owner")?.id;
  const pendingActionCount =
    group.settlements?.filter((s) =>
      isActionable(s, userId, group.members, ownerId),
    ).length || 0;

  return (
    <View className="flex-col">
      <View className="flex-row items-center justify-between mb-4">
        <Text variant="caption" className="text-fg-muted tracking-wider uppercase">
          {locale === "en" ? "Net Balance" : "Saldo Bersih"}
        </Text>
        <Pressable
          // TODO(next-pass): navigate to the settlements screen once ported.
          onPress={() => comingSoon(locale)}
          className="flex-row items-center gap-1.5"
        >
          <Text className="text-[12px] font-grotesk-medium text-fg-default underline">
            {locale === "en" ? "Settlements" : "Pelunasan"}
          </Text>
          <ActionIndicator count={pendingActionCount} />
        </Pressable>
      </View>
      <View className="flex-col">
        {[...group.balances]
          .sort((a, b) => {
            if (a.userId === userId) return -1;
            if (b.userId === userId) return 1;
            return 0;
          })
          .map((balance, index) => {
            const member = group.members.find((m) => m.id === balance.userId);
            const isCurrentUser = member?.id === userId;
            const memberName = formatMemberName(member, locale, isCurrentUser);

            const numAmount = Number(balance.amount);
            const isZero = Math.abs(numAmount) < 0.01;
            const isPositive = numAmount > 0;

            const showSettleLink =
              member?.isManaged && userId === ownerId && numAmount < -0.01;

            return (
              <View
                key={balance.userId}
                className={cn(
                  "flex-row justify-between py-4 items-center",
                  index > 0 && "border-t border-border-subtle",
                )}
              >
                <Text variant="body-strong" className="text-fg-default">
                  {memberName}
                </Text>
                <View className="flex-col items-end gap-1">
                  <Text
                    variant="mono-data"
                    className={
                      isZero
                        ? "text-fg-muted"
                        : isPositive
                          ? "text-positive-fg"
                          : "text-negative-fg"
                    }
                  >
                    {formatCurrency(balance.amount, group.currency, true)}
                  </Text>
                  {showSettleLink && (
                    <Pressable
                      // TODO(next-pass): navigate to settle-for-them once ported.
                      onPress={() => comingSoon(locale)}
                    >
                      <Text className="text-[12px] font-grotesk-medium text-fg-default underline">
                        {locale === "en"
                          ? "Settle for them"
                          : "Lunasi untuk mereka"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
      </View>
    </View>
  );
}
