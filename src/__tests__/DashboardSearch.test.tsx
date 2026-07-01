jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { render, fireEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";

test("typing calls onChangeText and clear resets it", async () => {
  const onChangeText = jest.fn();
  const { getByPlaceholderText, getByLabelText } = await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <DashboardSearch
        value="bali"
        onChangeText={onChangeText}
        showSortIcon={false}
        sortBy="latest"
        onSortChange={() => {}}
        placeholder="Search groups..."
      />
    </SafeAreaProvider>,
  );
  await fireEvent.changeText(getByPlaceholderText("Search groups..."), "trip");
  expect(onChangeText).toHaveBeenCalledWith("trip");
  await fireEvent.press(getByLabelText("Clear search"));
  expect(onChangeText).toHaveBeenCalledWith("");
});
