import { useState } from "react";
import { Pressable, View } from "react-native";
import Text from "@/components/Text";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useLocale } from "@/lib/i18n";
import { comingSoon } from "@/lib/comingSoon";
import { useUpdateOnboarding } from "@/lib/queries";
import {
  checklistSteps,
  isChecklistComplete,
  type ChecklistKey,
  type OnboardingData,
} from "@/lib/onboarding";

const LABELS: Record<ChecklistKey, { id: string; en: string }> = {
  createdGroup: { id: "Buat grup pertama", en: "Create your first group" },
  addedExpense: { id: "Tambah pengeluaran", en: "Add an expense" },
  invitedMember: { id: "Undang anggota", en: "Invite a member" },
};

function StepCheckbox({ done }: { done: boolean }) {
  return (
    <View
      className={
        done
          ? "size-4 rounded-full bg-positive-bg items-center justify-center"
          : "size-4 rounded-full border border-border-strong"
      }
    >
      {done ? (
        <Text variant="caption" className="text-positive-fg text-[10px] leading-none">
          ✓
        </Text>
      ) : null}
    </View>
  );
}

export function GettingStartedChecklist({
  onboarding,
  onReplayTour,
}: {
  onboarding: OnboardingData;
  onReplayTour: () => void;
}) {
  const locale = useLocale();
  const update = useUpdateOnboarding();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { items, doneCount } = checklistSteps(onboarding);
  const complete = isChecklistComplete(onboarding);
  const nextKey = items.find((i) => !i.done)?.key;

  const dismiss = () => update.mutate({ checklistDismissed: true });

  return (
    <View className="rounded-md border border-border-default bg-bg-raised p-3 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text variant="label" className="text-fg-strong">
          {locale === "id" ? "Mulai" : "Get started"}
        </Text>
        <View className="flex-row items-center gap-3">
          <Text variant="caption" className="text-fg-muted">
            {doneCount} / 3
          </Text>
          <Pressable
            onPress={() => setConfirmOpen(true)}
            disabled={update.isPending}
            accessibilityRole="button"
            accessibilityLabel={locale === "id" ? "Tutup" : "Dismiss"}
          >
            <Text variant="body" className="text-fg-muted">
              ×
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-col gap-1.5">
        {items.map(({ key, done }) => (
          <Pressable
            key={key}
            onPress={() => comingSoon(locale)}
            className="flex-row items-center gap-2.5"
          >
            <StepCheckbox done={done} />
            <Text
              variant={key === nextKey ? "body-strong" : "body"}
              className={
                done
                  ? "text-fg-muted line-through"
                  : key === nextKey
                    ? "text-fg-strong"
                    : "text-fg-default"
              }
            >
              {LABELS[key][locale === "id" ? "id" : "en"]}
            </Text>
          </Pressable>
        ))}
      </View>

      {complete && (
        <Text variant="body-strong" className="text-fg-strong mt-3">
          {locale === "id" ? "Semua beres! 🎉" : "You're all set! 🎉"}
        </Text>
      )}

      <Pressable onPress={onReplayTour} className="mt-2 self-start">
        <Text variant="caption" className="text-fg-muted underline">
          {locale === "id" ? "Putar ulang tur" : "Replay tour"}
        </Text>
      </Pressable>

      <ConfirmModal
        isOpen={confirmOpen}
        title={
          locale === "id" ? "Sembunyikan daftar ini?" : "Hide this checklist?"
        }
        description={
          locale === "id"
            ? "Daftar 'Mulai' tidak akan muncul lagi. Kamu tetap bisa memutar ulang tur nanti."
            : "The getting-started checklist won't come back. You can still replay the tour later."
        }
        confirmText={locale === "id" ? "Sembunyikan" : "Hide"}
        cancelText={locale === "id" ? "Batal" : "Cancel"}
        confirmVariant="negative"
        loading={update.isPending}
        onConfirm={() => {
          dismiss();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}
