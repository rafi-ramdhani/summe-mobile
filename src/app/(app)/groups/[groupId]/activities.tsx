import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import { cn } from "@/lib/cn";
import { useLocale, type Locale } from "@/lib/i18n";
import {
  formatRelativeTime,
  formatMemberName,
  formatCurrency,
} from "@/lib/format";
import { useAuthStore } from "@/stores/authStore";
import {
  useGroupDetail,
  useInfiniteGroupActivities,
  type Activity,
  type GroupDetail,
} from "@/lib/queries";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;

type Sort = "desc" | "asc";

function SortSheet({
  visible,
  sort,
  onSelect,
  onClose,
  locale,
}: {
  visible: boolean;
  sort: Sort;
  onSelect: (v: Sort) => void;
  onClose: () => void;
  locale: Locale;
}) {
  const insets = useSafeAreaInsets();
  const options: { value: Sort; label: string }[] = [
    { value: "desc", label: locale === "en" ? "Latest" : "Terbaru" },
    { value: "asc", label: locale === "en" ? "Oldest" : "Terlama" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 bg-black/60 justify-end">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ paddingBottom: insets.bottom + 8 }}
          className="bg-bg-raised rounded-t-md border-t border-border-subtle pt-2"
        >
          {options.map((opt) => {
            const selected = opt.value === sort;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                className="px-5 py-4"
              >
                <Text
                  variant={selected ? "body-strong" : "body"}
                  className={cn(selected ? "text-fg-default" : "text-fg-muted")}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ActivityMessage({
  activity,
  group,
  locale,
  userId,
}: {
  activity: Activity;
  group: GroupDetail;
  locale: Locale;
  userId?: string;
}) {
  const actorMember = group.members.find((m) => m.id === activity.userId);
  const isCurrentUser = actorMember?.id === userId;
  const actorName = actorMember
    ? formatMemberName(actorMember, locale, isCurrentUser)
    : locale === "en"
      ? "Someone"
      : "Seseorang";

  const emphasize = (text?: string | null) => (
    <Text className="font-grotesk-bold text-fg-default text-sm">{text}</Text>
  );

  const formatAmount = (amount?: string) =>
    amount ? formatCurrency(Number(amount), group.currency) : "";

  let message: ReactNode = null;

  switch (activity.action) {
    case "expense_created":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} added the expense "
            {emphasize(activity.data.name)}".
          </>
        ) : (
          <>
            {emphasize(actorName)} menambahkan pengeluaran "
            {emphasize(activity.data.name)}".
          </>
        );
      break;
    case "expense_updated":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} updated the expense "
            {emphasize(activity.data.name)}".
          </>
        ) : (
          <>
            {emphasize(actorName)} memperbarui pengeluaran "
            {emphasize(activity.data.name)}".
          </>
        );
      break;
    case "expense_deleted":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} deleted the expense "
            {emphasize(activity.data.name)}".
          </>
        ) : (
          <>
            {emphasize(actorName)} menghapus pengeluaran "
            {emphasize(activity.data.name)}".
          </>
        );
      break;
    case "settlement_created":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} settled up for{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        ) : (
          <>
            {emphasize(actorName)} melakukan pelunasan sebesar{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        );
      break;
    case "settlement_deleted":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} deleted a settlement of{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        ) : (
          <>
            {emphasize(actorName)} menghapus pelunasan sebesar{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        );
      break;
    case "settlement_confirmed":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} confirmed a settlement of{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        ) : (
          <>
            {emphasize(actorName)} mengonfirmasi pelunasan sebesar{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        );
      break;
    case "settlement_rejected":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} declined a settlement of{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        ) : (
          <>
            {emphasize(actorName)} menolak pelunasan sebesar{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        );
      break;
    case "settlement_reverted":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} reverted a settlement of{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        ) : (
          <>
            {emphasize(actorName)} membatalkan pelunasan sebesar{" "}
            {emphasize(formatAmount(activity.data.amount))}.
          </>
        );
      break;
    case "member_joined":
      message =
        locale === "en" ? (
          <>{emphasize(actorName)} joined the group.</>
        ) : (
          <>{emphasize(actorName)} bergabung ke grup.</>
        );
      break;
    case "member_removed":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} removed{" "}
            {emphasize(activity.data.name || activity.data.email)}.
          </>
        ) : (
          <>
            {emphasize(actorName)} menghapus{" "}
            {emphasize(activity.data.name || activity.data.email)}.
          </>
        );
      break;
    case "member_left":
      message =
        locale === "en" ? (
          <>{emphasize(actorName)} left the group.</>
        ) : (
          <>{emphasize(actorName)} meninggalkan grup.</>
        );
      break;
    case "member_invited":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} invited {emphasize(activity.data.email)}.
          </>
        ) : (
          <>
            {emphasize(actorName)} mengundang {emphasize(activity.data.email)}.
          </>
        );
      break;
    case "invitation_revoked":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} revoked the invitation for{" "}
            {emphasize(activity.data.email)}.
          </>
        ) : (
          <>
            {emphasize(actorName)} membatalkan undangan untuk{" "}
            {emphasize(activity.data.email)}.
          </>
        );
      break;
    case "group_archived":
      message =
        locale === "en" ? (
          <>{emphasize(actorName)} archived the group.</>
        ) : (
          <>{emphasize(actorName)} mengarsipkan grup.</>
        );
      break;
    case "group_unarchived":
      message =
        locale === "en" ? (
          <>{emphasize(actorName)} unarchived the group.</>
        ) : (
          <>{emphasize(actorName)} memulihkan grup.</>
        );
      break;
    case "managed_member_added":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} added a managed member{" "}
            {emphasize(activity.data.name)}.
          </>
        ) : (
          <>
            {emphasize(actorName)} menambahkan anggota kelola{" "}
            {emphasize(activity.data.name)}.
          </>
        );
      break;
    case "managed_member_removed":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} removed managed member{" "}
            {emphasize(activity.data.name)}.
          </>
        ) : (
          <>
            {emphasize(actorName)} menghapus anggota kelola{" "}
            {emphasize(activity.data.name)}.
          </>
        );
      break;
    case "managed_member_replaced":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} replaced managed member{" "}
            {emphasize(activity.data.name)}.
          </>
        ) : (
          <>
            {emphasize(actorName)} menggantikan anggota kelola{" "}
            {emphasize(activity.data.name)}.
          </>
        );
      break;
    case "managed_member_renamed":
      message =
        locale === "en" ? (
          <>
            {emphasize(actorName)} renamed managed member{" "}
            {emphasize(activity.data.name)}.
          </>
        ) : (
          <>
            {emphasize(actorName)} mengubah nama anggota kelola{" "}
            {emphasize(activity.data.name)}.
          </>
        );
      break;
    default:
      message =
        locale === "en" ? "Unknown activity" : "Aktivitas tidak diketahui";
      break;
  }

  return (
    <Text variant="body" className="text-fg-muted text-sm">
      {message}
    </Text>
  );
}

export default function GroupActivitiesScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const locale = useLocale();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";
  const user = useAuthStore((s) => s.session?.user);

  const [sort, setSort] = useState<Sort>("desc");
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const {
    data: groupResponse,
    isLoading: groupLoading,
    isFetching: isFetchingGroup,
  } = useGroupDetail(groupId);
  const {
    data: activitiesResponse,
    isLoading: activitiesLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingActivities,
  } = useInfiniteGroupActivities(groupId, sort);

  const isFetching =
    isFetchingGroup || (isFetchingActivities && !isFetchingNextPage);

  const group = groupResponse?.data;
  const activities =
    activitiesResponse?.pages.flatMap((page) => page.data) || [];

  const title = locale === "en" ? "Activities" : "Aktivitas";

  const sortButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        locale === "en" ? "Sort activities" : "Urutkan aktivitas"
      }
      onPress={() => setSortSheetOpen(true)}
      className="p-2 -mr-2"
    >
      <Feather name="sliders" size={20} color={fgMuted[scheme]} />
    </Pressable>
  );

  if (groupLoading || activitiesLoading) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader
          title={title}
          onBack={() => router.back()}
          isFetching={isFetching}
          right={sortButton}
        />
        <View className="flex-1 px-4 pt-4 flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="w-full h-16 bg-bg-subtle-emphasized rounded-sm"
            />
          ))}
        </View>
      </View>
    );
  }

  if (!group || isError) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader
          title={title}
          onBack={() => router.back()}
          isFetching={isFetching}
        />
        <View className="flex-1 items-center justify-center">
          <Text className="text-negative-fg">
            {locale === "en"
              ? "Failed to load activities."
              : "Gagal memuat aktivitas."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={title}
        onBack={() => router.back()}
        isFetching={isFetching}
        right={sortButton}
      />
      {activities.length === 0 ? (
        <View className="flex-col items-center justify-center h-48 px-4">
          <Text variant="title-2" className="text-fg-default mb-2 text-center">
            {locale === "en" ? "No activities yet" : "Belum ada aktivitas"}
          </Text>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <View
              className={cn(
                "flex-col p-4 gap-1 mx-4",
                index > 0 && "border-t border-border-subtle",
              )}
            >
              <ActivityMessage
                activity={item}
                group={group}
                locale={locale}
                userId={user?.id}
              />
              <Text variant="caption" className="text-fg-muted">
                {formatRelativeTime(item.createdAt, locale)}
              </Text>
            </View>
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="p-4 items-center">
                <ActivityIndicator size="small" color={fgMuted[scheme]} />
              </View>
            ) : null
          }
        />
      )}
      <SortSheet
        visible={sortSheetOpen}
        sort={sort}
        onSelect={setSort}
        onClose={() => setSortSheetOpen(false)}
        locale={locale}
      />
    </View>
  );
}
