import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

export type AuthStatus = "loading" | "authed" | "anon";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: user ? "authed" : "anon" }),
}));

/** The name entered at signup, falling back to the email's local part. */
export function getDisplayName(user: User | null): string {
  const fullName = user?.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  return user?.email?.split("@")[0] ?? "there";
}
