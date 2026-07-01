import { render } from "@testing-library/react-native";
import { CopilotProvider } from "react-native-copilot";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

test("shows the no-groups headline and create button", async () => {
  const { getByText } = await render(
    <CopilotProvider>
      <DashboardEmptyState hasInvitations={false} isLoadingInvitations={false} />
    </CopilotProvider>,
  );
  expect(getByText("No groups yet.")).toBeTruthy();
  expect(getByText("Create a group")).toBeTruthy();
});
