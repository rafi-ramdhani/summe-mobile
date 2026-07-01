jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiFetch: jest.fn(),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import { apiFetch } from "@/lib/api";
import { CurrencySelectModal } from "@/components/CurrencySelectModal";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const currencies = [
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "USD", symbol: "$", name: "US Dollar" },
];

function renderModal(onSelect = jest.fn()) {
  const qc = createTestQueryClient();
  const utils = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <CurrencySelectModal
          isOpen
          onClose={jest.fn()}
          selectedCurrency="IDR"
          onSelectCurrency={onSelect}
        />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { onSelect, ...utils };
}

beforeEach(() => {
  (apiFetch as jest.Mock).mockReset();
  (apiFetch as jest.Mock).mockResolvedValue({ data: currencies });
});

test("filters the list by search query", async () => {
  renderModal();
  await waitFor(() => expect(screen.getByText("USD")).toBeTruthy());
  fireEvent.changeText(
    screen.getByPlaceholderText(/Search currency/i),
    "usd",
  );
  await waitFor(() => expect(screen.queryByText("IDR")).toBeNull());
});

test("calls onSelectCurrency when a row is pressed", async () => {
  const { onSelect } = renderModal();
  await waitFor(() => expect(screen.getByText("USD")).toBeTruthy());
  fireEvent.press(screen.getByText("USD"));
  expect(onSelect).toHaveBeenCalledWith("USD");
});
