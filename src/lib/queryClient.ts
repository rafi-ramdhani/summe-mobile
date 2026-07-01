import { MutationCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000, retry: false } },
  mutationCache: new MutationCache({
    onError: (error, _v, _c, mutation) => {
      const code = error instanceof ApiError ? error.code : undefined;
      const suppressed = (mutation.meta?.suppressErrorToastCodes as string[] | undefined) ?? [];
      if (code && suppressed.includes(code)) return;
      useToastStore.getState().addToast((error as Error).message, "error");
    },
  }),
});
