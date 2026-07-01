import { useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "@/components/Text";
import Button from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useLocale } from "@/lib/i18n";
import { comingSoon } from "@/lib/comingSoon";
import { generateUUID } from "@/lib/api";
import {
  useAcceptInvitation,
  useRejectInvitation,
  type Invitation,
} from "@/lib/queries";

const fgDefault = { light: "#27272a", dark: "#e4e4e7" } as const;

export function DashboardInvitations({
  invitations,
}: {
  invitations: Invitation[];
}) {
  const locale = useLocale();
  const { colorScheme } = useColorScheme();
  const accept = useAcceptInvitation();
  const reject = useRejectInvitation();

  const [acceptKey, setAcceptKey] = useState(() => generateUUID());
  const [rejectKey, setRejectKey] = useState(() => generateUUID());
  const [confirmAction, setConfirmAction] = useState<
    "accept" | "reject" | null
  >(null);

  if (invitations.length === 1) {
    const inv = invitations[0];
    const isPending =
      confirmAction === "accept" ? accept.isPending : reject.isPending;

    const handleConfirm = () => {
      if (confirmAction === "accept") {
        accept.mutate(
          { invitationId: inv.id, idempotencyKey: acceptKey },
          {
            onSettled: () => {
              setAcceptKey(generateUUID());
              setConfirmAction(null);
            },
          },
        );
      } else if (confirmAction === "reject") {
        reject.mutate(
          { invitationId: inv.id, idempotencyKey: rejectKey },
          {
            onSettled: () => {
              setRejectKey(generateUUID());
              setConfirmAction(null);
            },
          },
        );
      }
    };

    return (
      <View className="bg-bg-subtle p-4 pb-6 mb-8 border-b border-border-subtle">
        <Text variant="body-strong" className="mb-1">
          {locale === "en"
            ? "You have 1 pending invitation"
            : "Anda memiliki 1 undangan tertunda"}
        </Text>
        <Text variant="body" className="text-fg-muted mb-4">
          <Text variant="body" className="text-fg-default">
            {inv.inviterName}
          </Text>
          {locale === "en" ? " invited you to " : " mengundang Anda ke "}
          <Text variant="body" className="text-fg-default">
            {inv.name}
          </Text>
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button variant="primary" onPress={() => setConfirmAction("accept")}>
              {locale === "en" ? "Accept" : "Terima"}
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              onPress={() => setConfirmAction("reject")}
            >
              {locale === "en" ? "Decline" : "Tolak"}
            </Button>
          </View>
        </View>

        <ConfirmModal
          isOpen={confirmAction !== null}
          title={
            locale === "en"
              ? confirmAction === "accept"
                ? "Accept invitation?"
                : "Decline invitation?"
              : confirmAction === "accept"
                ? "Terima undangan?"
                : "Tolak undangan?"
          }
          description={
            locale === "en"
              ? confirmAction === "accept"
                ? `You will join ${inv.name}.`
                : `Are you sure you want to decline the invitation to ${inv.name}?`
              : confirmAction === "accept"
                ? `Anda akan bergabung dengan ${inv.name}.`
                : `Apakah Anda yakin ingin menolak undangan ke ${inv.name}?`
          }
          confirmText={
            locale === "en"
              ? confirmAction === "accept"
                ? "Accept"
                : "Decline"
              : confirmAction === "accept"
                ? "Terima"
                : "Tolak"
          }
          cancelText={locale === "en" ? "Cancel" : "Batal"}
          confirmVariant={confirmAction === "accept" ? "primary" : "negative"}
          loading={isPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      </View>
    );
  }

  // TODO(next-pass): "Review" navigates to /invitations when that screen exists.
  return (
    <View className="mb-8 px-4 py-4 bg-bg-subtle border-b border-border-subtle flex-row items-center justify-between">
      <Text variant="body">
        {locale === "en"
          ? `You have ${invitations.length} pending invitations`
          : `Anda memiliki ${invitations.length} undangan tertunda`}
      </Text>
      <Pressable
        onPress={() => comingSoon(locale)}
        accessibilityRole="button"
        className="flex-row items-center gap-1"
      >
        <Text variant="body-strong">
          {locale === "en" ? "Review" : "Tinjau"}
        </Text>
        <Feather
          name="arrow-right"
          size={16}
          color={fgDefault[colorScheme ?? "light"]}
        />
      </Pressable>
    </View>
  );
}
