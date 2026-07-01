import { useRef, useState } from "react";
import { FlatList, View } from "react-native";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "@/components/Text";
import { useLocale } from "@/lib/i18n";
import { useDebounce } from "@/lib/useDebounce";
import {
  useGroups,
  useInvitations,
  useOnboarding,
  type Group,
} from "@/lib/queries";
import { isChecklistVisible } from "@/lib/onboarding";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardInvitations } from "@/components/dashboard/DashboardInvitations";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import { GroupListItem } from "@/components/dashboard/GroupListItem";
import { ArchivedGroupListItem } from "@/components/dashboard/ArchivedGroupListItem";
import { GroupListSkeleton } from "@/components/GroupListSkeleton";
import type { SortBy } from "@/components/dashboard/SortSheet";

type Status = "active" | "archived";

function GroupsPane({
  status,
  sortBy,
  onSortChange,
}: {
  status: Status;
  sortBy: SortBy;
  onSortChange: (v: SortBy) => void;
}) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const query = useGroups(debounced || undefined, status, sortBy);

  const groups = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.meta.pagination.total ?? 0;
  const totalFiltered =
    query.data?.pages[0]?.meta.pagination.totalFiltered ?? total;

  const showSearch = total > 5 || debounced.length > 0;
  const showSortIcon = totalFiltered > 5;

  const emptyMessage =
    status === "active"
      ? locale === "en"
        ? "No groups found."
        : "Grup tidak ditemukan."
      : locale === "en"
        ? "No archived groups."
        : "Tidak ada grup yang diarsipkan.";

  if (query.isLoading && groups.length === 0) {
    return (
      <View className="flex-1">
        {showSearch && (
          <DashboardSearch
            value={search}
            onChangeText={setSearch}
            showSortIcon={showSortIcon}
            sortBy={sortBy}
            onSortChange={onSortChange}
            placeholder={locale === "en" ? "Search groups..." : "Cari grup..."}
          />
        )}
        <GroupListSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {showSearch && (
        <DashboardSearch
          value={search}
          onChangeText={setSearch}
          showSortIcon={showSortIcon}
          sortBy={sortBy}
          onSortChange={onSortChange}
          placeholder={locale === "en" ? "Search groups..." : "Cari grup..."}
        />
      )}
      <FlatList
        data={groups}
        keyExtractor={(g: Group) => g.id}
        renderItem={({ item, index }) =>
          status === "active" ? (
            <GroupListItem group={item} isFirst={index === 0} />
          ) : (
            <ArchivedGroupListItem group={item} isFirst={index === 0} />
          )
        }
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        ListEmptyComponent={
          query.isLoading ? null : (
            <View className="py-8 items-center">
              <Text className="text-fg-muted">{emptyMessage}</Text>
            </View>
          )
        }
        ListFooterComponent={
          query.hasNextPage ? (
            <View className="py-4 items-center">
              <Text variant="caption" className="text-fg-muted">
                {locale === "en" ? "Loading more..." : "Memuat lebih banyak..."}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export default function AppHome() {
  const locale = useLocale();
  const pagerRef = useRef<PagerView>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [sortActive, setSortActive] = useState<SortBy>("recent-activity");
  const [sortArchived, setSortArchived] = useState<SortBy>("recent-activity");

  const activeTab: Status = tabIndex === 0 ? "active" : "archived";

  const activeQuery = useGroups(undefined, "active", sortActive);
  const archivedQuery = useGroups(undefined, "archived", sortArchived);
  const { data: invitationsRes, isLoading: isLoadingInvitations } =
    useInvitations();
  const { data: onboardingRes } = useOnboarding();

  const invitations = invitationsRes?.data ?? [];
  const hasInvitations = invitations.length > 0;
  const onboarding = onboardingRes?.data;

  const totalActive = activeQuery.data?.pages[0]?.meta.pagination.total ?? 0;
  const totalArchived =
    archivedQuery.data?.pages[0]?.meta.pagination.total ?? 0;
  const isLoadingGroups = activeQuery.isLoading || archivedQuery.isLoading;

  const showEmptyState =
    !isLoadingGroups &&
    totalActive === 0 &&
    totalArchived === 0 &&
    !hasInvitations;

  const goToTab = (id: string) => {
    const idx = id === "active" ? 0 : 1;
    setTabIndex(idx);
    pagerRef.current?.setPage(idx);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={["top"]}>
      <View className="flex-1 px-4 pt-8">
        {hasInvitations && <DashboardInvitations invitations={invitations} />}

        {onboarding && isChecklistVisible(onboarding) && (
          <GettingStartedChecklist
            onboarding={onboarding}
            onReplayTour={() => {}}
          />
        )}

        {showEmptyState ? (
          <DashboardEmptyState
            hasInvitations={hasInvitations}
            isLoadingInvitations={isLoadingInvitations}
          />
        ) : (
          <View className="flex-1">
            <DashboardHeader />
            <DashboardTabs
              tabs={[
                { id: "active", label: locale === "en" ? "Active" : "Aktif" },
                {
                  id: "archived",
                  label: locale === "en" ? "Archived" : "Diarsipkan",
                },
              ]}
              activeId={activeTab}
              onChange={goToTab}
              className="mb-4"
            />
            <PagerView
              ref={pagerRef}
              style={{ flex: 1 }}
              initialPage={0}
              onPageSelected={(e) => setTabIndex(e.nativeEvent.position)}
            >
              <View key="active" style={{ flex: 1 }}>
                <GroupsPane
                  status="active"
                  sortBy={sortActive}
                  onSortChange={setSortActive}
                />
              </View>
              <View key="archived" style={{ flex: 1 }}>
                <GroupsPane
                  status="archived"
                  sortBy={sortArchived}
                  onSortChange={setSortArchived}
                />
              </View>
            </PagerView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
