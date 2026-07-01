import { create } from "zustand";

export type ToastType = "error" | "success" | "info";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  isVisible: boolean;
};

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = Math.random().toString(36).substring(7);

    // Add new toast, visible by default to immediately trigger keyframe animation
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, isVisible: true }],
    }));

    // Trigger hide animation after 3 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.map((t) =>
          t.id === id ? { ...t, isVisible: false } : t,
        ),
      }));
      // Remove entirely from DOM after animation completes (150ms)
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 150);
    }, 3000);
  },
  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, isVisible: false } : t,
      ),
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 150);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
