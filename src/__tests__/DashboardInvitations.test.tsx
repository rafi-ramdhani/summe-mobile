jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
  generateUUID: () => "test-key",
}));

import { fireEvent, waitFor } from "@testing-library/react-native";
import { apiFetch } from "@/lib/api";
import { renderWithClient } from "@/lib/test-utils";
import { DashboardInvitations } from "@/components/dashboard/DashboardInvitations";
import type { Invitation } from "@/lib/queries";

const inv: Invitation = {
  id: "inv1",
  groupId: "g1",
  name: "Bali Trip",
  inviterName: "Rafi",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

beforeEach(() => (apiFetch as jest.Mock).mockReset());

test("single invitation shows inviter and group and can accept", async () => {
  (apiFetch as jest.Mock).mockResolvedValue(undefined);
  const { getByText, getAllByText } = await renderWithClient(
    <DashboardInvitations invitations={[inv]} />,
  );
  expect(getByText("You have 1 pending invitation")).toBeTruthy();
  await fireEvent.press(getByText("Accept"));
  // ConfirmModal confirm button also reads "Accept"; press the last one.
  const confirmButtons = getAllByText("Accept");
  await fireEvent.press(confirmButtons[confirmButtons.length - 1]);
  await waitFor(() =>
    expect(apiFetch).toHaveBeenCalledWith(
      "/users/me/invitations/inv1/accept",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Idempotency-Key": "test-key" },
      }),
    ),
  );
});

test("multiple invitations render the count banner", async () => {
  const { getByText } = await renderWithClient(
    <DashboardInvitations invitations={[inv, { ...inv, id: "inv2" }]} />,
  );
  expect(getByText("You have 2 pending invitations")).toBeTruthy();
});
