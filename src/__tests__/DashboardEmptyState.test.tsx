import { render } from "@testing-library/react-native";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

test("shows the no-groups headline and create button", async () => {
  const { getByText } = await render(
    <DashboardEmptyState hasInvitations={false} isLoadingInvitations={false} />,
  );
  expect(getByText("No groups yet.")).toBeTruthy();
  expect(getByText("Create a group")).toBeTruthy();
});
