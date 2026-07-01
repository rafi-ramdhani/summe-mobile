import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import Text from "@/components/Text";
import { cn } from "@/lib/cn";
import {
  formatCurrency,
  formatRelativeTime,
  formatMemberName,
} from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import type { GroupDetail } from "@/lib/queries";

export function ExpensesTab({
  locale,
  group,
  userId,
}: {
  locale: Locale;
  group: GroupDetail;
  userId?: string;
}) {
  const router = useRouter();
  return (
    <View className="flex-col">
      {group.expenses.length === 0 ? (
        <View className="flex-col items-center justify-center h-48">
          <Text variant="title-2" className="text-fg-default mb-2 text-center">
            {locale === "en" ? "No expenses yet" : "Belum ada pengeluaran"}
          </Text>
          <Text variant="body" className="text-fg-muted text-center">
            {locale === "en"
              ? "Add one to start splitting."
              : "Tambahkan satu untuk mulai berbagi."}
          </Text>
        </View>
      ) : (
        <View className="flex-col">
          {group.expenses.map((expense, index) => {
            const paidByMember = group.members.find(
              (m) => m.id === expense.paidBy,
            );
            const isCurrentUser = paidByMember?.id === userId;
            const paidByName = formatMemberName(
              paidByMember,
              locale,
              isCurrentUser,
            );

            // Calculate split ways
            const uniqueAssignees = new Set<string>();
            expense.items.forEach((item) => {
              item.assignments.forEach((assignment) => {
                uniqueAssignees.add(assignment.assigneeId);
              });
            });
            const ways = uniqueAssignees.size || 1;
            const splitText =
              locale === "en" ? `split ${ways} ways` : `dibagi ${ways} orang`;

            return (
              <Pressable
                key={expense.id}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/groups/[groupId]/expenses/[expenseId]",
                    params: { groupId: group.id, expenseId: expense.id },
                  })
                }
                className={cn(
                  "flex-row justify-between py-4 items-center active:bg-bg-subtle",
                  index > 0 && "border-t border-border-subtle",
                )}
              >
                <View className="flex-col gap-0.5 flex-1 pr-3">
                  <Text variant="body-strong" className="text-fg-default">
                    {expense.name}
                  </Text>
                  <Text
                    variant="caption"
                    className="text-fg-muted"
                    numberOfLines={1}
                  >
                    {locale === "en" ? "Paid by" : "Dibayar oleh"} {paidByName}
                  </Text>
                  <Text variant="caption" className="text-fg-muted text-[11px]">
                    {formatRelativeTime(expense.createdAt, locale)} &middot;{" "}
                    {splitText}
                  </Text>
                </View>
                <Text variant="mono-data" className="text-fg-default">
                  {formatCurrency(expense.totalAmount, group.currency)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
