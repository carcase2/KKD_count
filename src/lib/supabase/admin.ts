import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

function getSupabaseServiceRoleKey(): string | null {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return k || null;
}

export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
