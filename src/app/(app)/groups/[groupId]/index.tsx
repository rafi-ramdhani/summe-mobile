import { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import PagerView from "react-native-pager-view";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import Button from "@/components/Button";
import Input from "@/components/Input";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ReceiptNotFound } from "@/components/NotFound";
import { ExpensesTab } from "@/components/group-detail/ExpensesTab";
import { BalancesTab } from "@/components/group-detail/BalancesTab";
import { MembersTab } from "@/components/group-detail/MembersTab";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { comingSoon } from "@/lib/comingSoon";
import { formatRelativeTime, formatMemberName } from "@/lib/format";
import { isActionable, managedMemberHasActivity } from "@/lib/groups";
import { generateUUID, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import {
  useGroupDetail,
  useRevokeInvitation,
  useRemoveMember,
  useLeaveGroup,
  useCreateManagedMember,
  useRemoveManagedMember,
  useUpdateManagedMember,
  useCreateReplacement,
  useRespondReplacement,
  useCancelReplacement,
  type GroupMember,
} from "@/lib/queries";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;
const bgBase = { light: "#fafaf9", dark: "#0c0c0d" } as const;

type TabId = "expenses" | "balances" | "members";
const TAB_IDS: TabId[] = ["expenses", "balances", "members"];

function GroupDetailSkeleton() {
  return (
    <View className="flex-1 px-4">
      <View className="pt-4">
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-6 h-6 rounded-md bg-bg-subtle-emphasized" />
          <View className="w-40 h-8 rounded-sm bg-bg-subtle-emphasized" />
        </View>
        <View className="flex-col gap-0.5 mb-4 mt-1">
          <View className="w-32 h-4 rounded-sm bg-bg-subtle-emphasized" />
          <View className="w-48 h-3 rounded-sm bg-bg-subtle-emphasized" />
        </View>
        <View className="flex-row w-full">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="flex-1 pb-3 pt-2 items-center border-b-2 border-border-subtle"
            >
              <View className="w-20 h-5 rounded-sm bg-bg-subtle-emphasized" />
            </View>
          ))}
        </View>
      </View>
      <View className="flex-1 pt-4">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={cn(
              "flex-row justify-between py-4 items-center",
              i > 0 && "border-t border-border-subtle",
            )}
          >
            <View className="flex-col gap-2">
              <View className="w-32 h-5 rounded-sm bg-bg-subtle-emphasized" />
              <View className="w-24 h-4 rounded-sm bg-bg-subtle-emphasized" />
              <View className="w-40 h-3 rounded-sm bg-bg-subtle-emphasized" />
            </View>
            <View className="w-16 h-5 rounded-sm bg-bg-subtle-emphasized" />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const locale = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  const { data: response, isLoading, isFetching } = useGroupDetail(groupId);
  const user = useAuthStore((s) => s.session?.user);

  const pagerRef = useRef<PagerView>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const activeTab: TabId = TAB_IDS[tabIndex];

  const setActiveTab = (id: string) => {
    const idx = TAB_IDS.indexOf(id as TabId);
    if (idx < 0) return;
    setTabIndex(idx);
    pagerRef.current?.setPage(idx);
  };

  const [revokingInvitation, setRevokingInvitation] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const revokeInvitationMutation = useRevokeInvitation(groupId);

  const [removingMember, setRemovingMember] = useState<{
    id: string;
    name: string | null;
    email: string | null;
  } | null>(null);
  const removeMemberMutation = useRemoveMember(groupId);

  const [leaving, setLeaving] = useState(false);
  const leaveGroupMutation = useLeaveGroup(groupId);

  // Managed member state
  const [addingManaged, setAddingManaged] = useState(false);
  const [managedName, setManagedName] = useState("");
  const [removingManaged, setRemovingManaged] = useState<GroupMember | null>(
    null,
  );
  const [removeManagedError, setRemoveManagedError] = useState<string | null>(
    null,
  );
  const [editingManaged, setEditingManaged] = useState<GroupMember | null>(
    null,
  );
  const [editManagedName, setEditManagedName] = useState("");
  // Replace modal state
  const [replacingManaged, setReplacingManaged] = useState<GroupMember | null>(
    null,
  );
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  // Cancel replacement modal state
  const [cancelingReplacement, setCancelingReplacement] = useState<{
    id: string;
  } | null>(null);
  // Respond replacement modal state (banner confirm)
  const [respondingReplacement, setRespondingReplacement] = useState<{
    id: string;
    action: "confirm" | "decline";
  } | null>(null);

  const createManagedMember = useCreateManagedMember(groupId);
  const removeManagedMemberMutation = useRemoveManagedMember(groupId);
  const updateManagedMember = useUpdateManagedMember(groupId);
  const createReplacementMutation = useCreateReplacement(groupId);
  const respondReplacementMutation = useRespondReplacement(groupId);
  const cancelReplacementMutation = useCancelReplacement(groupId);

  const pendingActionCount =
    response?.data?.settlements?.filter((s) =>
      isActionable(
        s,
        user?.id,
        response.data.members,
        response.data.members.find((m) => m.role === "owner")?.id,
      ),
    ).length || 0;

  const tabs = [
    { id: "expenses", label: locale === "en" ? "Expenses" : "Pengeluaran" },
    {
      id: "balances",
      label: locale === "en" ? "Balances" : "Saldo",
      indicator: pendingActionCount,
    },
    { id: "members", label: locale === "en" ? "Members" : "Anggota" },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader title="" onBack={() => router.back()} />
        <GroupDetailSkeleton />
      </View>
    );
  }

  if (!response?.data) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader title="" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-5 py-12">
          <ReceiptNotFound
            receiptLabel="GROUP #404"
            rows={[
              { label: "GROUP", value: "404" },
              { label: "STATUS", value: "MISSING" },
            ]}
            footerNote="GROUP NOT FOUND"
            title={locale === "en" ? "Group not found" : "Grup tidak ditemukan"}
            message={
              locale === "en"
                ? "This group doesn't exist, or you no longer have access to it."
                : "Grup ini tidak ada, atau Anda tidak lagi memiliki akses."
            }
            actionLabel={locale === "en" ? "Go to groups" : "Ke daftar grup"}
            onAction={() => router.replace("/(app)")}
          />
        </View>
      </View>
    );
  }

  const group = response.data;
  const owner = group.members.find((m) => m.role === "owner");
  const ownerName = formatMemberName(owner, locale, owner?.id === user?.id);
  const isArchived = group.status === "archived";

  const myBalance = group.balances.find((b) => b.userId === user?.id);
  const hasMyNonZeroBalance = myBalance
    ? Math.abs(Number(myBalance.amount)) > 0.01
    : false;

  // Target banner: replacement where current user is the target
  const myReplacement = group.replacements?.find(
    (r) => r.targetUserId === user?.id,
  );
  const myReplacementRequester = myReplacement
    ? group.members.find((m) => m.id === myReplacement.requestedBy)
    : undefined;
  const myReplacementRequesterName = myReplacementRequester
    ? formatMemberName(
        myReplacementRequester,
        locale,
        myReplacementRequester.id === user?.id,
      )
    : (myReplacement?.requestedBy ?? "");

  const memberToRemoveBalance = removingMember
    ? group.balances.find((b) => b.userId === removingMember.id)
    : null;
  const hasNonZeroBalance = memberToRemoveBalance
    ? Math.abs(Number(memberToRemoveBalance.amount)) > 0.01
    : false;

  const buildRemovalBlockedMessage = (name: string | null) => {
    const who = name || (locale === "en" ? "This member" : "Anggota ini");
    return locale === "en"
      ? `${who} has expenses or settlements and can't be removed directly. Replace them with a registered user instead.`
      : `${who} memiliki pengeluaran atau pelunasan dan tidak dapat dihapus langsung. Ganti dengan pengguna terdaftar.`;
  };

  const currentUserBalance = group.balances.find((b) => b.userId === user?.id);
  const hasNothingToSettle =
    !currentUserBalance || Number(currentUserBalance.amount) > -0.01;

  const replacementBanner = myReplacement ? (
    <View className="mb-4 rounded-md border border-border-default bg-bg-subtle px-4 py-3 flex-col gap-2">
      <Text variant="body" className="text-fg-default">
        {locale === "en"
          ? `${myReplacementRequesterName} is asking you to take over ${myReplacement.managedMemberName ?? "a managed member"}'s history in this group.`
          : `${myReplacementRequesterName} meminta Anda mengambil alih riwayat ${myReplacement.managedMemberName ?? "anggota dikelola"} di grup ini.`}
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() =>
            setRespondingReplacement({
              id: myReplacement.id,
              action: "confirm",
            })
          }
        >
          <Text className="text-fg-default underline text-sm font-grotesk-medium">
            {locale === "en" ? "Confirm" : "Konfirmasi"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            respondReplacementMutation.mutate({
              replacementId: myReplacement.id,
              action: "decline",
              idempotencyKey: generateUUID(),
            })
          }
          disabled={respondReplacementMutation.isPending}
        >
          <Text className="text-fg-muted underline text-sm font-grotesk-medium">
            {locale === "en" ? "Decline" : "Tolak"}
          </Text>
        </Pressable>
      </View>
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={group.name}
        onBack={() => router.back()}
        isFetching={isFetching}
        right={
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={locale === "en" ? "Activities" : "Aktivitas"}
              // TODO(next-pass): navigate to the activities screen once ported.
              onPress={() => comingSoon(locale)}
              className="p-2 -mr-2"
            >
              <Feather name="activity" size={20} color={fgMuted[scheme]} />
            </Pressable>
            {owner?.id === user?.id && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  locale === "en" ? "Settings" : "Pengaturan"
                }
                onPress={() =>
                  router.push({
                    pathname: "/(app)/groups/[groupId]/settings",
                    params: { groupId },
                  })
                }
                className="p-2 -mr-2"
              >
                <Feather name="settings" size={20} color={fgMuted[scheme]} />
              </Pressable>
            )}
          </View>
        }
      />

      {isArchived && (
        <View className="bg-bg-subtle px-4 py-3 border-b border-border-subtle">
          <Text variant="caption" className="text-fg-muted leading-tight">
            {locale === "en"
              ? "This group is archived and read-only. Members cannot add new expenses, modify existing ones, or settle up."
              : "Grup ini diarsipkan dan hanya-baca. Anggota tidak dapat menambah pengeluaran baru, mengubah pengeluaran yang ada, atau melunasi."}
          </Text>
        </View>
      )}

      <View className="px-4">
        <View className="flex-col gap-0.5 mb-4 mt-4">
          <Text variant="caption" className="text-fg-muted" numberOfLines={1}>
            {locale === "en" ? "Owner:" : "Pemilik:"} {ownerName}
          </Text>
          <Text variant="caption" className="text-fg-muted text-[11px]">
            {group.members.filter((m) => m.status !== "removed").length}{" "}
            {locale === "en" ? "members" : "anggota"} &middot;{" "}
            {group.currency.code} &middot;{" "}
            {locale === "en" ? "created" : "dibuat"}{" "}
            {formatRelativeTime(group.createdAt, locale)}
          </Text>
        </View>
        <DashboardTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setTabIndex(e.nativeEvent.position)}
      >
        <View key="expenses" style={{ flex: 1 }}>
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
          >
            {replacementBanner}
            <ExpensesTab locale={locale} group={group} userId={user?.id} />
          </ScrollView>
        </View>
        <View key="balances" style={{ flex: 1 }}>
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
          >
            {replacementBanner}
            <BalancesTab locale={locale} group={group} userId={user?.id} />
          </ScrollView>
        </View>
        <View key="members" style={{ flex: 1 }}>
          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
          >
            {replacementBanner}
            <MembersTab
              locale={locale}
              group={group}
              userId={user?.id}
              ownerId={owner?.id}
              onRevokeInvitation={setRevokingInvitation}
              onRemoveMember={setRemovingMember}
              onReplaceManaged={(m) => setReplacingManaged(m)}
              onEditManaged={(m) => {
                setEditManagedName(m.name ?? "");
                setEditingManaged(m);
              }}
              onRemoveManaged={(m) => {
                setRemoveManagedError(
                  managedMemberHasActivity(m.id, group)
                    ? buildRemovalBlockedMessage(m.name)
                    : null,
                );
                setRemovingManaged(m);
              }}
              onCancelReplacement={(r) => setCancelingReplacement(r)}
              isFetching={isFetching}
            />
          </ScrollView>
        </View>
      </PagerView>

      {!isArchived && (
        <View
          className="absolute bottom-0 left-0 right-0"
          pointerEvents="box-none"
        >
          <LinearGradient
            colors={[
              `${bgBase[scheme]}00`,
              `${bgBase[scheme]}e6`,
              bgBase[scheme],
            ]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            pointerEvents="none"
          />
          <View
            className="px-4 pt-8"
            style={{ paddingBottom: 16 + insets.bottom }}
          >
            {activeTab === "expenses" && (
              <Button
                variant="primary"
                disabled={isFetching}
                // TODO(next-pass): navigate to the create-expense screen once ported.
                onPress={() => comingSoon(locale)}
              >
                {locale === "en" ? "Add expense" : "Tambah pengeluaran"}
              </Button>
            )}
            {activeTab === "balances" && (
              <View className="flex-col gap-2 w-full">
                {hasNothingToSettle && (
                  <Text
                    variant="caption"
                    className="text-fg-muted text-center"
                  >
                    {locale === "en"
                      ? "You don't have anything to settle."
                      : "Anda tidak memiliki tagihan yang perlu dilunasi."}
                  </Text>
                )}
                <Button
                  variant="primary"
                  disabled={hasNothingToSettle}
                  // TODO(next-pass): navigate to the settle-up screen once ported.
                  onPress={() => comingSoon(locale)}
                >
                  {locale === "en" ? "Settle up" : "Lunasi"}
                </Button>
              </View>
            )}
            {activeTab === "members" && owner?.id === user?.id && (
              <>
                <Button
                  variant="primary"
                  disabled={isFetching}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/groups/[groupId]/invite",
                      params: { groupId },
                    })
                  }
                >
                  {locale === "en" ? "Invite by email" : "Undang via email"}
                </Button>
                <Pressable
                  onPress={() => {
                    setManagedName("");
                    setAddingManaged(true);
                  }}
                  className="w-full mt-2 items-center"
                >
                  <Text className="text-fg-default underline text-sm font-grotesk-medium">
                    {locale === "en"
                      ? "Add managed member"
                      : "Tambah anggota dikelola"}
                  </Text>
                </Pressable>
              </>
            )}
            {activeTab === "members" && owner?.id !== user?.id && (
              <Button
                variant="secondary"
                textClassName="text-negative-fg"
                onPress={() => setLeaving(true)}
              >
                {locale === "en" ? "Leave group" : "Keluar dari grup"}
              </Button>
            )}
          </View>
        </View>
      )}

      <ConfirmModal
        isOpen={!!revokingInvitation}
        title={locale === "en" ? "Revoke invitation?" : "Cabut undangan?"}
        description={
          revokingInvitation
            ? locale === "en"
              ? `Are you sure you want to revoke the invitation for ${revokingInvitation.email}? They will no longer be able to join the group.`
              : `Apakah Anda yakin ingin mencabut undangan untuk ${revokingInvitation.email}? Mereka tidak akan bisa bergabung dengan grup ini.`
            : undefined
        }
        confirmText={locale === "en" ? "Revoke" : "Cabut"}
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        onConfirm={async () => {
          if (!revokingInvitation) return;
          try {
            await revokeInvitationMutation.mutateAsync({
              invitationId: revokingInvitation.id,
              idempotencyKey: generateUUID(),
            });
            setRevokingInvitation(null);
          } catch (e) {
            console.error(e);
          }
        }}
        onCancel={() => setRevokingInvitation(null)}
        loading={revokeInvitationMutation.isPending}
        confirmVariant="negative"
      />

      <ConfirmModal
        isOpen={!!removingMember}
        title={locale === "en" ? "Remove member?" : "Hapus anggota?"}
        description={
          removingMember ? (
            hasNonZeroBalance ? (
              <View className="flex-col">
                <Text variant="body" className="text-fg-muted">
                  {locale === "en"
                    ? `${removingMember.name || removingMember.email} cannot be removed because they still have a balance.`
                    : `${removingMember.name || removingMember.email} tidak dapat dihapus karena mereka masih memiliki saldo.`}
                </Text>
                <Text className="text-negative-fg font-grotesk-medium mt-2 text-xs">
                  {locale === "en"
                    ? "Members can only be removed if their balance is exactly zero."
                    : "Anggota hanya dapat dihapus jika saldonya tepat nol."}
                </Text>
              </View>
            ) : (
              locale === "en"
                ? `Are you sure you want to remove ${removingMember.name || removingMember.email} from the group?`
                : `Apakah Anda yakin ingin menghapus ${removingMember.name || removingMember.email} dari grup?`
            )
          ) : undefined
        }
        confirmText={
          hasNonZeroBalance
            ? locale === "en"
              ? "Okay"
              : "Oke"
            : locale === "en"
              ? "Remove"
              : "Hapus"
        }
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        hideCancel={hasNonZeroBalance}
        onConfirm={async () => {
          if (hasNonZeroBalance) {
            setRemovingMember(null);
            return;
          }
          if (!removingMember) return;
          try {
            await removeMemberMutation.mutateAsync({
              memberId: removingMember.id,
              idempotencyKey: generateUUID(),
            });
            setRemovingMember(null);
          } catch (e) {
            console.error(e);
          }
        }}
        onCancel={() => setRemovingMember(null)}
        loading={removeMemberMutation.isPending}
        confirmVariant={hasNonZeroBalance ? "primary" : "negative"}
      />

      <ConfirmModal
        isOpen={leaving}
        title={
          hasMyNonZeroBalance
            ? locale === "en"
              ? "Can't leave yet"
              : "Belum bisa keluar"
            : locale === "en"
              ? "Leave this group?"
              : "Keluar dari grup ini?"
        }
        description={
          hasMyNonZeroBalance
            ? locale === "en"
              ? "You can't leave a group while you have a balance. Settle up to zero first."
              : "Anda tidak dapat keluar dari grup saat masih memiliki saldo. Lunasi hingga nol terlebih dahulu."
            : locale === "en"
              ? "You'll lose access to this group's expenses and balances. You can be invited back later."
              : "Anda akan kehilangan akses ke pengeluaran dan saldo grup ini. Anda dapat diundang kembali nanti."
        }
        confirmText={
          hasMyNonZeroBalance
            ? locale === "en"
              ? "Okay"
              : "Oke"
            : locale === "en"
              ? "Leave"
              : "Keluar"
        }
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        hideCancel={hasMyNonZeroBalance}
        confirmVariant={hasMyNonZeroBalance ? "primary" : "negative"}
        loading={leaveGroupMutation.isPending}
        onCancel={() => setLeaving(false)}
        onConfirm={async () => {
          if (hasMyNonZeroBalance) {
            setLeaving(false);
            return;
          }
          try {
            await leaveGroupMutation.mutateAsync({
              idempotencyKey: generateUUID(),
            });
            setLeaving(false);
            router.replace("/(app)");
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* Add managed member modal */}
      <ConfirmModal
        isOpen={addingManaged}
        title={
          locale === "en" ? "Add managed member" : "Tambah anggota dikelola"
        }
        description={
          locale === "en"
            ? "A managed member is a placeholder for someone without an account. You track their expenses and splits on their behalf."
            : "Anggota dikelola adalah pengganti untuk seseorang yang belum punya akun. Anda mencatat pengeluaran dan pembagiannya atas nama mereka."
        }
        confirmText={locale === "en" ? "Add" : "Tambah"}
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        confirmDisabled={managedName.trim().length === 0}
        loading={createManagedMember.isPending}
        onCancel={() => setAddingManaged(false)}
        onConfirm={async () => {
          try {
            await createManagedMember.mutateAsync({
              name: managedName.trim(),
              idempotencyKey: generateUUID(),
            });
            setAddingManaged(false);
          } catch (e) {
            console.error(e);
          }
        }}
      >
        <Input
          placeholder={locale === "en" ? "Name" : "Nama"}
          value={managedName}
          onChangeText={setManagedName}
          maxLength={80}
        />
      </ConfirmModal>

      {/* Edit managed member name modal */}
      <ConfirmModal
        isOpen={!!editingManaged}
        title={locale === "en" ? "Edit name" : "Ubah nama"}
        description={
          locale === "en"
            ? "Update this managed member's display name."
            : "Perbarui nama tampilan anggota dikelola ini."
        }
        confirmText={locale === "en" ? "Save" : "Simpan"}
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        confirmDisabled={
          editManagedName.trim().length === 0 ||
          editManagedName.trim() === (editingManaged?.name ?? "")
        }
        loading={updateManagedMember.isPending}
        onCancel={() => setEditingManaged(null)}
        onConfirm={async () => {
          if (!editingManaged) return;
          try {
            await updateManagedMember.mutateAsync({
              memberId: editingManaged.id,
              name: editManagedName.trim(),
              idempotencyKey: generateUUID(),
            });
            setEditingManaged(null);
          } catch (e) {
            console.error(e);
          }
        }}
      >
        <Input
          placeholder={locale === "en" ? "Name" : "Nama"}
          value={editManagedName}
          onChangeText={setEditManagedName}
          maxLength={80}
        />
      </ConfirmModal>

      {/* Remove managed member modal */}
      <ConfirmModal
        isOpen={!!removingManaged}
        title={
          removeManagedError
            ? locale === "en"
              ? "Cannot remove member"
              : "Tidak dapat menghapus anggota"
            : locale === "en"
              ? "Remove managed member?"
              : "Hapus anggota dikelola?"
        }
        description={
          removeManagedError
            ? removeManagedError
            : removingManaged
              ? locale === "en"
                ? `Are you sure you want to remove ${removingManaged.name || "this member"} from the group?`
                : `Apakah Anda yakin ingin menghapus ${removingManaged.name || "anggota ini"} dari grup?`
              : undefined
        }
        confirmText={
          removeManagedError
            ? locale === "en"
              ? "Okay"
              : "Oke"
            : locale === "en"
              ? "Remove"
              : "Hapus"
        }
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        hideCancel={!!removeManagedError}
        loading={removeManagedMemberMutation.isPending}
        confirmVariant={removeManagedError ? "primary" : "negative"}
        onConfirm={async () => {
          if (removeManagedError) {
            // The owner can use the Replace button to proceed instead.
            setRemovingManaged(null);
            setRemoveManagedError(null);
            return;
          }
          if (!removingManaged) return;
          try {
            await removeManagedMemberMutation.mutateAsync({
              memberId: removingManaged.id,
              idempotencyKey: generateUUID(),
            });
            setRemovingManaged(null);
          } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
              setRemoveManagedError(
                buildRemovalBlockedMessage(removingManaged.name),
              );
            } else {
              console.error(e);
            }
          }
        }}
        onCancel={() => {
          setRemovingManaged(null);
          setRemoveManagedError(null);
        }}
      />

      {/* Replace managed member modal */}
      <ConfirmModal
        isOpen={!!replacingManaged}
        title={locale === "en" ? "Replace with member" : "Ganti dengan anggota"}
        description={
          locale === "en"
            ? "The selected member will need to confirm. Once confirmed, all expense history will transfer to them."
            : "Anggota yang dipilih harus mengkonfirmasi. Setelah dikonfirmasi, semua riwayat pengeluaran akan berpindah ke mereka."
        }
        confirmText={locale === "en" ? "Replace" : "Ganti"}
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        confirmDisabled={!selectedTarget}
        loading={createReplacementMutation.isPending}
        onCancel={() => {
          setReplacingManaged(null);
          setSelectedTarget(null);
        }}
        onConfirm={async () => {
          if (!replacingManaged || !selectedTarget) return;
          try {
            await createReplacementMutation.mutateAsync({
              memberId: replacingManaged.id,
              targetUserId: selectedTarget,
              idempotencyKey: generateUUID(),
            });
            setReplacingManaged(null);
            setSelectedTarget(null);
          } catch (e) {
            console.error(e);
          }
        }}
      >
        <ScrollView style={{ maxHeight: 256 }}>
          {replacingManaged &&
            group.members
              .filter(
                (m) =>
                  !m.isManaged &&
                  m.status !== "removed" &&
                  m.id !== replacingManaged.id,
              )
              .map((m) => {
                const selected = selectedTarget === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setSelectedTarget(m.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    className="flex-row items-center gap-2 py-2"
                  >
                    <View
                      className={cn(
                        "w-4 h-4 rounded-full border items-center justify-center",
                        selected
                          ? "border-fg-default"
                          : "border-border-strong",
                      )}
                    >
                      {selected && (
                        <View className="w-2 h-2 rounded-full bg-fg-default" />
                      )}
                    </View>
                    <Text variant="body" className="text-fg-default">
                      {formatMemberName(m, locale, m.id === user?.id)}
                    </Text>
                  </Pressable>
                );
              })}
        </ScrollView>
      </ConfirmModal>

      {/* Cancel replacement modal */}
      <ConfirmModal
        isOpen={!!cancelingReplacement}
        title={
          locale === "en" ? "Cancel replacement?" : "Batalkan penggantian?"
        }
        description={
          locale === "en"
            ? "The pending replacement request will be cancelled."
            : "Permintaan penggantian yang tertunda akan dibatalkan."
        }
        confirmText={locale === "en" ? "Cancel" : "Batalkan"}
        cancelText={locale === "en" ? "Keep" : "Pertahankan"}
        confirmVariant="negative"
        loading={cancelReplacementMutation.isPending}
        onCancel={() => setCancelingReplacement(null)}
        onConfirm={async () => {
          if (!cancelingReplacement) return;
          try {
            await cancelReplacementMutation.mutateAsync({
              replacementId: cancelingReplacement.id,
              idempotencyKey: generateUUID(),
            });
            setCancelingReplacement(null);
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* Respond to replacement modal (irreversible warning for confirm action) */}
      <ConfirmModal
        isOpen={!!respondingReplacement}
        title={
          locale === "en" ? "Confirm takeover?" : "Konfirmasi pengambilalihan?"
        }
        description={
          locale === "en"
            ? "This action is irreversible and cannot be undone. You will permanently take over the managed member's expense history in this group."
            : "Tindakan ini tidak dapat dibalik dan tidak dapat dibatalkan. Anda akan mengambil alih riwayat pengeluaran anggota dikelola di grup ini secara permanen."
        }
        confirmText={locale === "en" ? "Confirm" : "Konfirmasi"}
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        confirmVariant="negative"
        loading={respondReplacementMutation.isPending}
        onCancel={() => setRespondingReplacement(null)}
        onConfirm={async () => {
          if (!respondingReplacement) return;
          try {
            await respondReplacementMutation.mutateAsync({
              replacementId: respondingReplacement.id,
              action: respondingReplacement.action,
              idempotencyKey: generateUUID(),
            });
            setRespondingReplacement(null);
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </View>
  );
}
