import { create } from "zustand";

export type User = { id: string; email: string; name?: string | null };
export type Session = { user: User } | null;

type AuthState = {
  session: Session;
  sessionExpired: boolean;
  setSession: (session: Session) => void;
  setSessionExpired: (expired: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  sessionExpired: false,
  setSession: (session) => set({ session }),
  setSessionExpired: (expired) => set({ sessionExpired: expired }),
}));
