import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let cached: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!cached) cached = createClient();
  return cached;
}

/**
 * Lazy singleton — the real client (and its env-var validation) is only
 * created on first actual use (inside an effect or event handler), not at
 * module-import time. A top-level `createClient()` call here would run
 * during Next's prerender pass for *every* page (this module is imported
 * from the root layout's AuthProvider), so a missing env var would crash
 * the entire build instead of failing where it's actually used.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabase(), prop, receiver);
  },
});
