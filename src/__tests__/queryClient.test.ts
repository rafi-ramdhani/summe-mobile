jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));
jest.mock("@/lib/secureToken", () => ({ getToken: jest.fn(() => null) }));

import { queryClient } from "@/lib/queryClient";
import { ApiError } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";

const onError = queryClient.getMutationCache().config.onError!;

function makeMutation(meta?: Record<string, unknown>) {
  return { meta } as unknown as Parameters<typeof onError>[3];
}

const fakeContext = {} as Parameters<typeof onError>[4];

let addToastSpy: jest.SpyInstance;

beforeEach(() => {
  addToastSpy = jest.spyOn(useToastStore.getState(), "addToast").mockImplementation(() => {});
});

afterEach(() => {
  addToastSpy.mockRestore();
});

test("adds an error toast with the error message on mutation error", () => {
  const error = new Error("network down");
  onError(error, undefined, undefined, makeMutation(), fakeContext);
  expect(addToastSpy).toHaveBeenCalledWith("network down", "error");
});

test("suppresses the toast when the ApiError code is in meta.suppressErrorToastCodes", () => {
  const error = new ApiError(409, "Conflict", { message: "already a member", code: "already_member" });
  onError(error, undefined, undefined, makeMutation({ suppressErrorToastCodes: ["already_member"] }), fakeContext);
  expect(addToastSpy).not.toHaveBeenCalled();
});

test("still toasts an ApiError whose code is not in the suppression list", () => {
  const error = new ApiError(409, "Conflict", { message: "already a member", code: "already_member" });
  onError(error, undefined, undefined, makeMutation({ suppressErrorToastCodes: ["some_other_code"] }), fakeContext);
  expect(addToastSpy).toHaveBeenCalledWith("already a member", "error");
});

test("toasts a non-ApiError even when meta.suppressErrorToastCodes is set (no code to match)", () => {
  const error = new Error("boom");
  onError(error, undefined, undefined, makeMutation({ suppressErrorToastCodes: ["already_member"] }), fakeContext);
  expect(addToastSpy).toHaveBeenCalledWith("boom", "error");
});
