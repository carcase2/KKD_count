import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabaseUrl } from "./env";

/** 브라우저 전용 클라이언트 (쿠키 기반 세션) */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

/** @deprecated createBrowserSupabaseClient 사용 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  return createBrowserSupabaseClient();
}
