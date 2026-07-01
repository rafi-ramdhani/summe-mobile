import { render, fireEvent } from "@testing-library/react-native";
import Button from "@/components/Button";

test("fires onPress when enabled", async () => {
  const onPress = jest.fn();
  const { getByText } = await render(<Button onPress={onPress}>Go</Button>);
  fireEvent.press(getByText("Go"));
  expect(onPress).toHaveBeenCalled();
});

test("does not fire when loading", async () => {
  const onPress = jest.fn();
  const { queryByText, getByRole } = await render(
    <Button loading onPress={onPress}>
      Go
    </Button>
  );
  expect(queryByText("Go")).toBeNull(); // spinner shown instead
  fireEvent.press(getByRole("button"));
  expect(onPress).not.toHaveBeenCalled();
});

test("does not fire when disabled", async () => {
  const onPress = jest.fn();
  const { getByRole } = await render(
    <Button disabled onPress={onPress}>
      Go
    </Button>
  );
  fireEvent.press(getByRole("button"));
  expect(onPress).not.toHaveBeenCalled();
});
