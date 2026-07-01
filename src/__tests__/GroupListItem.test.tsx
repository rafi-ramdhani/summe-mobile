jest.mock("@/lib/i18n", () => ({
  useLocale: () => "en",
}));

import { render } from "@testing-library/react-native";
import { GroupListItem } from "@/components/dashboard/GroupListItem";
import type { Group } from "@/lib/queries";

const group: Group = {
  id: "g1",
  name: "Bali Trip",
  role: "owner",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z",
  memberCount: 4,
  balance: 25,
  currency: { code: "USD", symbol: "$", name: "US Dollar" },
  pendingActionCount: 2,
};

test("shows the group name, member count, and positive balance", async () => {
  const { getByText, queryByText } = await render(
    <GroupListItem group={group} isFirst />,
  );
  expect(getByText("Bali Trip")).toBeTruthy();
  expect(getByText(/4 members/)).toBeTruthy();
  expect(getByText("2")).toBeTruthy(); // action indicator
  expect(queryByText(/\+\$ 25/)).toBeTruthy();
});
