import { render, act } from "@testing-library/react-native";
import GlobalToasts from "@/components/GlobalToasts";
import { useToastStore } from "@/stores/toastStore";

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

test("renders active toast message", async () => {
  const { getByText } = await render(<GlobalToasts />);
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
  const { getByText } = await render(<GlobalToasts />);
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
