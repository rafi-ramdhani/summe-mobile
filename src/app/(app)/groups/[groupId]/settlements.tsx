import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useColorScheme } from "nativewind";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { ConfirmModal } from "@/components/ConfirmModal";
import { cn } from "@/lib/cn";
import { isActionable, isRemovedInvolved } from "@/lib/groups";
import { generateUUID } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import {
  formatCurrency,
  formatRelativeTime,
  formatMemberName,
} from "@/lib/format";
import { useAuthStore } from "@/stores/authStore";
import {
  useGroupDetail,
  useDeleteSettlement,
  useConfirmSettlement,
  useRejectSettlement,
  useRevertSettlement,
  type Settlement,
} from "@/lib/queries";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;

function SettlementsSkeleton() {
  return (
    <View className="flex-1 px-4 py-6 flex-col gap-8">
      <View className="flex-col gap-2">
        <View className="h-10 bg-bg-subtle rounded-sm w-48" />
        <View className="h-4 bg-bg-subtle rounded-sm w-32 mt-2" />
      </View>
      <View className="flex-col">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className={cn(
              "flex-row items-center justify-between py-5",
              i > 0 && "border-t border-border-subtle",
            )}
          >
            <View className="flex-col gap-2 w-full max-w-[200px]">
              <View className="h-5 bg-bg-subtle rounded-sm w-full" />
              <View className="h-3 bg-bg-subtle rounded-sm w-24" />
            </View>
            <View className="h-5 bg-bg-subtle rounded-sm w-16" />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SettlementsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const locale = useLocale();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  const { data: groupResponse, isLoading, isFetching } = useGroupDetail(groupId);
  const user = useAuthStore((s) => s.session?.user);

  const group = groupResponse?.data;
  const settlements = group?.settlements || [];
  const ownerId = group?.members.find((m) => m.role === "owner")?.id;

  const [filter, setFilter] = useState<"actionable" | "history">("actionable");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settlementIdToDelete, setSettlementIdToDelete] = useState<
    string | null
  >(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [settlementIdToReject, setSettlementIdToReject] = useState<
    string | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");
  const [settlementIdToAccept, setSettlementIdToAccept] = useState<
    string | null
  >(null);

  const deleteSettlement = useDeleteSettlement(groupId);
  const confirmSettlement = useConfirmSettlement(groupId);
  const rejectSettlement = useRejectSettlement(groupId);
  const revertSettlement = useRevertSettlement(groupId);

  const title = locale === "en" ? "Settlements" : "Riwayat Pelunasan";

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader
          title={title}
          onBack={() => router.back()}
          isFetching={isFetching}
        />
        <SettlementsSkeleton />
      </View>
    );
  }

  if (!group) return null;

  const actionableSettlements = settlements
    .filter((s) => isActionable(s, user?.id, group.members, ownerId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const historySettlements = settlements
    .filter((s) => !isActionable(s, user?.id, group.members, ownerId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const historyYours = historySettlements
    .filter(
      (s) =>
        !isRemovedInvolved(s, group.members) &&
        (s.payerId === user?.id || s.payeeId === user?.id),
    )
    .sort((a, b) => {
      const isCancelable = (s: Settlement) => {
        if (s.status !== "pending") return false;
        if (s.payerId !== user?.id) return false;
        if (isRemovedInvolved(s, group.members)) return false;
        return true;
      };

      const aCancelable = isCancelable(a);
      const bCancelable = isCancelable(b);

      if (aCancelable && !bCancelable) return -1;
      if (!aCancelable && bCancelable) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const historyOthers = historySettlements.filter(
    (s) =>
      !isRemovedInvolved(s, group.members) &&
      s.payerId !== user?.id &&
      s.payeeId !== user?.id,
  );

  const historyRemoved = historySettlements.filter((s) =>
    isRemovedInvolved(s, group.members),
  );

  const activeHistorySections = [
    historyYours,
    historyOthers,
    historyRemoved,
  ].filter((section) => section.length > 0).length;
  const hasMultipleSections = activeHistorySections > 1;

  const handleConfirmDelete = async () => {
    if (!settlementIdToDelete) return;

    setDeletingId(settlementIdToDelete);
    try {
      const settlement = settlements.find((s) => s.id === settlementIdToDelete);
      if (settlement?.status === "confirmed") {
        await revertSettlement.mutateAsync({
          settlementId: settlementIdToDelete,
          idempotencyKey: generateUUID(),
        });
      } else {
        await deleteSettlement.mutateAsync({
          settlementId: settlementIdToDelete,
          idempotencyKey: generateUUID(),
        });
      }
      setSettlementIdToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmAccept = async () => {
    if (!settlementIdToAccept) return;
    setConfirmingId(settlementIdToAccept);
    try {
      await confirmSettlement.mutateAsync({
        settlementId: settlementIdToAccept,
        idempotencyKey: generateUUID(),
      });
      setSettlementIdToAccept(null);
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!settlementIdToReject) return;
    setRejectingId(settlementIdToReject);
    try {
      await rejectSettlement.mutateAsync({
        settlementId: settlementIdToReject,
        reason: rejectReason.trim() || undefined,
        idempotencyKey: generateUUID(),
      });
      setSettlementIdToReject(null);
      setRejectReason("");
    } catch (e) {
      console.error(e);
    } finally {
      setRejectingId(null);
    }
  };

  const renderSettlement = (settlement: Settlement, index: number) => {
    const payer = group.members.find((m) => m.id === settlement.payerId);
    const payee = group.members.find((m) => m.id === settlement.payeeId);
    const payerName = formatMemberName(payer, locale, payer?.id === user?.id);
    const payeeName = formatMemberName(payee, locale, payee?.id === user?.id);
    const isRemoved = isRemovedInvolved(settlement, group.members);

    const payeeIsManaged = payee?.isManaged ?? false;
    const canActAsPayee =
      settlement.payeeId === user?.id ||
      (user?.id === ownerId && payeeIsManaged);

    const payerIsManaged = payer?.isManaged ?? false;
    const canCancelAsPayer =
      settlement.payerId === user?.id ||
      (user?.id === ownerId && payerIsManaged);

    return (
      <View
        key={settlement.id}
        className={cn(
          "py-5 flex-col gap-2",
          index > 0 && "border-t border-border-subtle",
        )}
      >
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-col gap-1 min-w-0 flex-1">
            <Text
              variant="body-strong"
              className="text-fg-default"
              numberOfLines={1}
            >
              {payerName} {"→"} {payeeName}
            </Text>
            <Text variant="caption" className="text-fg-muted" numberOfLines={1}>
              {formatRelativeTime(settlement.createdAt, locale)}
            </Text>
          </View>
          <View className="flex-col items-end gap-2 shrink-0">
            <Text variant="mono-data-strong" className="text-fg-default">
              {formatCurrency(Number(settlement.amount), group.currency)}
            </Text>
            {settlement.status === "pending" && !isRemoved && (
              <View className="flex-row items-center gap-3">
                {canCancelAsPayer && (
                  <Pressable
                    onPress={() => setSettlementIdToDelete(settlement.id)}
                    disabled={deletingId === settlement.id || isFetching}
                    className={cn(
                      (deletingId === settlement.id || isFetching) &&
                        "opacity-50",
                    )}
                  >
                    <Text className="text-negative-fg text-sm font-grotesk-medium opacity-80">
                      {locale === "en" ? "Cancel" : "Batal"}
                    </Text>
                  </Pressable>
                )}
                {canActAsPayee && (
                  <>
                    <Pressable
                      onPress={() => {
                        setSettlementIdToReject(settlement.id);
                        setRejectReason("");
                      }}
                      disabled={confirmingId === settlement.id || isFetching}
                      className={cn(
                        (confirmingId === settlement.id || isFetching) &&
                          "opacity-50",
                      )}
                    >
                      <Text className="text-negative-fg text-sm font-grotesk-medium opacity-80">
                        {locale === "en" ? "Decline" : "Tolak"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSettlementIdToAccept(settlement.id)}
                      disabled={confirmingId === settlement.id || isFetching}
                      className={cn(
                        (confirmingId === settlement.id || isFetching) &&
                          "opacity-50",
                      )}
                    >
                      <Text className="text-positive-fg text-sm font-grotesk-medium opacity-80">
                        {locale === "en" ? "Accept" : "Terima"}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}

            {settlement.status === "rejected" && (
              <View className="flex-col items-end gap-1">
                <View className="bg-negative-bg px-1.5 py-0.5 rounded">
                  <Text className="text-negative-fg text-[10px] font-grotesk-bold uppercase">
                    {locale === "en" ? "Rejected" : "Ditolak"}
                  </Text>
                </View>
              </View>
            )}

            {settlement.status === "confirmed" &&
              group.status !== "archived" &&
              !isRemoved &&
              settlement.payeeId === user?.id && (
                <Pressable
                  onPress={() => setSettlementIdToDelete(settlement.id)}
                  disabled={deletingId === settlement.id || isFetching}
                  className={cn(
                    (deletingId === settlement.id || isFetching) &&
                      "opacity-50",
                  )}
                >
                  <Text className="text-fg-muted text-sm font-grotesk-medium opacity-80">
                    {locale === "en" ? "Revert" : "Kembalikan"}
                  </Text>
                </Pressable>
              )}
          </View>
        </View>
        {settlement.status === "rejected" && settlement.rejectionReason && (
          <View className="border-l-2 border-border-default pl-2">
            <Text className="text-sm text-fg-muted italic">
              "{settlement.rejectionReason}"
            </Text>
          </View>
        )}
      </View>
    );
  };

  const settlementToDelete = settlements.find(
    (s) => s.id === settlementIdToDelete,
  );

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={title}
        onBack={() => router.back()}
        isFetching={isFetching}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-col gap-1 mb-8">
          <Text variant="display">
            {locale === "en" ? "Settlements" : "Pelunasan"}
          </Text>
          <Text variant="body" className="text-fg-muted mt-2">
            {group.name} &middot; {settlements.length}{" "}
            {locale === "en"
              ? `settlement${settlements.length !== 1 ? "s" : ""}`
              : "pelunasan"}
          </Text>
        </View>

        <DashboardTabs
          tabs={[
            {
              id: "actionable",
              label: locale === "en" ? "Actionable" : "Perlu Tindakan",
            },
            { id: "history", label: locale === "en" ? "History" : "Riwayat" },
          ]}
          activeId={filter}
          onChange={(id) => setFilter(id as "actionable" | "history")}
          className="mb-8"
        />

        <View className="flex-col">
          {filter === "actionable" && actionableSettlements.length === 0 && (
            <Text variant="body" className="text-fg-muted">
              {locale === "en"
                ? "You have no actionable settlements."
                : "Anda tidak memiliki pelunasan yang perlu ditindak."}
            </Text>
          )}
          {filter === "history" && historySettlements.length === 0 && (
            <Text variant="body" className="text-fg-muted">
              {locale === "en"
                ? "No settlement history found in this group."
                : "Tidak ada riwayat pelunasan di grup ini."}
            </Text>
          )}

          {filter === "actionable" && actionableSettlements.length > 0 && (
            <View className="flex-col">
              {actionableSettlements.map(renderSettlement)}
            </View>
          )}

          {filter === "history" && historySettlements.length > 0 && (
            <View className="flex-col gap-6">
              {historyYours.length > 0 && (
                <View className="flex-col">
                  {hasMultipleSections && (
                    <Text
                      variant="caption"
                      className="text-fg-muted font-grotesk-bold tracking-wider uppercase px-1 pb-1"
                    >
                      {locale === "en" ? "Yours" : "Milik Anda"}
                    </Text>
                  )}
                  <View
                    className={cn(
                      "flex-col",
                      hasMultipleSections && "border-t border-border-subtle",
                    )}
                  >
                    {historyYours.map(renderSettlement)}
                  </View>
                </View>
              )}
              {historyOthers.length > 0 && (
                <View className="flex-col">
                  {hasMultipleSections && (
                    <Text
                      variant="caption"
                      className="text-fg-muted font-grotesk-bold tracking-wider uppercase px-1 pb-1"
                    >
                      {locale === "en" ? "Others" : "Lainnya"}
                    </Text>
                  )}
                  <View
                    className={cn(
                      "flex-col",
                      hasMultipleSections && "border-t border-border-subtle",
                    )}
                  >
                    {historyOthers.map(renderSettlement)}
                  </View>
                </View>
              )}
              {historyRemoved.length > 0 && (
                <View className="flex-col">
                  {hasMultipleSections && (
                    <Text
                      variant="caption"
                      className="text-fg-muted font-grotesk-bold tracking-wider uppercase px-1 pb-1"
                    >
                      {locale === "en"
                        ? "Removed Members"
                        : "Anggota yang Dihapus"}
                    </Text>
                  )}
                  <View
                    className={cn(
                      "flex-col",
                      hasMultipleSections && "border-t border-border-subtle",
                    )}
                  >
                    {historyRemoved.map(renderSettlement)}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        isOpen={settlementIdToDelete !== null}
        title={
          locale === "en"
            ? settlementToDelete?.status === "confirmed"
              ? "Revert settlement"
              : "Cancel settlement"
            : "Batalkan pelunasan"
        }
        description={
          locale === "en"
            ? settlementToDelete?.status === "confirmed"
              ? "Are you sure you want to revert this settlement? Balances will be restored to their previous state."
              : "Are you sure you want to cancel this settlement?"
            : settlementToDelete?.status === "confirmed"
              ? "Apakah Anda yakin ingin membatalkan pelunasan ini? Saldo akan dikembalikan ke kondisi sebelumnya."
              : "Apakah Anda yakin ingin membatalkan pelunasan ini?"
        }
        confirmText={
          locale === "en"
            ? settlementToDelete?.status === "confirmed"
              ? "Revert"
              : "Cancel"
            : "Batalkan"
        }
        cancelText={locale === "en" ? "Back" : "Kembali"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSettlementIdToDelete(null)}
        loading={deletingId !== null}
        confirmVariant="negative"
      />

      <ConfirmModal
        isOpen={settlementIdToReject !== null}
        title={locale === "en" ? "Decline settlement" : "Tolak pelunasan"}
        description={
          locale === "en"
            ? "Are you sure you want to decline this settlement? You can optionally provide a reason."
            : "Apakah Anda yakin ingin menolak pelunasan ini? Anda dapat memberikan alasan opsional."
        }
        confirmText={locale === "en" ? "Decline" : "Tolak"}
        cancelText={locale === "en" ? "Back" : "Kembali"}
        onConfirm={handleConfirmReject}
        onCancel={() => {
          setSettlementIdToReject(null);
          setRejectReason("");
        }}
        loading={rejectingId !== null}
        confirmVariant="negative"
      >
        <TextInput
          multiline
          numberOfLines={4}
          placeholder={
            locale === "en" ? "Reason (optional)..." : "Alasan (opsional)..."
          }
          placeholderTextColor={fgMuted[scheme]}
          value={rejectReason}
          onChangeText={setRejectReason}
          textAlignVertical="top"
          className="w-full px-3 py-2 h-24 bg-bg-base border border-border-default rounded-md text-fg-default font-grotesk text-sm"
        />
      </ConfirmModal>

      <ConfirmModal
        isOpen={settlementIdToAccept !== null}
        onCancel={() => {
          if (confirmingId) return;
          setSettlementIdToAccept(null);
        }}
        onConfirm={handleConfirmAccept}
        title={locale === "en" ? "Accept Settlement" : "Terima Pelunasan"}
        description={
          locale === "en"
            ? "Are you sure you want to accept this settlement? Please confirm that you have received the funds."
            : "Apakah Anda yakin ingin menerima pelunasan ini? Pastikan Anda telah menerima dana tersebut."
        }
        confirmText={locale === "en" ? "Accept" : "Terima"}
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        loading={!!confirmingId}
        confirmVariant="primary"
      />
    </View>
  );
}
