import { render, act } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import GlobalToasts from "@/components/GlobalToasts";
import { useToastStore } from "@/stores/toastStore";

// GlobalToasts reads useSafeAreaInsets(); provide deterministic metrics so the
// hook resolves synchronously without measuring.
const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderToasts() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <GlobalToasts />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

test("renders active toast message", async () => {
  const { getByText } = await renderToasts();
  jest.useFakeTimers();
  await act(async () => {
    useToastStore.getState().addToast("Saved!", "success");
  });
  expect(getByText("Saved!")).toBeTruthy();
  await act(async () => {
    jest.runAllTimers();
  });
  jest.useRealTimers();
});

test("renders multiple toasts colored by type", async () => {
  const { getByText } = await renderToasts();
  jest.useFakeTimers();
  await act(async () => {
    useToastStore.getState().addToast("Something broke", "error");
    useToastStore.getState().addToast("Just so you know", "info");
  });
  expect(getByText("Something broke")).toBeTruthy();
  expect(getByText("Just so you know")).toBeTruthy();
  await act(async () => {
    jest.runAllTimers();
  });
  jest.useRealTimers();
});
