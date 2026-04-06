import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabaseUrl } from "./env";

export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server Component에서는 set 불가 — 미들웨어에서 세션 갱신 */
        }
      },
    },
  });
}
