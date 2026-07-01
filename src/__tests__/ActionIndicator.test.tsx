import { render } from "@testing-library/react-native";
import { ActionIndicator } from "@/components/ActionIndicator";

test("renders the count when positive", async () => {
  const { getByText } = await render(<ActionIndicator count={3} />);
  expect(getByText("3")).toBeTruthy();
});

test("renders nothing when count is zero", async () => {
  const { toJSON } = await render(<ActionIndicator count={0} />);
  expect(toJSON()).toBeNull();
});
