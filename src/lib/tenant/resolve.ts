import { createServerSupabaseClient } from "@/lib/supabase/server";

function stripPort(host: string) {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

export function extractTenantSlugFromHost(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = stripPort(hostHeader);
  if (!host) return null;

  if (host === "localhost" || host === "127.0.0.1") return null;
  if (host.endsWith(".localhost")) {
    const slug = host.replace(/\.localhost$/, "");
    return slug || null;
  }

  const baseDomain = process.env.APP_BASE_DOMAIN?.trim().toLowerCase();
  if (baseDomain) {
    if (host === baseDomain) return null;
    if (host.endsWith(`.${baseDomain}`)) {
      const slug = host.slice(0, -(baseDomain.length + 1));
      return slug || null;
    }
  }

  return null;
}

export async function resolveTenantBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("companies")
    .select("id, name, invite_code, tenant_slug")
    .eq("tenant_slug", slug)
    .maybeSingle();
  return data as { id: string; name: string; invite_code: string; tenant_slug: string } | null;
}
