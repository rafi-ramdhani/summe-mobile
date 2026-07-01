import { comingSoon } from "@/lib/comingSoon";
import { useToastStore } from "@/stores/toastStore";

beforeEach(() => useToastStore.setState({ toasts: [] }));

test("comingSoon pushes an info toast in English", () => {
  comingSoon("en");
  const toasts = useToastStore.getState().toasts;
  expect(toasts).toHaveLength(1);
  expect(toasts[0].message).toBe("Coming soon");
  expect(toasts[0].type).toBe("info");
});

test("comingSoon pushes Indonesian copy", () => {
  comingSoon("id");
  expect(useToastStore.getState().toasts[0].message).toBe("Segera hadir");
});
