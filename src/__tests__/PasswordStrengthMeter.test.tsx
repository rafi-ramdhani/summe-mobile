import { render, waitFor } from "@testing-library/react-native";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

test("renders a strength label for a password", async () => {
  const { getByText } = await render(
    <PasswordStrengthMeter password="Tr0ub4dour&3xtra" onScoreChange={() => {}} locale="en" />,
  );
  await waitFor(() => expect(getByText(/strong/i)).toBeTruthy());
});

test("renders nothing for empty password", async () => {
  const { toJSON } = await render(
    <PasswordStrengthMeter password="" onScoreChange={() => {}} locale="en" />,
  );
  expect(toJSON()).toBeNull();
});
