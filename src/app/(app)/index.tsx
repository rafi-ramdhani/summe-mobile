import { SafeAreaView } from "react-native-safe-area-context";
import Text from "@/components/Text";
import Button from "@/components/Button";
import { logout } from "@/lib/auth";

export default function AppHome() {
  return (
    <SafeAreaView className="flex-1 bg-bg-base items-center justify-center gap-6 px-5">
      <Text variant="title-2">You&apos;re in.</Text>
      <Button onPress={() => logout()}>Log out</Button>
    </SafeAreaView>
  );
}
