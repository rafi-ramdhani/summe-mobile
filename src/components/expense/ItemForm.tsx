import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import Input from "@/components/Input";
import Button from "@/components/Button";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { cn } from "@/lib/cn";
import { formatMemberName } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import type { GroupDetail } from "@/lib/queries";
import {
  formatNumberInput,
  parseNumberInput,
  validateExactSplit,
  validatePercentSplit,
  type ExpenseItem,
  type SplitKind,
} from "@/lib/expense";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;

type Props = {
  mode: "new" | "edit";
  editingItem?: ExpenseItem;
  group: GroupDetail;
  userId?: string;
  locale: Locale;
  onSave: (item: ExpenseItem) => void;
  onClose: () => void;
};

// The web renders this editor as a child route over the expense screen,
// sharing the draft through context. Expo Router screens don't share
// in-memory state, so on mobile the same editor renders inside a
// full-screen Modal owned by the expense screen (visually identical).
export function ItemForm({
  mode,
  editingItem,
  group,
  userId,
  locale,
  onSave,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  const [showItemErrors, setShowItemErrors] = useState(false);
  const [itemName, setItemName] = useState(editingItem?.name ?? "");
  const [itemAmount, setItemAmount] = useState(
    editingItem?.baseAmount || editingItem?.amount || "",
  );
  const [itemPcs, setItemPcs] = useState(editingItem?.pcs ?? "1");
  const [itemSplitMode, setItemSplitMode] = useState<SplitKind>(
    editingItem?.splitKind ?? "equal",
  );
  const [itemSelectedUserIds, setItemSelectedUserIds] = useState<Set<string>>(
    () => new Set(editingItem?.assignments.map((a) => a.assigneeId) ?? []),
  );
  const seedAssign = (kind: SplitKind): Record<string, string> => {
    const out: Record<string, string> = {};
    if (editingItem?.splitKind === kind) {
      editingItem.assignments.forEach((a) => (out[a.assigneeId] = a.value));
    }
    return out;
  };
  const [itemAssignmentsShares, setItemAssignmentsShares] = useState<
    Record<string, string>
  >(() => seedAssign("shares"));
  const [itemAssignmentsExact, setItemAssignmentsExact] = useState<
    Record<string, string>
  >(() => seedAssign("exact"));
  const [itemAssignmentsPercent, setItemAssignmentsPercent] = useState<
    Record<string, string>
  >(() => seedAssign("percent"));
  const [itemMembersSearch, setItemMembersSearch] = useState("");

  const itemAssignments =
    itemSplitMode === "shares"
      ? itemAssignmentsShares
      : itemSplitMode === "exact"
        ? itemAssignmentsExact
        : itemSplitMode === "percent"
          ? itemAssignmentsPercent
          : {};

  const splitTabs = [
    { id: "equal", label: locale === "en" ? "Equal" : "Sama Rata" },
    { id: "shares", label: locale === "en" ? "Shares" : "Bagian" },
    { id: "exact", label: locale === "en" ? "Exact" : "Pasti" },
    { id: "percent", label: "%" },
  ];

  const toggleUser = (id: string) => {
    const newSet = new Set(itemSelectedUserIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setItemSelectedUserIds(newSet);
    setShowItemErrors(false);
  };

  const handleAssignmentChange = (id: string, value: string) => {
    if (itemSplitMode === "shares") {
      setItemAssignmentsShares((prev) => ({ ...prev, [id]: value }));
    } else if (itemSplitMode === "exact") {
      setItemAssignmentsExact((prev) => ({ ...prev, [id]: value }));
    } else if (itemSplitMode === "percent") {
      setItemAssignmentsPercent((prev) => ({ ...prev, [id]: value }));
    }

    if (!itemSelectedUserIds.has(id)) {
      const newSet = new Set(itemSelectedUserIds);
      newSet.add(id);
      setItemSelectedUserIds(newSet);
      setShowItemErrors(false);
    }
  };

  const handleSaveItem = () => {
    if (!itemName) {
      setShowItemErrors(true);
      return;
    }
    const parsedAmount = parseFloat(itemAmount) || 0;
    const parsedPcs = Math.max(1, Math.trunc(parseFloat(itemPcs) || 1));
    const totalAmount = (parsedAmount * parsedPcs).toString();

    if (itemSelectedUserIds.size > 0) {
      if (itemSplitMode === "percent") {
        if (!validatePercentSplit(itemAssignments, itemSelectedUserIds)) return;
      }
      if (itemSplitMode === "exact") {
        const target = parseFloat(totalAmount) || 0;
        if (!validateExactSplit(itemAssignments, itemSelectedUserIds, target))
          return;
      }
    }

    const finalAssignments = Array.from(itemSelectedUserIds).map((id) => {
      let value = "1";
      if (itemSplitMode !== "equal") value = itemAssignments[id] || "1";
      return { assigneeId: id, value };
    });

    onSave({
      name: itemName,
      amount: totalAmount,
      baseAmount: itemAmount,
      pcs: String(parsedPcs),
      splitKind: itemSplitMode,
      assignments: finalAssignments,
    });
    onClose();
  };

  const activeMembers = group.members.filter((m) => m.status !== "removed");

  const currencyLabel =
    group.currency.symbol || group.currency.code || "Rp";

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={
          mode === "edit"
            ? locale === "en"
              ? "Edit item"
              : "Ubah item"
            : locale === "en"
              ? "Add item"
              : "Tambah item"
        }
        onBack={onClose}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-col gap-1 pb-1 mb-6">
            <Text variant="caption" className="text-fg-muted">
              {locale === "en" ? "Item Name" : "Nama Item"}
            </Text>
            <Input
              variant="underline"
              placeholder={
                locale === "en" ? "e.g. Car Rental" : "mis. Sewa Mobil"
              }
              value={itemName}
              onChangeText={(value) => {
                setItemName(value);
                if (value) setShowItemErrors(false);
              }}
              error={
                showItemErrors && !itemName
                  ? locale === "en"
                    ? "Item name is required"
                    : "Nama item wajib diisi"
                  : undefined
              }
            />
          </View>

          <View className="flex-col gap-2 mb-6">
            <View className="flex-row items-end gap-4 pb-1">
              <View className="flex-col gap-2 flex-1 min-w-0">
                <Text variant="caption" className="text-fg-muted">
                  {locale === "en" ? "Amount per item" : "Harga satuan"}
                </Text>
                <View className="flex-row items-center gap-2 border-b border-border-subtle pb-1">
                  <Text variant="title-2" className="text-fg-muted">
                    {currencyLabel}
                  </Text>
                  <TextInput
                    inputMode="decimal"
                    placeholder="0"
                    placeholderTextColor={fgMuted[scheme]}
                    value={formatNumberInput(itemAmount)}
                    onChangeText={(value) => {
                      setItemAmount(parseNumberInput(value));
                      if (value) setShowItemErrors(false);
                    }}
                    className="text-2xl font-grotesk-bold text-fg-default flex-1 min-w-0 p-0"
                  />
                </View>
              </View>

              <View className="flex-col gap-2 w-32 shrink-0">
                <Text variant="caption" className="text-fg-muted">
                  {locale === "en" ? "Qty" : "Jml"}
                </Text>
                <View className="flex-row items-center border-b border-border-subtle pb-1">
                  <Pressable
                    onPress={() => {
                      const current = parseFloat(itemPcs) || 0;
                      if (current > 1) {
                        setItemPcs((current - 1).toString());
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                    className="w-6 h-6 rounded-full bg-bg-subtle items-center justify-center shrink-0 mr-1"
                  >
                    <Feather name="minus" size={12} color={fgMuted[scheme]} />
                  </Pressable>
                  <TextInput
                    inputMode="decimal"
                    placeholder="1"
                    placeholderTextColor={fgMuted[scheme]}
                    value={formatNumberInput(itemPcs)}
                    onChangeText={(value) => setItemPcs(parseNumberInput(value))}
                    className="text-xl font-grotesk-medium text-fg-default w-10 text-center min-w-0 p-0"
                  />
                  <Pressable
                    onPress={() => {
                      const current = parseFloat(itemPcs) || 0;
                      setItemPcs((current + 1).toString());
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                    className="w-6 h-6 rounded-full bg-bg-subtle items-center justify-center shrink-0 ml-1"
                  >
                    <Feather name="plus" size={12} color={fgMuted[scheme]} />
                  </Pressable>
                </View>
              </View>
            </View>
            <View className="flex-row items-center gap-2 mt-1">
              <Text variant="caption" className="text-fg-muted">
                Total:
              </Text>
              <Text variant="mono-caption" className="font-mono-bold text-fg-default">
                {currencyLabel}{" "}
                {Intl.NumberFormat("en-US").format(
                  (parseFloat(itemAmount) || 0) * (parseFloat(itemPcs) || 1),
                )}
              </Text>
            </View>
          </View>

          <View className="flex-col gap-4 mt-2">
            <Text variant="caption" className="text-fg-muted">
              {locale === "en" ? "Split mode" : "Mode pembagian"}
            </Text>
            <DashboardTabs
              tabs={splitTabs}
              activeId={itemSplitMode}
              onChange={(id) => setItemSplitMode(id as SplitKind)}
            />

            <View className="flex-col gap-4 mt-2">
              <View className="flex-row justify-between items-center">
                <Text variant="caption" className="text-fg-muted">
                  Participants & amounts
                </Text>
                <Pressable
                  onPress={() => {
                    const allSelected =
                      itemSelectedUserIds.size === activeMembers.length;
                    if (allSelected) {
                      setItemSelectedUserIds(new Set());
                    } else {
                      setItemSelectedUserIds(
                        new Set(activeMembers.map((m) => m.id)),
                      );
                    }
                  }}
                >
                  <Text className="text-xs text-fg-default font-grotesk-medium underline">
                    {itemSelectedUserIds.size === activeMembers.length
                      ? locale === "en"
                        ? "Deselect all"
                        : "Batal pilih semua"
                      : locale === "en"
                        ? "Select all"
                        : "Pilih semua"}
                  </Text>
                </Pressable>
              </View>

              {group.members.length > 10 && (
                <Input
                  placeholder={
                    locale === "en" ? "Search member..." : "Cari anggota..."
                  }
                  value={itemMembersSearch}
                  onChangeText={setItemMembersSearch}
                />
              )}

              <View className="flex-col gap-3">
                {activeMembers
                  .filter((m) =>
                    (m.name || m.email)
                      ?.toLowerCase()
                      .includes(itemMembersSearch.toLowerCase()),
                  )
                  .map((m) => {
                    const isSelected = itemSelectedUserIds.has(m.id);
                    return (
                      <View
                        key={m.id}
                        className="flex-row items-center justify-between gap-2 min-h-[34px]"
                      >
                        <Pressable
                          onPress={() => toggleUser(m.id)}
                          className="flex-row items-center gap-3 flex-1 min-w-0"
                        >
                          <View
                            className={cn(
                              "w-5 h-5 rounded items-center justify-center",
                              isSelected
                                ? "bg-fg-default"
                                : "border border-border-strong",
                            )}
                          >
                            {isSelected && (
                              <Feather
                                name="check"
                                size={14}
                                color={
                                  scheme === "light" ? "#fafaf9" : "#0c0c0d"
                                }
                              />
                            )}
                          </View>
                          <Text
                            variant="body"
                            className="shrink"
                            numberOfLines={1}
                          >
                            {formatMemberName(m, locale, m.id === userId)}
                          </Text>
                        </Pressable>

                        {itemSplitMode !== "equal" && (
                          <View
                            className={cn(
                              "flex-row items-center gap-2 shrink-0",
                              !isSelected && "opacity-40",
                            )}
                          >
                            {itemSplitMode === "shares" && (
                              <View className="flex-row items-center border border-border-subtle rounded-md">
                                <Pressable
                                  className="px-3 py-1"
                                  onPress={() => {
                                    const current = parseInt(
                                      itemAssignments[m.id] || "1",
                                    );
                                    if (current > 1)
                                      handleAssignmentChange(
                                        m.id,
                                        (current - 1).toString(),
                                      );
                                  }}
                                >
                                  <Text className="text-fg-muted">-</Text>
                                </Pressable>
                                <Text variant="body" className="w-6 text-center">
                                  {itemAssignments[m.id] || "1"}
                                </Text>
                                <Pressable
                                  className="px-3 py-1"
                                  onPress={() => {
                                    const current = parseInt(
                                      itemAssignments[m.id] || "1",
                                    );
                                    handleAssignmentChange(
                                      m.id,
                                      (current + 1).toString(),
                                    );
                                  }}
                                >
                                  <Text className="text-fg-muted">+</Text>
                                </Pressable>
                              </View>
                            )}
                            {itemSplitMode === "exact" && (
                              <View className="flex-row items-center gap-1.5 w-32 h-8 px-2 bg-bg-base border border-border-default rounded-md overflow-hidden">
                                <Text
                                  variant="body"
                                  className="text-fg-muted shrink-0"
                                >
                                  {currencyLabel}
                                </Text>
                                <TextInput
                                  inputMode="decimal"
                                  className="flex-1 text-right text-fg-default font-grotesk p-0"
                                  placeholder="0"
                                  placeholderTextColor={fgMuted[scheme]}
                                  value={formatNumberInput(
                                    itemAssignments[m.id] || "",
                                  )}
                                  onChangeText={(value) =>
                                    handleAssignmentChange(
                                      m.id,
                                      parseNumberInput(value),
                                    )
                                  }
                                />
                              </View>
                            )}
                            {itemSplitMode === "percent" && (
                              <View className="flex-row items-center gap-1 w-20 h-8 px-2 bg-bg-base border border-border-default rounded-md overflow-hidden">
                                <TextInput
                                  inputMode="decimal"
                                  className="flex-1 text-right text-fg-default font-grotesk p-0"
                                  placeholder="0"
                                  placeholderTextColor={fgMuted[scheme]}
                                  value={formatNumberInput(
                                    itemAssignments[m.id] || "",
                                  )}
                                  onChangeText={(value) =>
                                    handleAssignmentChange(
                                      m.id,
                                      parseNumberInput(value),
                                    )
                                  }
                                />
                                <Text
                                  variant="body-strong"
                                  className="text-fg-muted shrink-0"
                                >
                                  %
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          className="p-4 bg-bg-base border-t border-border-subtle flex-col gap-2"
          style={{ paddingBottom: 16 + insets.bottom }}
        >
          {itemSplitMode === "percent" &&
            (() => {
              const hasZeroOrLess = Array.from(itemSelectedUserIds).some(
                (id) => (parseFloat(itemAssignments[id]) || 0) <= 0,
              );
              const sum = Array.from(itemSelectedUserIds).reduce(
                (acc, id) => acc + (parseFloat(itemAssignments[id]) || 0),
                0,
              );

              if (hasZeroOrLess) {
                return (
                  <Text
                    variant="caption"
                    className="text-negative-fg text-center mb-2"
                  >
                    {locale === "en"
                      ? "Each member must have more than 0%"
                      : "Setiap anggota harus memiliki lebih dari 0%"}
                  </Text>
                );
              }

              if (sum !== 100) {
                return (
                  <Text
                    variant="caption"
                    className={cn(
                      "text-center mb-2",
                      sum > 100 ? "text-negative-fg" : "text-fg-muted",
                    )}
                  >
                    {locale === "en"
                      ? "Total percentage must equal 100% (currently "
                      : "Total persentase harus 100% (saat ini "}
                    {sum}%)
                  </Text>
                );
              }
              return null;
            })()}
          {itemSplitMode === "exact" &&
            (() => {
              const hasZeroOrLess = Array.from(itemSelectedUserIds).some(
                (id) => (parseFloat(itemAssignments[id]) || 0) <= 0,
              );
              const sum = Array.from(itemSelectedUserIds).reduce(
                (acc, id) => acc + (parseFloat(itemAssignments[id]) || 0),
                0,
              );
              const targetAmount =
                (parseFloat(itemAmount) || 0) * (parseFloat(itemPcs) || 1);

              if (hasZeroOrLess) {
                return (
                  <Text
                    variant="caption"
                    className="text-negative-fg text-center mb-2"
                  >
                    {locale === "en"
                      ? "Each member must have more than 0"
                      : "Setiap anggota harus memiliki lebih dari 0"}
                  </Text>
                );
              }

              if (sum !== targetAmount) {
                return (
                  <Text
                    variant="caption"
                    className={cn(
                      "text-center mb-2",
                      sum > targetAmount ? "text-negative-fg" : "text-fg-muted",
                    )}
                  >
                    {locale === "en"
                      ? "Total amount must equal the expense item amount"
                      : "Total jumlah harus sama dengan jumlah item pengeluaran"}
                  </Text>
                );
              }
              return null;
            })()}
          <Button variant="primary" onPress={handleSaveItem}>
            {mode === "edit"
              ? locale === "en"
                ? "Save item"
                : "Simpan item"
              : locale === "en"
                ? "Add item"
                : "Tambah item"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
