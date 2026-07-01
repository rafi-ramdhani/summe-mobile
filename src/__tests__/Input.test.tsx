import { render, fireEvent } from "@testing-library/react-native";
import Input from "@/components/Input";

test("shows label and error, edits value", async () => {
  const onChangeText = jest.fn();
  const { getByText, getByPlaceholderText } = await render(
    <Input
      label="Email"
      placeholder="you@email.com"
      error="Bad"
      value=""
      onChangeText={onChangeText}
    />
  );
  expect(getByText("Email")).toBeTruthy();
  expect(getByText("Bad")).toBeTruthy();
  await fireEvent.changeText(getByPlaceholderText("you@email.com"), "x");
  expect(onChangeText).toHaveBeenCalledWith("x");
});

test("shows helperText when no error", async () => {
  const { getByText, queryByText } = await render(
    <Input
      label="Email"
      placeholder="you@email.com"
      helperText="We'll never share it"
      value=""
      onChangeText={jest.fn()}
    />
  );
  expect(getByText("We'll never share it")).toBeTruthy();
  expect(queryByText("Bad")).toBeNull();
});

test("error takes precedence over helperText", async () => {
  const { getByText, queryByText } = await render(
    <Input
      error="Bad"
      helperText="Helper"
      value=""
      onChangeText={jest.fn()}
    />
  );
  expect(getByText("Bad")).toBeTruthy();
  expect(queryByText("Helper")).toBeNull();
});

test("password field reveals and hides text via toggle", async () => {
  const { getByPlaceholderText, getByLabelText } = await render(
    <Input
      placeholder="Password"
      secureTextEntry
      value="secret"
      onChangeText={jest.fn()}
    />
  );
  expect(getByPlaceholderText("Password").props.secureTextEntry).toBe(true);

  await fireEvent.press(getByLabelText("Show password"));
  expect(getByPlaceholderText("Password").props.secureTextEntry).toBe(false);

  await fireEvent.press(getByLabelText("Hide password"));
  expect(getByPlaceholderText("Password").props.secureTextEntry).toBe(true);
});
