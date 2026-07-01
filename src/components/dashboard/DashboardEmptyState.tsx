import { View } from "react-native";
import Text from "@/components/Text";
import Button from "@/components/Button";
import { useLocale } from "@/lib/i18n";
import { comingSoon } from "@/lib/comingSoon";

export function DashboardEmptyState({
  hasInvitations,
  isLoadingInvitations,
}: {
  hasInvitations: boolean;
  isLoadingInvitations: boolean;
}) {
  const locale = useLocale();

  // TODO(next-pass): navigate to /groups/create when the create screen exists.
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-full max-w-[320px] items-center">
        <Text variant="title-1" className="mb-4 text-center">
          {locale === "en" ? "No groups yet." : "Belum ada grup."}
        </Text>
        <Text variant="body" className="text-fg-muted mb-8 text-center">
          {!hasInvitations && !isLoadingInvitations
            ? locale === "en"
              ? "Start a group for your next trip, dinner, or house. Invite people by email, and they'll approve before joining."
              : "Buat grup untuk liburan, makan malam, atau rumah Anda. Undang teman melalui email, dan mereka harus menyetujuinya sebelum bergabung."
            : locale === "en"
              ? "Accept an invitation above, or create a group of your own."
              : "Terima undangan di atas, atau buat grup Anda sendiri."}
        </Text>
        <View className="w-full">
          <Button onPress={() => comingSoon(locale)}>
            {locale === "en" ? "Create a group" : "Buat grup"}
          </Button>
        </View>
      </View>
    </View>
  );
}
