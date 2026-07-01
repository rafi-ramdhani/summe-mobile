import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Text from "@/components/Text";
import Avatar from "@/components/Avatar";
import { cn } from "@/lib/cn";
import { formatRelativeTime, formatMemberName } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import type { GroupDetail, GroupMember } from "@/lib/queries";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;

export function MembersTab({
  locale,
  group,
  userId,
  ownerId,
  onRevokeInvitation,
  onRemoveMember,
  onReplaceManaged,
  onRemoveManaged,
  onEditManaged,
  onCancelReplacement,
  isFetching,
}: {
  locale: Locale;
  group: GroupDetail;
  userId?: string;
  ownerId?: string;
  onRevokeInvitation: (invitation: { id: string; email: string }) => void;
  onRemoveMember?: (member: {
    id: string;
    name: string | null;
    email: string | null;
  }) => void;
  onReplaceManaged?: (member: GroupMember) => void;
  onRemoveManaged?: (member: GroupMember) => void;
  onEditManaged?: (member: GroupMember) => void;
  onCancelReplacement?: (replacement: { id: string }) => void;
  isFetching?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";
  const isOwner = ownerId === userId;
  const isActive = group.status !== "archived";

  return (
    <View className="flex-col">
      <View className="flex-col">
        {group.members
          .filter((member) => member.status !== "removed")
          .map((member, index) => {
            const isCurrentUser = member.id === userId;
            const memberName = formatMemberName(member, locale, isCurrentUser);
            const roleText =
              member.role === "owner"
                ? locale === "en"
                  ? "Owner"
                  : "Pemilik"
                : locale === "en"
                  ? "Member"
                  : "Anggota";

            // Check if there's a pending replacement for this managed member
            const pendingReplacement = member.isManaged
              ? group.replacements?.find((r) => r.managedMemberId === member.id)
              : undefined;

            return (
              <View
                key={member.id}
                className={cn(
                  "flex-row justify-between py-4 items-center gap-3",
                  index > 0 && "border-t border-border-subtle",
                )}
              >
                <View className="flex-row items-center gap-3 min-w-0 flex-1">
                  <Avatar name={member.name} email={member.email} />
                  <View className="flex-col gap-0.5 min-w-0 flex-1">
                    <View className="flex-row items-center gap-2 min-w-0">
                      <Text
                        variant="body-strong"
                        className="text-fg-default shrink"
                        numberOfLines={1}
                      >
                        {memberName}
                      </Text>
                      {member.isManaged && (
                        <View className="px-1.5 py-0.5 rounded bg-bg-subtle shrink-0">
                          <Text className="text-[10px] font-grotesk-bold uppercase text-fg-muted">
                            {locale === "en" ? "Managed" : "Dikelola"}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Replace / cancel-replacement as an underlined link under the name */}
                    {isOwner &&
                      isActive &&
                      member.isManaged &&
                      member.role !== "owner" &&
                      (pendingReplacement ? (
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs font-grotesk-bold text-fg-muted shrink-0">
                            {locale === "en" ? "Replacing" : "Sedang diganti"}
                          </Text>
                          <Pressable
                            onPress={() =>
                              onCancelReplacement &&
                              onCancelReplacement({ id: pendingReplacement.id })
                            }
                            disabled={isFetching}
                            className={cn(isFetching && "opacity-50")}
                          >
                            <Text className="text-fg-muted text-[10px] font-grotesk-medium underline">
                              {locale === "en"
                                ? "Cancel replacement"
                                : "Batalkan penggantian"}
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() =>
                            onReplaceManaged && onReplaceManaged(member)
                          }
                          disabled={isFetching}
                          className={cn(
                            "self-start",
                            isFetching && "opacity-50",
                          )}
                        >
                          <Text className="text-fg-muted text-[10px] font-grotesk-medium underline">
                            {locale === "en" ? "Replace" : "Ganti"}
                          </Text>
                        </Pressable>
                      ))}
                  </View>
                </View>
                <View className="flex-row items-center gap-2 shrink-0">
                  <Text variant="caption" className="text-fg-muted">
                    {roleText}
                  </Text>

                  {/* Managed edit name icon */}
                  {isOwner &&
                    isActive &&
                    member.isManaged &&
                    member.role !== "owner" && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          locale === "en"
                            ? "Edit managed member name"
                            : "Ubah nama anggota dikelola"
                        }
                        onPress={() => onEditManaged && onEditManaged(member)}
                        disabled={isFetching}
                        className={cn("pl-1", isFetching && "opacity-50")}
                      >
                        <Feather
                          name="edit-2"
                          size={16}
                          color={fgMuted[scheme]}
                        />
                      </Pressable>
                    )}

                  {/* Managed remove icon (hidden while a replacement is pending) */}
                  {isOwner &&
                    isActive &&
                    member.isManaged &&
                    member.role !== "owner" &&
                    !pendingReplacement && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          locale === "en"
                            ? "Remove managed member"
                            : "Hapus anggota dikelola"
                        }
                        onPress={() =>
                          onRemoveManaged && onRemoveManaged(member)
                        }
                        disabled={isFetching}
                        className={cn(isFetching && "opacity-50")}
                      >
                        <Feather name="x" size={20} color={fgMuted[scheme]} />
                      </Pressable>
                    )}

                  {/* Non-managed member remove (owner only, active group) */}
                  {isOwner &&
                    isActive &&
                    !member.isManaged &&
                    member.role !== "owner" && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          locale === "en" ? "Remove member" : "Hapus anggota"
                        }
                        onPress={() => onRemoveMember && onRemoveMember(member)}
                        disabled={isFetching}
                        className={cn(isFetching && "opacity-50")}
                      >
                        <Feather name="x" size={20} color={fgMuted[scheme]} />
                      </Pressable>
                    )}
                </View>
              </View>
            );
          })}
      </View>

      {isOwner &&
        isActive &&
        group.invitations &&
        group.invitations.length > 0 && (
          <View className="flex-col mt-8">
            <Text variant="caption" className="text-fg-muted mb-2">
              {locale === "en" ? "Pending Invitations" : "Undangan Tertunda"}
            </Text>
            <View className="flex-col">
              {group.invitations.map((invitation, index) => (
                <View
                  key={invitation.id}
                  className={cn(
                    "flex-row justify-between py-4 items-center gap-3",
                    index > 0 && "border-t border-border-subtle",
                  )}
                >
                  <View className="flex-col gap-1 min-w-0 flex-1">
                    <Text
                      variant="body-strong"
                      className="text-fg-default"
                      numberOfLines={1}
                    >
                      {invitation.email}
                    </Text>
                    <Text
                      variant="caption"
                      className="text-fg-muted"
                      numberOfLines={1}
                    >
                      {locale === "en" ? "Invited" : "Diundang"}{" "}
                      {formatRelativeTime(invitation.createdAt, locale)}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      locale === "en" ? "Revoke invitation" : "Cabut undangan"
                    }
                    onPress={() => onRevokeInvitation(invitation)}
                    disabled={isFetching}
                    className={cn("p-2", isFetching && "opacity-50")}
                  >
                    <Feather name="x" size={20} color={fgMuted[scheme]} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
    </View>
  );
}
