import { render } from "@testing-library/react-native";
import Text from "@/components/Text";

test("renders children", async () => {
  const { getByText } = await render(<Text>Hello</Text>);
  expect(getByText("Hello")).toBeTruthy();
});
