import { render, fireEvent, act } from "@testing-library/react-native";
import { ConfirmModal } from "@/components/ConfirmModal";

test("fires onConfirm when the confirm button is pressed", async () => {
  const onConfirm = jest.fn();
  const { getByText } = await act(async () =>
    render(
      <ConfirmModal
        isOpen
        title="Leave group?"
        confirmText="Leave"
        cancelText="Cancel"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    ),
  );
  await fireEvent.press(getByText("Leave"));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
