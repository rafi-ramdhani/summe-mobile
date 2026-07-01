import { render, fireEvent } from "@testing-library/react-native";
import DashboardTabs from "@/components/dashboard/DashboardTabs";

test("calls onChange with the tapped tab id", async () => {
  const onChange = jest.fn();
  const { getByText } = await render(
    <DashboardTabs
      tabs={[
        { id: "active", label: "Active" },
        { id: "archived", label: "Archived" },
      ]}
      activeId="active"
      onChange={onChange}
    />,
  );
  await fireEvent.press(getByText("Archived"));
  expect(onChange).toHaveBeenCalledWith("archived");
});
