import { View } from "react-native";

function Row() {
  return (
    <View className="py-4 flex-row items-center justify-between border-t border-border-subtle">
      <View className="flex-col gap-2">
        <View className="h-4 w-40 rounded-sm bg-bg-subtle" />
        <View className="h-3 w-24 rounded-sm bg-bg-subtle" />
      </View>
      <View className="h-4 w-16 rounded-sm bg-bg-subtle" />
    </View>
  );
}

export function GroupListSkeleton() {
  return (
    <View className="flex-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <Row key={i} />
      ))}
    </View>
  );
}
