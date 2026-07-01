/* eslint-disable react-hooks/set-state-in-effect -- hydrate editor state from the fetched expense, mirroring summe-web */
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ItemForm } from "@/components/expense/ItemForm";
import { ReceiptScanArea } from "@/components/expense/ReceiptScanArea";
import { cn } from "@/lib/cn";
import { generateUUID } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { formatCurrency, formatMemberName } from "@/lib/format";
import {
  toApiItem,
  toFixedFloatString,
  formatNumberInput,
  parseNumberInput,
  type ExpenseItem,
} from "@/lib/expense";
import { useAuthStore } from "@/stores/authStore";
import {
  useGroupDetail,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  type ReceiptDraft,
} from "@/lib/queries";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;
const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;
const negativeFg = { light: "#b91c1c", dark: "#f87171" } as const;

function ExpenseSkeleton() {
  return (
    <View className="flex-1 px-4 pt-4 flex-col gap-6">
      <View className="flex-col gap-1 pb-1">
        <View className="w-24 h-4 rounded-sm bg-bg-subtle-emphasized mb-2" />
        <View className="w-full h-8 border-b border-border-subtle bg-bg-subtle-emphasized" />
      </View>
      <View className="flex-col gap-1 pb-1">
        <View className="w-16 h-4 rounded-sm bg-bg-subtle-emphasized mb-2" />
        <View className="w-full h-8 border-b border-border-subtle bg-bg-subtle-emphasized" />
      </View>
      <View className="flex-col mt-2">
        <View className="flex-row items-center justify-between mb-2">
          <View className="w-12 h-4 rounded-sm bg-bg-subtle-emphasized" />
          <View className="w-8 h-8 rounded-full bg-bg-subtle-emphasized" />
        </View>
        <View className="w-full h-20 border border-dashed border-border-subtle rounded-md bg-bg-subtle-emphasized mt-1" />
      </View>
    </View>
  );
}

export default function ExpenseEditorScreen() {
  const { groupId, expenseId } = useLocalSearchParams<{
    groupId: string;
    expenseId: string;
  }>();
  const locale = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  const { data: groupRes, isLoading, isFetching } = useGroupDetail(groupId);
  const group = groupRes?.data;
  const user = useAuthStore((s) => s.session?.user);

  const createExpense = useCreateExpense(groupId);
  const updateExpense = useUpdateExpense(groupId, expenseId);
  const deleteExpense = useDeleteExpense(groupId);
  const expenseDetail = group?.expenses.find((e) => e.id === expenseId);

  const currentMember = group?.members.find((m) => m.id === user?.id);
  const isOwner = currentMember?.role === "owner";
  const isCreator = expenseDetail?.createdBy === user?.id;
  const isPayer = expenseDetail?.paidBy === user?.id;
  const isBlockedByPermission =
    expenseId !== "create" && !isCreator && !isPayer && !isOwner;

  const expenseDate = expenseDetail
    ? new Date(expenseDetail.createdAt).getTime()
    : 0;
  // A rejected settlement never settled anything, so it must not lock the
  // expense. Settlements arrive newest-first; use the latest non-rejected one.
  const latestNonRejectedSettlement = group?.settlements?.find(
    (s) => s.status !== "rejected",
  );
  const latestSettlementDate = latestNonRejectedSettlement
    ? new Date(latestNonRejectedSettlement.createdAt).getTime()
    : 0;
  const isBlockedBySettlement =
    expenseId !== "create" && latestSettlementDate > expenseDate;

  const isBlockedByRemovedMember = (() => {
    if (expenseId === "create") return false;
    const payer = group?.members.find((m) => m.id === expenseDetail?.paidBy);
    if (payer?.status === "removed") return true;

    if (expenseDetail?.items) {
      for (const item of expenseDetail.items) {
        for (const assignment of item.assignments) {
          const assignee = group?.members.find(
            (m) => m.id === assignment.assigneeId,
          );
          if (assignee?.status === "removed") return true;
        }
      }
    }
    return false;
  })();

  const canModify =
    expenseId === "create" ||
    (!isBlockedBySettlement &&
      !isBlockedByPermission &&
      !isBlockedByRemovedMember);
  const isSettled = !canModify;

  const [isPending, setIsPending] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // --- Expense Level State ---
  const [showErrors, setShowErrors] = useState(false);
  const [name, setName] = useState("");
  const [paidBy, setPaidBy] = useState(user?.id || "");
  const [isPaidByModalOpen, setIsPaidByModalOpen] = useState(false);
  const [items, setItems] = useState<ExpenseItem[]>([]);

  // ItemForm modal state: null = closed, "new" = adding, number = editing index
  const [editingItemIndex, setEditingItemIndex] = useState<
    number | "new" | null
  >(null);

  const [discountAmount, setDiscountAmount] = useState("");
  const [serviceChargeAmount, setServiceChargeAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [tipAmount, setTipAmount] = useState("");

  const [initialHash, setInitialHash] = useState("");
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    if (expenseId !== "create" && expenseDetail && !initialDataLoaded) {
      setName(expenseDetail.name);
      setPaidBy(expenseDetail.paidBy);
      setDiscountAmount(
        expenseDetail.discountAmount
          ? expenseDetail.discountAmount.toString()
          : "",
      );
      setServiceChargeAmount(
        expenseDetail.serviceChargeAmount
          ? expenseDetail.serviceChargeAmount.toString()
          : "",
      );
      setTaxAmount(
        expenseDetail.taxAmount ? expenseDetail.taxAmount.toString() : "",
      );
      setTipAmount(
        expenseDetail.tipAmount ? expenseDetail.tipAmount.toString() : "",
      );

      const formattedInitialItems = expenseDetail.items.map((i) => {
        const quantity = i.quantity ?? 1;
        const unitPrice = toFixedFloatString(i.amount) || "0.00";
        const lineTotal =
          toFixedFloatString(Number(i.amount) * quantity) || "0.00";
        return {
          name: i.name,
          amount: lineTotal,
          baseAmount: unitPrice,
          pcs: String(quantity),
          splitKind: i.splitKind,
          assignments: i.assignments.map((a) => ({
            assigneeId: a.assigneeId,
            value: a.value.toString(),
          })),
        };
      });
      setItems(formattedInitialItems);

      const initialData = {
        name: expenseDetail.name,
        paidBy: expenseDetail.paidBy,
        discountAmount: toFixedFloatString(expenseDetail.discountAmount) || "",
        serviceChargeAmount:
          toFixedFloatString(expenseDetail.serviceChargeAmount) || "",
        taxAmount: toFixedFloatString(expenseDetail.taxAmount) || "",
        tipAmount: toFixedFloatString(expenseDetail.tipAmount) || "",
        items: formattedInitialItems.map(toApiItem),
      };
      setInitialHash(JSON.stringify(initialData));
      setInitialDataLoaded(true);
    }
  }, [expenseId, expenseDetail, initialDataLoaded]);

  useEffect(() => {
    if (user?.id && !paidBy) {
      setPaidBy(user.id);
    }
  }, [user?.id, paidBy]);

  const [paidBySearch, setPaidBySearch] = useState("");
  const [expandedItemIndices, setExpandedItemIndices] = useState<Set<number>>(
    new Set(),
  );

  const toggleExpandItem = (index: number) => {
    setExpandedItemIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const upsertItem = (index: number | "new", item: ExpenseItem) => {
    setItems((prev) => {
      if (index === "new") return [...prev, item];
      const next = [...prev];
      next[index] = item;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (expandedItemIndices.has(index)) {
      toggleExpandItem(index);
    }
  };

  const handleQuickSplitItem = (index: number) => {
    if (!group) return;
    const activeMembers = group.members.filter((m) => m.status !== "removed");
    const newAssignments = activeMembers.map((m) => ({
      assigneeId: m.id,
      value: "1",
    }));

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        splitKind: "equal",
        assignments: newAssignments,
      };
      return next;
    });
  };

  const handleScanned = (draft: ReceiptDraft) => {
    setName(draft.name);
    setTaxAmount(toFixedFloatString(draft.taxAmount) || "");
    setServiceChargeAmount(toFixedFloatString(draft.serviceChargeAmount) || "");
    setDiscountAmount(toFixedFloatString(draft.discountAmount) || "");
    setTipAmount(toFixedFloatString(draft.tipAmount) || "");

    const mappedItems = draft.items.map((it) => {
      // The scanner returns `amount` as the per-unit price and `quantity` as
      // the unit count. Mirror the manual item editor: keep the unit price in
      // baseAmount/pcs and store the line total (unit * qty) in amount.
      const qty = it.quantity > 1 ? it.quantity : 1;
      const unit = toFixedFloatString(it.amount) || "0.00";
      const total = toFixedFloatString(parseFloat(unit) * qty) || "0.00";
      return {
        name: it.name,
        amount: total,
        baseAmount: unit,
        pcs: String(qty),
        splitKind: "equal" as const,
        assignments: [],
      };
    });
    setItems((prev) => [...prev, ...mappedItems]);
  };

  const handleCreate = async () => {
    const hasUnassignedItems = items.some((i) => i.assignments.length === 0);
    const hasMissingAmountItems = items.some(
      (i) => parseFloat(i.amount) === 0 || !i.amount,
    );

    if (
      !name ||
      !paidBy ||
      items.length === 0 ||
      hasUnassignedItems ||
      hasMissingAmountItems
    ) {
      setShowErrors(true);
      return;
    }

    setIsPending(true);
    try {
      const idempotencyKeyExpense = generateUUID();
      const formattedItems = items.map(toApiItem);

      const currentData = {
        name,
        paidBy,
        discountAmount: toFixedFloatString(discountAmount) || "",
        serviceChargeAmount: toFixedFloatString(serviceChargeAmount) || "",
        taxAmount: toFixedFloatString(taxAmount) || "",
        tipAmount: toFixedFloatString(tipAmount) || "",
        items: formattedItems,
      };

      if (expenseId !== "create") {
        if (JSON.stringify(currentData) === initialHash) {
          router.back();
          return;
        }

        const initialData = JSON.parse(initialHash);
        const patchData: Partial<typeof currentData> = {};

        if (currentData.name !== initialData.name)
          patchData.name = currentData.name;
        if (currentData.paidBy !== initialData.paidBy)
          patchData.paidBy = currentData.paidBy;

        if (currentData.discountAmount !== initialData.discountAmount) {
          patchData.discountAmount = currentData.discountAmount || undefined;
        }
        if (
          currentData.serviceChargeAmount !== initialData.serviceChargeAmount
        ) {
          patchData.serviceChargeAmount =
            currentData.serviceChargeAmount || undefined;
        }
        if (currentData.taxAmount !== initialData.taxAmount) {
          patchData.taxAmount = currentData.taxAmount || undefined;
        }
        if (currentData.tipAmount !== initialData.tipAmount) {
          patchData.tipAmount = currentData.tipAmount || undefined;
        }
        if (
          JSON.stringify(currentData.items) !==
          JSON.stringify(initialData.items)
        ) {
          patchData.items = currentData.items;
        }

        const updateRes = await updateExpense.mutateAsync({
          data: patchData,
          idempotencyKey: idempotencyKeyExpense,
        });

        if (!updateRes.data) throw new Error("Failed to update expense");
      } else {
        const expenseRes = await createExpense.mutateAsync({
          data: {
            ...currentData,
            discountAmount: currentData.discountAmount || undefined,
            serviceChargeAmount: currentData.serviceChargeAmount || undefined,
            taxAmount: currentData.taxAmount || undefined,
            tipAmount: currentData.tipAmount || undefined,
          },
          idempotencyKey: idempotencyKeyExpense,
        });

        if (!expenseRes.data) throw new Error("Failed to create expense");
      }

      router.back();
    } catch (e) {
      // The global mutation-error toast surfaces the failure.
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteExpense = async () => {
    setIsPending(true);
    try {
      await deleteExpense.mutateAsync({
        expenseId,
        idempotencyKey: generateUUID(),
      });
      setIsDeleteDialogOpen(false);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  const title =
    expenseId !== "create"
      ? locale === "en"
        ? "Edit expense"
        : "Edit pengeluaran"
      : locale === "en"
        ? "Add expense"
        : "Tambah pengeluaran";

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader title={title} onBack={() => router.back()} />
        <ExpenseSkeleton />
      </View>
    );
  }

  if (!group) return null;

  const currencyLabel = group.currency.symbol || group.currency.code || "Rp";
  const subtotal = items.reduce(
    (acc, curr) => acc + (parseFloat(curr.amount) || 0),
    0,
  );
  const total = Math.max(
    0,
    subtotal -
      (parseFloat(discountAmount) || 0) +
      (parseFloat(taxAmount) || 0) +
      (parseFloat(serviceChargeAmount) || 0) +
      (parseFloat(tipAmount) || 0),
  );

  const chargeFields: {
    label: string;
    value: string;
    setValue: (v: string) => void;
  }[] = [
    {
      label: locale === "en" ? "Discount" : "Diskon",
      value: discountAmount,
      setValue: setDiscountAmount,
    },
    {
      label: locale === "en" ? "Service" : "Layanan",
      value: serviceChargeAmount,
      setValue: setServiceChargeAmount,
    },
    {
      label: locale === "en" ? "Tax" : "Pajak",
      value: taxAmount,
      setValue: setTaxAmount,
    },
    {
      label: locale === "en" ? "Tip" : "Tip",
      value: tipAmount,
      setValue: setTipAmount,
    },
  ];

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={title}
        onBack={() => router.back()}
        isFetching={isFetching}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-4 pt-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isSettled && (
          <View
            className={cn(
              "flex-row items-start gap-3 p-4 -mx-4 -mt-4 mb-4",
              isBlockedBySettlement || isBlockedByRemovedMember
                ? "bg-negative-bg"
                : "bg-bg-subtle",
            )}
          >
            <Feather
              name="alert-circle"
              size={20}
              color={
                isBlockedBySettlement || isBlockedByRemovedMember
                  ? negativeFg[scheme]
                  : fgMuted[scheme]
              }
              style={{ marginTop: 2 }}
            />
            <View className="flex-col gap-1 flex-1">
              <Text
                variant="caption"
                className={cn(
                  "font-grotesk-bold",
                  isBlockedBySettlement || isBlockedByRemovedMember
                    ? "text-negative-fg"
                    : "text-fg-default",
                )}
              >
                {locale === "en"
                  ? "Cannot modify this expense"
                  : "Tidak dapat mengubah pengeluaran ini"}
              </Text>
              <Text
                variant="caption"
                className={
                  isBlockedBySettlement || isBlockedByRemovedMember
                    ? "text-negative-fg"
                    : "text-fg-muted"
                }
              >
                {isBlockedByRemovedMember
                  ? locale === "en"
                    ? "This expense involves a removed member. It cannot be modified to preserve balance history."
                    : "Pengeluaran ini melibatkan anggota yang telah dihapus. Data tidak dapat diubah untuk menjaga riwayat saldo."
                  : isBlockedBySettlement
                    ? locale === "en"
                      ? "A settlement has occurred after this expense was created. Modifying it would cause inconsistencies in resolved balances."
                      : "Terdapat pelunasan setelah pengeluaran ini dibuat. Mengubahnya akan menyebabkan ketidakkonsistenan saldo."
                    : locale === "en"
                      ? "Only the creator or payer of this expense, or the group owner can modify it."
                      : "Hanya pembuat, pembayar pengeluaran ini, atau pemilik grup yang dapat mengubahnya."}
              </Text>
            </View>
          </View>
        )}

        <View className="flex-col gap-1 pb-1 mb-6">
          <Text variant="caption" className="text-fg-muted">
            {locale === "en" ? "Expense Name" : "Nama Pengeluaran"}
          </Text>
          <Input
            variant="underline"
            placeholder={
              locale === "en"
                ? "e.g. Bali Trip Day 1"
                : "mis. Perjalanan Bali Hari 1"
            }
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (value) setShowErrors(false);
            }}
            editable={!isSettled}
            error={
              showErrors && !name
                ? locale === "en"
                  ? "Expense name is required"
                  : "Nama pengeluaran wajib diisi"
                : undefined
            }
          />
        </View>

        <View className="flex-col gap-1 pb-1 mb-6">
          <Text variant="caption" className="text-fg-muted">
            {locale === "en" ? "Paid by" : "Dibayar oleh"}
          </Text>
          <Pressable
            onPress={() => setIsPaidByModalOpen(true)}
            disabled={isSettled}
            className={cn(
              "flex-row items-center justify-between border-b border-border-subtle py-2",
              isSettled && "opacity-60",
            )}
          >
            <Text variant="body" className="text-fg-default">
              {(() => {
                const payer = group.members.find((m) => m.id === paidBy);
                if (!payer)
                  return locale === "en" ? "Select payer" : "Pilih pembayar";
                return formatMemberName(payer, locale, payer.id === user?.id);
              })()}
            </Text>
            <Feather name="chevron-down" size={20} color={fgMuted[scheme]} />
          </Pressable>
          {showErrors && !paidBy && (
            <Text variant="caption" className="text-negative-fg">
              {locale === "en" ? "Payer is required" : "Pembayar wajib dipilih"}
            </Text>
          )}
        </View>

        <View className="flex-col mt-2">
          <View className="flex-row items-center justify-between mb-2">
            <Text variant="caption" className="text-fg-muted">
              {locale === "en" ? "Items" : "Item"}
            </Text>
            {!isSettled && items.length > 0 && (
              <Pressable
                onPress={() => setEditingItemIndex("new")}
                accessibilityRole="button"
                accessibilityLabel="Add new expense item"
                className="w-8 h-8 items-center justify-center bg-bg-subtle border border-border-subtle rounded-full"
              >
                <Feather name="plus" size={16} color={fgDefault[scheme]} />
              </Pressable>
            )}
          </View>

          {!isSettled && items.length === 0 ? (
            <View className="flex-col gap-1 pb-1">
              {/* With no items, always offer the scan area (with its manual
                  fallback) so the user can rebuild the expense, whether
                  creating a new one or editing an existing one whose items
                  were all removed. */}
              <ReceiptScanArea
                groupId={groupId}
                locale={locale}
                onScanned={handleScanned}
                onAddManually={() => setEditingItemIndex("new")}
              />
              {showErrors && items.length === 0 && (
                <Text variant="caption" className="text-negative-fg">
                  {locale === "en"
                    ? "At least one item is required"
                    : "Minimal satu item wajib diisi"}
                </Text>
              )}
            </View>
          ) : (
            <View className="flex-col">
              {items.map((item, index) => (
                <View
                  key={index}
                  className={cn(
                    "flex-col py-4 border-dashed border-border-subtle",
                    index === items.length - 1 ? "border-b-0" : "border-b",
                  )}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-col gap-1 flex-1 min-w-0 pr-4">
                      <View className="flex-row items-center gap-2">
                        <Text variant="body" className="shrink" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View className="shrink-0 px-2 py-0.5 rounded-full border border-border-subtle">
                          <Text className="text-[10px] font-grotesk-medium text-fg-muted tracking-wider uppercase">
                            {locale === "en"
                              ? item.splitKind
                              : item.splitKind === "equal"
                                ? "sama rata"
                                : item.splitKind === "shares"
                                  ? "bagian"
                                  : item.splitKind === "exact"
                                    ? "pasti"
                                    : "%"}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-3">
                        {item.assignments.length === 0 ? (
                          <>
                            <View className="px-1.5 py-0.5 rounded-sm bg-negative-bg">
                              <Text className="text-[10px] uppercase font-grotesk-bold tracking-wider text-negative-fg">
                                {locale === "en"
                                  ? "Unassigned"
                                  : "Belum ditugaskan"}
                              </Text>
                            </View>
                            {!isSettled && (
                              <Pressable
                                onPress={() => handleQuickSplitItem(index)}
                              >
                                <Text className="text-[12px] text-fg-default underline">
                                  {locale === "en"
                                    ? "Quick split"
                                    : "Bagi cepat"}
                                </Text>
                              </Pressable>
                            )}
                          </>
                        ) : (
                          <>
                            <Text variant="caption" className="text-fg-muted">
                              {item.assignments.length}{" "}
                              {locale === "en"
                                ? `member${item.assignments.length !== 1 ? "s" : ""}`
                                : "anggota"}
                            </Text>
                            <Pressable onPress={() => toggleExpandItem(index)}>
                              <Text className="text-[12px] text-fg-default underline">
                                {expandedItemIndices.has(index)
                                  ? locale === "en"
                                    ? "Hide details"
                                    : "Sembunyikan detail"
                                  : locale === "en"
                                    ? "View details"
                                    : "Lihat detail"}
                              </Text>
                            </Pressable>
                          </>
                        )}
                      </View>
                    </View>
                    <View className="flex-col items-end gap-1 shrink-0">
                      {item.pcs && parseFloat(item.pcs) !== 1 && (
                        <Text variant="caption" className="text-fg-muted">
                          {item.pcs} &times;{" "}
                          {formatCurrency(
                            Number(item.baseAmount || item.amount),
                            group.currency || "IDR",
                          )}
                        </Text>
                      )}
                      <Text variant="mono-data" className="text-fg-default">
                        {currencyLabel}{" "}
                        {Intl.NumberFormat("en-US").format(Number(item.amount))}
                      </Text>
                      {!isSettled && (
                        <View className="flex-row items-center gap-1">
                          <Pressable
                            onPress={() => setEditingItemIndex(index)}
                            accessibilityRole="button"
                            accessibilityLabel="Edit item"
                            className="p-1"
                          >
                            <Feather
                              name="edit-2"
                              size={16}
                              color={fgMuted[scheme]}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => handleRemoveItem(index)}
                            accessibilityRole="button"
                            accessibilityLabel="Remove item"
                            className="p-1"
                          >
                            <Feather
                              name="trash-2"
                              size={16}
                              color={fgMuted[scheme]}
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                  {showErrors &&
                    (item.assignments.length === 0 ||
                      parseFloat(item.amount) === 0 ||
                      !item.amount) && (
                      <View className="mt-2 flex-col gap-0.5 bg-negative-bg p-2 rounded-md">
                        {item.assignments.length === 0 && (
                          <Text variant="caption" className="text-negative-fg">
                            {locale === "en"
                              ? "Missing assignments. Please assign members."
                              : "Penugasan belum diisi. Silakan pilih anggota."}
                          </Text>
                        )}
                        {(parseFloat(item.amount) === 0 || !item.amount) && (
                          <Text variant="caption" className="text-negative-fg">
                            {locale === "en"
                              ? "Amount must be greater than zero."
                              : "Jumlah tidak boleh nol."}
                          </Text>
                        )}
                      </View>
                    )}
                  {expandedItemIndices.has(index) && (
                    <View className="mt-3 pl-3 border-l-2 border-border-subtle flex-col gap-2">
                      {item.assignments.map((assignment) => {
                        const member = group.members.find(
                          (m) => m.id === assignment.assigneeId,
                        );
                        return (
                          <View
                            key={assignment.assigneeId}
                            className="flex-row justify-between items-center"
                          >
                            <Text
                              variant="caption"
                              className="text-fg-muted shrink"
                              numberOfLines={1}
                            >
                              {formatMemberName(
                                member,
                                locale,
                                member?.id === user?.id,
                              )}
                            </Text>
                            <Text
                              variant="mono-caption"
                              className="text-fg-muted shrink-0 pl-2"
                            >
                              {item.splitKind === "equal"
                                ? ""
                                : item.splitKind === "shares"
                                  ? `${assignment.value} ${locale === "en" ? "shares" : "bagian"}`
                                  : item.splitKind === "percent"
                                    ? `${assignment.value}%`
                                    : `${group.currency.symbol || "Rp"}${Intl.NumberFormat("en-US").format(Number(assignment.value))}`}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {items.length > 0 && (
          <View className="flex-col gap-4 mt-6">
            {/* Subtotal */}
            <View className="flex-row justify-between items-center px-1">
              <Text variant="body" className="text-fg-muted">
                Subtotal
              </Text>
              <View className="flex-row items-baseline gap-1.5">
                <Text variant="caption" className="text-fg-muted">
                  {currencyLabel}
                </Text>
                <Text variant="mono-data-strong" className="text-fg-default">
                  {Intl.NumberFormat("en-US").format(subtotal)}
                </Text>
              </View>
            </View>

            {/* Compact Additional Charges */}
            <View className="flex-row flex-wrap px-1">
              {chargeFields.map((field, i) => (
                <View
                  key={field.label}
                  className={cn(
                    "w-1/2",
                    i % 2 === 0 ? "pr-3" : "pl-3",
                    i > 1 && "mt-3",
                  )}
                >
                  <View className="flex-col border-b border-border-subtle pb-1 gap-0.5">
                    <Text className="text-[10px] text-fg-muted uppercase tracking-wider font-grotesk-medium">
                      {field.label}
                    </Text>
                    <View className="flex-row items-center gap-1.5 w-full">
                      <Text variant="caption" className="text-fg-muted shrink-0">
                        {currencyLabel}
                      </Text>
                      <TextInput
                        inputMode="decimal"
                        placeholder="0"
                        placeholderTextColor={fgMuted[scheme]}
                        value={formatNumberInput(field.value)}
                        onChangeText={(value) =>
                          field.setValue(parseNumberInput(value))
                        }
                        editable={!isSettled}
                        className={cn(
                          "flex-1 min-w-0 font-mono text-sm text-fg-default p-0",
                          isSettled && "opacity-60",
                        )}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Compact Total */}
            <View className="flex-row justify-between items-center bg-bg-subtle px-4 py-3 rounded-md border border-border-subtle">
              <Text variant="body-strong" className="text-fg-default">
                Total
              </Text>
              <View className="flex-row items-baseline gap-1.5">
                <Text variant="caption" className="text-fg-muted">
                  {currencyLabel}
                </Text>
                <Text variant="title-3" className="text-fg-strong">
                  {Intl.NumberFormat("en-US").format(total)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {canModify && (
        <View
          className="flex-row gap-2 pt-4 border-t border-border-subtle bg-bg-base px-4"
          style={{ paddingBottom: 16 + insets.bottom }}
        >
          {expenseId !== "create" && (
            <Pressable
              onPress={() => setIsDeleteDialogOpen(true)}
              disabled={isFetching || isPending}
              accessibilityRole="button"
              accessibilityLabel={
                locale === "en" ? "Delete expense" : "Hapus pengeluaran"
              }
              className={cn(
                "w-12 h-12 shrink-0 rounded-md bg-negative-fg items-center justify-center",
                (isFetching || isPending) && "opacity-60",
              )}
            >
              <Feather name="trash-2" size={20} color="#ffffff" />
            </Pressable>
          )}
          <View className="flex-1">
            <Button
              variant="primary"
              loading={isPending}
              onPress={handleCreate}
              disabled={isFetching || isPending}
            >
              {expenseId !== "create"
                ? locale === "en"
                  ? "Update Expense"
                  : "Perbarui Pengeluaran"
                : locale === "en"
                  ? "Save Expense"
                  : "Simpan Pengeluaran"}
            </Button>
          </View>
        </View>
      )}

      {/* Item editor (web renders this as a child route over the screen) */}
      <Modal
        visible={editingItemIndex !== null}
        animationType="slide"
        onRequestClose={() => setEditingItemIndex(null)}
      >
        {editingItemIndex !== null && (
          <ItemForm
            mode={editingItemIndex === "new" ? "new" : "edit"}
            editingItem={
              editingItemIndex === "new" ? undefined : items[editingItemIndex]
            }
            group={group}
            userId={user?.id}
            locale={locale}
            onSave={(item) => upsertItem(editingItemIndex, item)}
            onClose={() => setEditingItemIndex(null)}
          />
        )}
      </Modal>

      {/* Paid By picker */}
      <Modal
        visible={isPaidByModalOpen}
        animationType="slide"
        onRequestClose={() => setIsPaidByModalOpen(false)}
      >
        <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between p-4 border-b border-border-subtle">
            <Text variant="title-2" className="text-fg-default">
              {locale === "en" ? "Paid by" : "Dibayar oleh"}
            </Text>
            <Pressable
              onPress={() => setIsPaidByModalOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="p-2 -mr-2"
            >
              <Feather name="x" size={24} color={fgMuted[scheme]} />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="p-2"
            keyboardShouldPersistTaps="handled"
          >
            {group.members.length > 10 && (
              <View className="px-2 mb-2">
                <Input
                  placeholder={
                    locale === "en" ? "Search member..." : "Cari anggota..."
                  }
                  value={paidBySearch}
                  onChangeText={setPaidBySearch}
                />
              </View>
            )}
            {group.members
              .filter(
                (m) =>
                  m.status !== "removed" &&
                  (m.name || m.email)
                    ?.toLowerCase()
                    .includes(paidBySearch.toLowerCase()),
              )
              .map((m) => {
                const isSelected = paidBy === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      setPaidBy(m.id);
                      setIsPaidByModalOpen(false);
                      setShowErrors(false);
                    }}
                    className={cn(
                      "flex-row items-center justify-between gap-2 px-4 py-3 rounded-md",
                      isSelected && "bg-bg-subtle",
                    )}
                  >
                    <Text
                      variant={isSelected ? "body-strong" : "body"}
                      className={cn(
                        "flex-1 min-w-0",
                        isSelected ? "text-fg-strong" : "text-fg-default",
                      )}
                      numberOfLines={1}
                    >
                      {formatMemberName(m, locale, m.id === user?.id)}
                    </Text>
                    {isSelected && (
                      <Feather
                        name="check"
                        size={20}
                        color={fgDefault[scheme]}
                      />
                    )}
                  </Pressable>
                );
              })}
          </ScrollView>
        </View>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteDialogOpen}
        title={locale === "en" ? "Delete expense" : "Hapus pengeluaran"}
        description={
          locale === "en"
            ? "Are you sure you want to delete this expense? This action cannot be undone."
            : "Apakah Anda yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan."
        }
        confirmText={locale === "en" ? "Delete" : "Hapus"}
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        onConfirm={handleDeleteExpense}
        onCancel={() => setIsDeleteDialogOpen(false)}
        loading={isPending}
        confirmVariant="negative"
      />
    </View>
  );
}
