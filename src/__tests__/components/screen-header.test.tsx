import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ScreenHeader from "@/components/ScreenHeader";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderHeader(onBack = jest.fn()) {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ScreenHeader title="Profile" onBack={onBack} />
    </SafeAreaProvider>,
  );
  return onBack;
}

test("renders the title", async () => {
  await renderHeader();
  expect(screen.getByText("Profile")).toBeTruthy();
});

test("calls onBack when the back button is pressed", async () => {
  const onBack = await renderHeader();
  fireEvent.press(screen.getByLabelText("Go back"));
  expect(onBack).toHaveBeenCalled();
});
