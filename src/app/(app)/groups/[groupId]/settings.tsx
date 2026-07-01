/* eslint-disable react-hooks/set-state-in-effect -- hydrate form state from the fetched group, mirroring summe-web */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import Text from "@/components/Text";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { CurrencySelectModal } from "@/components/CurrencySelectModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { cn } from "@/lib/cn";
import { generateUUID } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { useAuthStore } from "@/stores/authStore";
import {
  useGroupDetail,
  useUpdateGroup,
  useCurrencies,
  useDeleteGroup,
} from "@/lib/queries";

// Exact hex values from src/global.css (:root = light, .dark = dark).
const fgMuted = { light: "#73736f", dark: "#8a8a8f" } as const;

function SettingsSkeleton() {
  return (
    <View className="flex-1 px-4 py-6 flex-col gap-6">
      <View className="flex-col gap-6">
        <View className="flex-col gap-2">
          <View className="w-24 h-4 rounded-sm bg-bg-subtle-emphasized" />
          <View className="w-full h-8 rounded-sm bg-bg-subtle-emphasized" />
        </View>
        <View className="flex-col gap-2">
          <View className="w-24 h-4 rounded-sm bg-bg-subtle-emphasized" />
          <View className="w-full h-8 rounded-sm bg-bg-subtle-emphasized" />
        </View>
      </View>
      <View className="flex-col mt-4 gap-6">
        <View className="flex-col gap-2">
          <View className="w-32 h-6 rounded-sm bg-bg-subtle-emphasized" />
          <View className="w-64 h-4 rounded-sm bg-bg-subtle-emphasized" />
        </View>
        <View className="w-full h-12 rounded-md bg-bg-subtle-emphasized" />
      </View>
    </View>
  );
}

export default function GroupSettingsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const locale = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? "light";

  const { data: groupRes, isLoading, isFetching } = useGroupDetail(groupId);
  const { data: currenciesResponse } = useCurrencies();
  const updateGroup = useUpdateGroup(groupId);
  const deleteGroup = useDeleteGroup();

  const user = useAuthStore((s) => s.session?.user);

  const group = groupRes?.data;
  const currencies = currenciesResponse?.data || [];

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [showErrors, setShowErrors] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setCurrency(group.currency?.code || "IDR");
    }
  }, [group]);

  const currentMember = group?.members.find((m) => m.id === user?.id);
  const isOwner = currentMember?.role === "owner";

  const title = locale === "en" ? "Group Settings" : "Pengaturan Grup";

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader
          title={title}
          onBack={() => router.back()}
          isFetching={isFetching}
        />
        <SettingsSkeleton />
      </View>
    );
  }

  if (!isOwner) {
    return (
      <View className="flex-1 bg-bg-base">
        <ScreenHeader title={title} onBack={() => router.back()} />
        <View className="flex-1 p-4 items-center justify-center">
          <Text className="text-center">
            You are not authorized to view this page.
          </Text>
          <Pressable onPress={() => router.back()} className="mt-2">
            <Text className="underline">Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleUpdate = () => {
    if (!name.trim() || !currency) {
      setShowErrors(true);
      return;
    }

    updateGroup.mutate(
      {
        data: { name: name.trim(), currency },
        idempotencyKey: generateUUID(),
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  };

  const handleArchiveToggle = () => {
    updateGroup.mutate(
      {
        data: { status: group?.status === "archived" ? "active" : "archived" },
        idempotencyKey: generateUUID(),
      },
      {
        onSuccess: () => {
          setIsArchiveModalOpen(false);
        },
      },
    );
  };

  const handleDelete = () => {
    deleteGroup.mutate(
      {
        groupId,
        confirmationName: deleteConfirmationName,
        idempotencyKey: generateUUID(),
      },
      {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          router.replace("/(app)");
        },
      },
    );
  };

  const hasChanges =
    name.trim() !== group?.name ||
    currency !== (group?.currency?.code || "IDR");

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
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-col gap-6">
          <View className="flex-col gap-1">
            <Text variant="caption" className="text-fg-default">
              {locale === "en" ? "Group name" : "Nama grup"}
            </Text>
            <Input
              variant="underline"
              placeholder={
                locale === "en" ? "e.g. Bali Trip" : "mis. Liburan ke Bali"
              }
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (value.trim()) setShowErrors(false);
              }}
              error={
                showErrors && !name.trim()
                  ? locale === "en"
                    ? "Group name is required"
                    : "Nama grup wajib diisi"
                  : undefined
              }
            />
          </View>

          <View className="flex-col gap-1 pb-1">
            <Text variant="caption" className="text-fg-default">
              {locale === "en" ? "Currency" : "Mata uang"}
            </Text>
            <Pressable
              onPress={() => setIsCurrencyModalOpen(true)}
              className="flex-row items-center justify-between border-b border-border-subtle py-2"
            >
              <Text variant="body" className="text-fg-default">
                {currency}{" "}
                {currencies.find((c) => c.code === currency)?.symbol
                  ? `(${currencies.find((c) => c.code === currency)?.symbol})`
                  : ""}
              </Text>
              <Feather name="chevron-down" size={20} color={fgMuted[scheme]} />
            </Pressable>
            <Text
              variant="caption"
              className={cn(
                "text-negative-fg",
                showErrors && !currency ? "opacity-100" : "opacity-0",
              )}
            >
              {locale === "en"
                ? "Currency is required"
                : "Mata uang wajib dipilih"}
            </Text>
          </View>
        </View>

        <View className="flex-col mt-4 gap-6">
          <View className="flex-col gap-2">
            <Text variant="title-2" className="text-negative-fg">
              {locale === "en" ? "Danger Zone" : "Zona Bahaya"}
            </Text>
            <Text variant="body" className="text-fg-muted">
              {locale === "en"
                ? "Archiving will lock the group and make it read-only."
                : "Mengarsipkan akan mengunci grup dan menjadikannya hanya baca."}
            </Text>
          </View>

          <View className="flex-col gap-4">
            <Button
              variant="secondary"
              onPress={() => setIsArchiveModalOpen(true)}
              disabled={isFetching || updateGroup.isPending}
            >
              {group?.status === "archived"
                ? locale === "en"
                  ? "Unarchive group"
                  : "Batal arsipkan grup"
                : locale === "en"
                  ? "Archive group"
                  : "Arsipkan grup"}
            </Button>

            <Button
              variant="negative"
              onPress={() => setIsDeleteModalOpen(true)}
              disabled={isFetching || deleteGroup.isPending}
            >
              {locale === "en" ? "Delete group" : "Hapus grup"}
            </Button>
          </View>
        </View>
      </ScrollView>

      {hasChanges && (
        <View
          className="p-4 border-t border-border-subtle bg-bg-base"
          style={{ paddingBottom: 16 + insets.bottom }}
        >
          <Button
            variant="primary"
            onPress={handleUpdate}
            loading={updateGroup.isPending}
            disabled={updateGroup.isPending || isFetching}
          >
            {locale === "en" ? "Save Changes" : "Simpan Perubahan"}
          </Button>
        </View>
      )}

      <CurrencySelectModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        selectedCurrency={currency}
        onSelectCurrency={(code) => {
          setCurrency(code);
          setIsCurrencyModalOpen(false);
          setShowErrors(false);
        }}
      />
      <ConfirmModal
        isOpen={isArchiveModalOpen}
        title={
          group?.status === "archived"
            ? locale === "en"
              ? "Unarchive group?"
              : "Batal arsipkan grup?"
            : locale === "en"
              ? "Archive group?"
              : "Arsipkan grup?"
        }
        description={
          group?.status === "archived"
            ? locale === "en"
              ? "This will unlock the group and allow members to add expenses again."
              : "Ini akan membuka kunci grup dan memungkinkan anggota menambah pengeluaran lagi."
            : locale === "en"
              ? "This will lock the group. Members will not be able to add new expenses or settle up."
              : "Ini akan mengunci grup. Anggota tidak akan dapat menambah pengeluaran baru atau melunasi."
        }
        confirmText={
          group?.status === "archived"
            ? locale === "en"
              ? "Unarchive"
              : "Batal Arsip"
            : locale === "en"
              ? "Archive"
              : "Arsipkan"
        }
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        onConfirm={handleArchiveToggle}
        onCancel={() => setIsArchiveModalOpen(false)}
        loading={isFetching || updateGroup.isPending}
        confirmVariant="primary"
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={locale === "en" ? "Delete group?" : "Hapus grup?"}
        description={
          <View className="flex-col gap-2">
            <Text variant="body" className="text-fg-muted">
              {locale === "en"
                ? "This action cannot be undone. All expenses, members, and history will be permanently removed."
                : "Tindakan ini tidak dapat dibatalkan. Semua pengeluaran, anggota, dan riwayat akan dihapus permanen."}
            </Text>
            <View className="flex-col gap-2 mt-2">
              <Text variant="body" className="text-fg-default font-grotesk-medium">
                {locale === "en"
                  ? `Please type "${group?.name}" to confirm.`
                  : `Silakan ketik "${group?.name}" untuk konfirmasi.`}
              </Text>
              <Input
                value={deleteConfirmationName}
                onChangeText={setDeleteConfirmationName}
                placeholder={group?.name}
              />
            </View>
          </View>
        }
        confirmText={locale === "en" ? "Delete" : "Hapus"}
        cancelText={locale === "en" ? "Cancel" : "Batal"}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        loading={deleteGroup.isPending}
        confirmVariant="negative"
        confirmDisabled={deleteConfirmationName !== group?.name}
      />
    </View>
  );
}
