import { NextResponse } from "next/server";
import { ensureSupabaseAuthLink } from "@/lib/auth/supabase-auth-link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }

  let body: {
    companyName?: string;
    adminName?: string;
    username?: string;
    password?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const companyName = body.companyName?.trim() ?? "";
  const adminName = body.adminName?.trim() ?? "";
  const username = body.username?.trim() ?? "";
  const password = (body.password ?? "").trim();

  if (!companyName) {
    return NextResponse.json({ error: "회사명을 입력하세요." }, { status: 400 });
  }
  if (!adminName) {
    return NextResponse.json({ error: "관리자 이름을 입력하세요." }, { status: 400 });
  }
  if (!username || username.length < 2) {
    return NextResponse.json({ error: "관리자 아이디는 2자 이상이어야 합니다." }, { status: 400 });
  }
  if (!password || password.length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 클라이언트 오류" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("signup_new_company", {
    p_company_name: companyName,
    p_username: username,
    p_password: password,
    p_display_name: adminName,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = (
    data as
      | Array<{
          account_id: string;
          company_id: string;
          invite_code?: string;
          username: string;
          display_name: string | null;
          role: string;
        }>
      | null
  )?.[0];

  if (row?.account_id && row?.company_id) {
    await ensureSupabaseAuthLink({
      accountId: row.account_id,
      companyId: row.company_id,
      username: row.username,
      password,
      displayName: row.display_name,
      role: row.role === "admin" ? "admin" : "user",
    });
  }

  let tenantSlug: string | null = null;
  if (row?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("tenant_slug")
      .eq("id", row.company_id)
      .maybeSingle();
    tenantSlug = (company?.tenant_slug as string | undefined) ?? null;
  }

  const baseDomain = process.env.APP_BASE_DOMAIN?.trim();
  const tenantUrl =
    tenantSlug && baseDomain ? `https://${tenantSlug}.${baseDomain}/login` : null;

  return NextResponse.json({
    ok: true,
    inviteCode: row?.invite_code ?? null,
    tenantSlug,
    tenantUrl,
    message:
      "회사 가입이 완료되었습니다. 입력한 관리자 아이디/비밀번호로 바로 로그인할 수 있습니다.",
  });
}
