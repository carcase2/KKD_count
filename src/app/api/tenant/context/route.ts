import { NextResponse } from "next/server";
import { extractTenantSlugFromHost, resolveTenantBySlug } from "@/lib/tenant/resolve";

export async function GET(req: Request) {
  const host = req.headers.get("host");
  const slug = extractTenantSlugFromHost(host);
  if (!slug) {
    return NextResponse.json({
      tenantResolved: false,
      requireCompanyCode: true,
      tenantName: null,
      tenantSlug: null,
    });
  }

  const tenant = await resolveTenantBySlug(slug);
  if (!tenant) {
    return NextResponse.json({
      tenantResolved: false,
      requireCompanyCode: true,
      tenantName: null,
      tenantSlug: slug,
      error: "등록되지 않은 회사 도메인입니다.",
    });
  }

  return NextResponse.json({
    tenantResolved: true,
    requireCompanyCode: false,
    tenantName: tenant.name,
    tenantSlug: tenant.tenant_slug,
  });
}
