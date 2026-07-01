import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import Text from "@/components/Text";
import { cn } from "@/lib/cn";
import { useLocale } from "@/lib/i18n";
import { formatRelativeTime, formatMemberName } from "@/lib/format";
import { useAuthStore } from "@/stores/authStore";
import type { Group } from "@/lib/queries";

export function ArchivedGroupListItem({
  group,
  isFirst,
}: {
  group: Group;
  isFirst: boolean;
}) {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.session?.user);

  const archivedByStr =
    group.archivedByName || group.archivedByEmail
      ? formatMemberName(
          { name: group.archivedByName, email: group.archivedByEmail },
          locale,
          user?.email === group.archivedByEmail,
        )
      : null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(app)/groups/[groupId]",
          params: { groupId: group.id },
        })
      }
      className={cn(
        "py-4 flex-col",
        !isFirst && "border-t border-border-subtle border-dashed",
      )}
    >
      <Text variant="body-strong" className="mb-1" numberOfLines={1}>
        {group.name}
      </Text>
      <Text variant="caption" className="text-fg-muted">
        {locale === "en" ? "Archived" : "Diarsipkan"}
        {group.archivedAt
          ? ` • ${formatRelativeTime(group.archivedAt, locale)}`
          : ""}
        {archivedByStr
          ? locale === "en"
            ? ` by ${archivedByStr}`
            : ` oleh ${archivedByStr}`
          : ""}
      </Text>
    </Pressable>
  );
}
