import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import Button from "@/components/Button";
import { cn } from "@/lib/cn";
import { generateUUID } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { formatCurrency, formatMemberName } from "@/lib/format";
import { useAuthStore } from "@/stores/authStore";
import { useGroupDetail, useCreateSettlement } from "@/lib/queries";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;

type Debt = { from: string; to: string; amount: number };

function SettleSkeleton() {
  return (
    <View className="flex-1 px-4 py-6 flex-col gap-8">
      <View className="flex-col gap-2">
        <View className="h-4 bg-bg-subtle rounded-sm w-24" />
        <View className="h-10 bg-bg-subtle rounded-sm w-48 mt-1" />
        <View className="h-4 bg-bg-subtle rounded-sm w-64 mt-2" />
      </View>
      <View className="flex-col gap-4">
        <View className="h-4 bg-bg-subtle rounded-sm w-20" />
        <View className="flex-col">
          {[0, 1].map((i) => (
            <View
              key={i}
              className={cn(
                "flex-row items-center justify-between py-5",
                i > 0 && "border-t border-border-subtle",
              )}
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-10 h-10 bg-bg-subtle rounded-full" />
                <View className="flex-col gap-2 flex-1 max-w-[200px]">
                  <View className="h-5 bg-bg-subtle rounded-sm w-full" />
                  <View className="h-3 bg-bg-subtle rounded-sm w-24" />
                </View>
              </View>
              <View className="h-5 bg-bg-subtle rounded-sm w-16" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function SettleScreen() {
  const { groupId, as } = useLocalSearchParams<{
    groupId: string;
    as?: string;
  }>();
  const locale = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  const { data: response, isLoading, isFetching } = useGroupDetail(groupId);
  const user = useAuthStore((s) => s.session?.user);

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [showError, setShowError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const createSettlement = useCreateSettlement(groupId);

  const group = response?.data;

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader
          title={locale === "en" ? "Settle plan" : "Rencana pelunasan"}
          onBack={() => router.back()}
          isFetching={isFetching}
        />
        <SettleSkeleton />
      </View>
    );
  }

  if (!group) return null;

  const ownerId = group.members.find((m) => m.role === "owner")?.id;
  const asMember = as ? group.members.find((m) => m.id === as) : undefined;
  const onBehalfId =
    as && user?.id === ownerId && asMember?.isManaged ? as : undefined;
  const payerId = onBehalfId ?? user?.id;

  const myDebts = group.debts.filter((debt) => debt.from === payerId);

  // A debt's gross amount comes from confirmed balances and ignores pending
  // settlements. Subtract this payer's outstanding pending settlements toward
  // the payee so the amount available to pay is the *remaining* debt, matching
  // the server, which rejects anything above it.
  const remainingForDebt = (debt: Debt) => {
    const pending = group.settlements.reduce(
      (sum, s) =>
        s.status === "pending" &&
        s.payerId === debt.from &&
        s.payeeId === debt.to
          ? sum + parseFloat(String(s.amount))
          : sum,
      0,
    );
    return Math.max(0, debt.amount - pending);
  };

  const selectedAvailable = selectedDebt ? remainingForDebt(selectedDebt) : 0;

  const formatNumberInput = (val: string) => {
    if (!val) return "";
    const parts = val.split(".");
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? "." + parts[1] : "";
    if (integerPart === "") integerPart = "0";
    const parsedInt = parseInt(integerPart, 10);
    if (isNaN(parsedInt)) return decimalPart === "." ? "0." : "";
    return parsedInt.toLocaleString("en-US") + decimalPart;
  };

  const handleNumericChange = (val: string) => {
    let numericOnly = val.replace(/[^\d.]/g, "");
    const parts = numericOnly.split(".");
    if (parts.length > 2) {
      numericOnly = parts[0] + "." + parts.slice(1).join("");
    }
    setSettlementAmount(numericOnly);
    setShowError(false);
  };

  const handleSubmit = async () => {
    if (!selectedDebt || !settlementAmount) return;
    const amountVal = parseFloat(settlementAmount);
    // A settlement must move a positive amount; zero (e.g. when nothing
    // remains) is not a valid payment.
    if (!(amountVal > 0)) return;
    if (amountVal > remainingForDebt(selectedDebt)) {
      setShowError(true);
      return;
    }

    setIsPending(true);
    try {
      await createSettlement.mutateAsync({
        idempotencyKey,
        payeeId: selectedDebt.to,
        amount: amountVal,
        payerId: onBehalfId,
      });
      setSelectedDebt(null);
      router.back();
    } catch (e) {
      console.error(e);
      // Generate a new idempotency key on failure so the user can retry
      setIdempotencyKey(generateUUID());
    } finally {
      setIsPending(false);
    }
  };

  const pageTitle = onBehalfId
    ? locale === "en"
      ? `Settle for ${formatMemberName(asMember, locale)}`
      : `Lunasi untuk ${formatMemberName(asMember, locale)}`
    : locale === "en"
      ? "Settle plan"
      : "Rencana pelunasan";

  const memberName = (id: string) => {
    const member = group.members.find((m) => m.id === id);
    return formatMemberName(member, locale, member?.id === user?.id);
  };

  return (
    <View className="flex-1 bg-bg-base">
      <ScreenHeader
        title={pageTitle}
        onBack={() => router.back()}
        isFetching={isFetching}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-col gap-1 mb-8">
          <Text variant="caption" className="text-fg-muted uppercase tracking-wider">
            {locale === "en" ? "To settle up" : "Untuk melunasi"}
          </Text>
          <Text variant="display">
            {myDebts.length} {locale === "en" ? "transfers" : "transfer"}
          </Text>
          <Text variant="body" className="text-fg-muted mt-2">
            {group.name} &middot;{" "}
            {locale === "en"
              ? "minimum-transfer plan"
              : "rencana transfer minimum"}
          </Text>
        </View>

        <View className="flex-col gap-4">
          <Text variant="caption" className="text-fg-muted">
            {locale === "en" ? "Transfers" : "Transfer"}
          </Text>

          <View className="flex-col">
            {myDebts.length === 0 ? (
              <Text variant="body" className="text-fg-muted mt-4">
                {locale === "en"
                  ? "You don't have any transfers to make."
                  : "Anda tidak memiliki transfer yang harus dilakukan."}
              </Text>
            ) : (
              myDebts.map((debt, i) => (
                <View
                  key={i}
                  className={cn(
                    "flex-row items-start justify-between py-5",
                    i > 0 && "border-t border-border-subtle border-dotted",
                  )}
                >
                  <Text variant="body-strong" className="text-fg-default mt-1">
                    {memberName(debt.from)} {"→"} {memberName(debt.to)}
                  </Text>
                  <View className="flex-col items-end gap-2">
                    <Text variant="mono-data-strong" className="text-fg-default">
                      {formatCurrency(debt.amount, group.currency)}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSelectedDebt(debt);
                        setSettlementAmount("");
                        setShowError(false);
                        setIdempotencyKey(generateUUID());
                      }}
                      disabled={isFetching}
                      className={cn(isFetching && "opacity-50")}
                    >
                      <Text className="font-grotesk-bold text-fg-default underline">
                        {locale === "en" ? "Pay" : "Bayar"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Record payment: web uses a fixed full-screen overlay sliding from the
          bottom; the native equivalent is a full-screen slide Modal. */}
      <Modal
        visible={!!selectedDebt}
        animationType="slide"
        onRequestClose={() => setSelectedDebt(null)}
      >
        {selectedDebt && (
          <View className="flex-1 bg-bg-base">
            <ScreenHeader
              title={locale === "en" ? "Record payment" : "Catat pembayaran"}
              onBack={() => setSelectedDebt(null)}
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
                <View className="flex-col gap-1 p-4 bg-bg-subtle rounded-md mb-6">
                  <Text variant="caption" className="text-fg-muted">
                    {locale === "en" ? "Settlement details" : "Detail pelunasan"}
                  </Text>
                  <Text variant="body-strong" className="mt-1">
                    {memberName(selectedDebt.from)} {"→"}{" "}
                    {memberName(selectedDebt.to)}
                  </Text>
                  <Text variant="mono-data" className="text-fg-muted mt-2">
                    {locale === "en" ? "Max amount:" : "Jumlah maks:"}{" "}
                    {formatCurrency(selectedAvailable, group.currency)}
                  </Text>
                </View>

                <View className="flex-col gap-2 pb-1">
                  <Text variant="caption" className="text-fg-muted">
                    {locale === "en" ? "Amount to pay" : "Jumlah yang dibayar"}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-2">
                    <Text variant="title-2" className="text-fg-muted">
                      {group.currency.symbol || group.currency.code || "Rp"}
                    </Text>
                    <TextInput
                      inputMode="decimal"
                      placeholder="0"
                      placeholderTextColor={fgMuted[scheme]}
                      value={formatNumberInput(settlementAmount)}
                      onChangeText={handleNumericChange}
                      className={cn(
                        "text-4xl font-grotesk-bold flex-1 min-w-0 p-0",
                        showError ? "text-negative-fg" : "text-fg-default",
                      )}
                    />
                  </View>
                  <View className="flex-row justify-between items-start mt-2">
                    <Text
                      variant="caption"
                      className={cn(
                        "text-negative-fg",
                        showError ? "opacity-100" : "opacity-0",
                      )}
                    >
                      {locale === "en"
                        ? "Amount exceeds needed settlement"
                        : "Jumlah melebihi tagihan pelunasan"}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSettlementAmount(
                          remainingForDebt(selectedDebt).toString(),
                        );
                        setShowError(false);
                      }}
                      className="shrink-0"
                    >
                      <Text className="text-[12px] text-fg-default font-grotesk-medium underline">
                        {locale === "en" ? "Pay in full" : "Bayar penuh"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
              <View
                className="p-4 border-t border-border-subtle bg-bg-base"
                style={{ paddingBottom: 16 + insets.bottom }}
              >
                <Button
                  variant="primary"
                  onPress={handleSubmit}
                  loading={isPending}
                  disabled={
                    isPending ||
                    isFetching ||
                    !(parseFloat(settlementAmount) > 0)
                  }
                >
                  {locale === "en" ? "Record payment" : "Catat pembayaran"}
                </Button>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </Modal>
    </View>
  );
}
