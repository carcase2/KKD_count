/** 브라우저·서버·Edge(미들웨어) 공통 — NEXT_PUBLIC_* 만 사용 */
export function getSupabaseUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return u || null;
}

/**
 * Supabase 대시보드의 anon JWT 또는 새 publishable 키(sb_publishable_…) 모두 지원
 */
export function getSupabasePublicKey(): string | null {
  const k =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  return k || null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}
