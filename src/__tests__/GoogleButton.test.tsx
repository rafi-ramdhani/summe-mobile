jest.mock("expo-auth-session/providers/google", () => ({
  useIdTokenAuthRequest: () => [null, null, jest.fn()],
}));
jest.mock("@/lib/config", () => ({
  env: { GOOGLE_IOS_CLIENT_ID: undefined, GOOGLE_ANDROID_CLIENT_ID: undefined, GOOGLE_WEB_CLIENT_ID: undefined },
  STORAGE_KEYS: { locale: "summe.locale" },
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { render } from "@testing-library/react-native";
import GoogleButton from "@/components/GoogleButton";

test("hides itself when unconfigured", async () => {
  const { toJSON } = await render(<GoogleButton />);
  expect(toJSON()).toBeNull();
});
