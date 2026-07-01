// summe-mobile port of summe-web/src/routes/{-$locale}/_unauthenticated/-intro/slides.tsx
// Lives under src/components/ (NOT src/app/): expo-router treats every file in
// app/ as a route and does not honor the `-` exclusion prefix that summe-web's
// TanStack Router uses. Copy is authoritative — every headline/subtext/mockup
// data string matches web verbatim.
import type { ReactNode } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "@/components/Text";
import Avatar from "@/components/Avatar";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";

export type Slide = {
  id: string;
  headline: string;
  subtext: string;
  Mockup: () => React.ReactElement;
};

// Exact fg-inverse hex from src/global.css (:root = light, .dark = dark).
const fgInverse = { light: "#fafaf9", dark: "#0c0c0d" } as const;

function Card({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-xl border border-border-default bg-bg-base p-4 shadow-sm">
      {children}
    </View>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-full bg-bg-subtle px-2 py-0.5">
      <Text variant="mono-caption" className="text-fg-muted">
        {children}
      </Text>
    </View>
  );
}

function SplitMockup({ en }: { en: boolean }) {
  // A group card (name + member count) over a single expense row with a payer
  // avatar and "split N ways" caption, mirroring the real group detail screen.
  return (
    <View className="w-full max-w-sm">
      <Card>
        <View className="flex-row items-center justify-between">
          <View>
            <Text variant="body-strong">Bali Trip 🌴</Text>
            <Text variant="caption" className="text-fg-muted">
              4 {en ? "members" : "anggota"}
            </Text>
          </View>
          <Chip>IDR</Chip>
        </View>
        <View className="my-3 border-t border-border-subtle" />
        <View className="flex-row items-center gap-3">
          <Avatar name="Rafi" className="size-9" />
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="body-strong" numberOfLines={1}>
                Dinner at Warung
              </Text>
              <Text variant="mono-data" className="shrink-0">
                320.000
              </Text>
            </View>
            <Text variant="caption" className="text-fg-muted">
              {en ? "Paid by Rafi · split 4 ways" : "Dibayar Rafi · bagi 4"}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const SPLIT_ITEMS: { name: string; amount: string; en: string; id: string }[] =
  [
    { name: "Pizza", amount: "120.000", en: "Equal", id: "Sama rata" },
    { name: "Drinks", amount: "45.000", en: "Shares", id: "Bagian" },
    { name: "Birthday cake", amount: "80.000", en: "Percent", id: "Persen" },
    { name: "Taxi home", amount: "60.000", en: "Exact", id: "Pasti" },
  ];

function ItemizedMockup({ en }: { en: boolean }) {
  // The expense item list with the real rounded-full split-kind pill, one row
  // per split kind (equal / shares / percent / exact).
  return (
    <View className="w-full max-w-sm">
      <Card>
        <View className="mb-1 flex-row items-center justify-between">
          <Text variant="body-strong">Groceries</Text>
          <Text variant="mono-data" className="text-fg-muted">
            305.000
          </Text>
        </View>
        <View className="flex-col">
          {SPLIT_ITEMS.map((item, i) => (
            <View
              key={item.name}
              className={cn(
                "flex-row items-center justify-between gap-3 py-2.5",
                i > 0 && "border-t border-dashed border-border-subtle",
              )}
            >
              <View className="flex-row min-w-0 items-center gap-2">
                <Text variant="body" numberOfLines={1}>
                  {item.name}
                </Text>
                <View className="shrink-0 rounded-full border border-border-subtle px-2 py-0.5">
                  <Text className="text-[10px] leading-[14px] uppercase tracking-wider text-fg-muted font-grotesk-medium">
                    {en ? item.en : item.id}
                  </Text>
                </View>
              </View>
              <Text variant="mono-data" className="shrink-0">
                {item.amount}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const RECEIPT_ITEMS: [string, string][] = [
  ["Nasi Goreng", "38.000"],
  ["Sate Ayam", "45.000"],
  ["Es Jeruk", "12.000"],
];

function ReceiptScanMockup() {
  // A tilted paper receipt (mono type, dashed rules) framed by camera
  // viewfinder brackets with a shutter badge, to read instantly as "scan a
  // receipt and Summe reads the lines for you".
  const { colorScheme } = useColorScheme();
  const iconColor = fgInverse[colorScheme ?? "light"];

  return (
    <View className="relative mx-auto w-full max-w-[240px]">
      <View className="absolute -left-2 -top-2 size-5 rounded-tl border-l-2 border-t-2 border-fg-default" />
      <View className="absolute -right-2 -top-2 size-5 rounded-tr border-r-2 border-t-2 border-fg-default" />
      <View className="absolute -bottom-2 -left-2 size-5 rounded-bl border-b-2 border-l-2 border-fg-default" />
      <View className="absolute -bottom-2 -right-2 size-5 rounded-br border-b-2 border-r-2 border-fg-default" />

      <View
        className="rounded-md border border-border-default bg-bg-base px-4 py-3 shadow-sm"
        style={{ transform: [{ rotate: "-2deg" }] }}
      >
        <Text variant="mono-data-strong" className="text-center">
          WARUNG SARI
        </Text>
        <View className="my-2 border-t border-dashed border-border-default" />
        <View className="flex-col gap-1.5">
          {RECEIPT_ITEMS.map(([item, price]) => (
            <View key={item} className="flex-row justify-between gap-3">
              <Text variant="mono-caption" className="text-fg-muted">
                {item}
              </Text>
              <Text variant="mono-caption" className="text-fg-default">
                {price}
              </Text>
            </View>
          ))}
        </View>
        <View className="my-2 border-t border-dashed border-border-default" />
        <View className="flex-row justify-between gap-3">
          <Text variant="mono-caption" className="text-fg-default">
            TOTAL
          </Text>
          <Text variant="mono-data-strong">95.000</Text>
        </View>
      </View>

      <View className="absolute -bottom-3 -right-3 size-10 flex-row items-center justify-center rounded-full bg-fg-default shadow-md">
        <Ionicons name="camera" size={18} color={iconColor} />
      </View>
    </View>
  );
}

function MemberRow({
  name,
  role,
  note,
  managed,
  managedLabel,
  divider,
}: {
  name: string;
  role: string;
  note?: string;
  managed?: boolean;
  managedLabel: string;
  divider?: boolean;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center justify-between gap-3 py-3",
        divider && "border-t border-border-subtle",
      )}
    >
      <View className="flex-row min-w-0 items-center gap-3">
        <Avatar name={name} className="size-9" />
        <View className="min-w-0 flex-col gap-0.5">
          <View className="flex-row min-w-0 items-center gap-2">
            <Text variant="body-strong" numberOfLines={1}>
              {name}
            </Text>
            {managed && (
              <View className="shrink-0 rounded bg-bg-subtle px-1.5 py-0.5">
                <Text className="text-[10px] leading-[14px] uppercase text-fg-muted font-grotesk-bold">
                  {managedLabel}
                </Text>
              </View>
            )}
          </View>
          {note && (
            <Text variant="caption" className="text-fg-muted">
              {note}
            </Text>
          )}
        </View>
      </View>
      <Text variant="caption" className="shrink-0 text-fg-muted">
        {role}
      </Text>
    </View>
  );
}

function ManagedMembersMockup({ en }: { en: boolean }) {
  // Mirrors the real group Members tab: avatars, owner/member roles, and a
  // "Managed" badge on the account-less member to show you can add anyone.
  const owner = en ? "Owner" : "Pemilik";
  const member = en ? "Member" : "Anggota";
  const managedLabel = en ? "Managed" : "Dikelola";
  return (
    <View className="w-full max-w-sm">
      <Card>
        <View className="mb-1 flex-row items-center justify-between">
          <Text variant="body-strong">{en ? "Members" : "Anggota"}</Text>
          <Chip>{en ? "3 people" : "3 orang"}</Chip>
        </View>
        <View className="flex-col">
          <MemberRow
            name="Rafi"
            role={owner}
            note={en ? "You" : "Kamu"}
            managedLabel={managedLabel}
          />
          <MemberRow
            name="Nessa"
            role={member}
            managedLabel={managedLabel}
            divider
          />
          <MemberRow
            name="Abins"
            role={member}
            note={en ? "No account yet" : "Belum punya akun"}
            managed
            managedLabel={managedLabel}
            divider
          />
        </View>
      </Card>
    </View>
  );
}

function BalanceRow({
  name,
  sub,
  amount,
  tone,
  divider,
}: {
  name: string;
  sub: string;
  amount: string;
  tone: "pos" | "neg";
  divider?: boolean;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center justify-between gap-3 py-3",
        divider && "border-t border-border-subtle",
      )}
    >
      <View className="flex-row min-w-0 items-center gap-3">
        <Avatar name={name} className="size-9" />
        <View className="min-w-0">
          <Text variant="body-strong" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" className="text-fg-muted">
            {sub}
          </Text>
        </View>
      </View>
      <Text
        variant="mono-data-strong"
        className={cn(
          "shrink-0",
          tone === "neg" ? "text-negative-fg" : "text-positive-fg",
        )}
      >
        {amount}
      </Text>
    </View>
  );
}

function BalancesMockup({ en }: { en: boolean }) {
  // The group Balances tab: each member with an avatar and a net amount, green
  // when they owe you and red when you owe them.
  return (
    <View className="w-full max-w-sm">
      <Card>
        <Text
          variant="caption"
          className="mb-1 uppercase tracking-wider text-fg-muted"
        >
          {en ? "Balances" : "Saldo"}
        </Text>
        <View className="flex-col">
          <BalanceRow
            name="Nessa"
            sub={en ? "You owe" : "Kamu berutang"}
            amount="-50.000"
            tone="neg"
          />
          <BalanceRow
            name="Abins"
            sub={en ? "Owes you" : "Berutang ke kamu"}
            amount="+25.000"
            tone="pos"
            divider
          />
        </View>
      </Card>
    </View>
  );
}

export function getSlides(locale: Locale): Slide[] {
  const en = locale === "en";
  return [
    {
      id: "split",
      headline: en ? "Split group expenses" : "Bagi pengeluaran grup",
      subtext: en
        ? "Create a group, add expenses, and split the bill in seconds."
        : "Buat grup, tambah pengeluaran, dan bagi tagihan dalam hitungan detik.",
      Mockup: () => <SplitMockup en={en} />,
    },
    {
      id: "itemized",
      headline: en ? "Itemized splits, your way" : "Bagi per item, sesukamu",
      subtext: en
        ? "Split each item differently: equally, by shares, percent, or exact."
        : "Bagi tiap item dengan cara berbeda: rata, per bagian, persen, atau pas.",
      Mockup: () => <ItemizedMockup en={en} />,
    },
    {
      id: "scan",
      headline: en ? "Scan receipts in a snap" : "Pindai struk dengan cepat",
      subtext: en
        ? "Photograph a receipt and Summe fills in the items and prices."
        : "Foto struk dan Summe mengisi item serta harganya otomatis.",
      Mockup: ReceiptScanMockup,
    },
    {
      id: "managed",
      headline: en
        ? "Add anyone, account or not"
        : "Tambah siapa saja, punya akun atau tidak",
      subtext: en
        ? "Create managed members for friends who aren't on Summe yet, and cover their share."
        : "Buat anggota terkelola untuk teman yang belum pakai Summe, dan atur bagiannya.",
      Mockup: () => <ManagedMembersMockup en={en} />,
    },
    {
      id: "balances",
      headline: en ? "See who owes whom" : "Lihat siapa berutang ke siapa",
      subtext: en
        ? "Summe nets everything out so nobody does the math."
        : "Summe menghitung otomatis agar tak ada yang pusing berhitung.",
      Mockup: () => <BalancesMockup en={en} />,
    },
  ];
}
