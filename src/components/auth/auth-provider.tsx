"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useLinerStore } from "@/store/liner-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const loadedForUserId = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      const userId = state.user?.id ?? null;

      if (userId && loadedForUserId.current !== userId) {
        loadedForUserId.current = userId;
        useLinerStore.getState().loadFromSupabase(userId);
      }

      if (!userId && loadedForUserId.current) {
        loadedForUserId.current = null;
        useLinerStore.getState().resetLocal();
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
