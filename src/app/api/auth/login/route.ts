import { NextResponse } from "next/server";
import { jsonWithSessionCookie } from "@/lib/auth/cookie-response";
import { ensureSupabaseAuthLink } from "@/lib/auth/supabase-auth-link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTenantSlugFromHost, resolveTenantBySlug } from "@/lib/tenant/resolve";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type VerifyRow = {
  id: string;
  company_id: string;
  role: string;
  display_name: string | null;
  username: string;
  department_id: string | null;
  must_change_password: boolean;
};

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }

  let body: { companyCode?: string; username?: string; password?: string };
  try {
    body = (await req.json()) as { companyCode?: string; username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const companyCode = body.companyCode?.trim();
  const username = body.username?.trim();
  const password = (body.password ?? "").trim();
  if (!username || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 클라이언트 오류" }, { status: 500 });
  }

  // 1) 도메인 기반 회사 식별 우선
  const tenantSlug = extractTenantSlugFromHost(req.headers.get("host"));
  let resolvedCode: string | null = null;
  if (tenantSlug) {
    const tenant = await resolveTenantBySlug(tenantSlug);
    resolvedCode = tenant?.invite_code ?? null;
    if (!resolvedCode) {
      return NextResponse.json({ error: "등록되지 않은 회사 도메인입니다." }, { status: 404 });
    }
  } else {
    // 2) 로컬/공용도메인 fallback: 회사코드 입력 사용
    resolvedCode = companyCode?.toUpperCase() ?? null;
  }

  if (!resolvedCode) {
    return NextResponse.json({ error: "회사코드를 입력하세요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("verify_login", {
    p_invite_code: resolvedCode,
    p_username: username,
    p_password: password,
  });

  if (error) {
    const message = (error.message ?? "").toLowerCase();
    if (message.includes("fetch failed") || message.includes("failed to fetch")) {
      return NextResponse.json(
        { error: "Supabase 연결에 실패했습니다. URL/키 또는 네트워크 상태를 확인하세요." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const rows = data as VerifyRow[] | null;
  const row = rows?.[0];

  // 로그인 IP / UA
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  if (!row) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("invite_code", resolvedCode)
      .maybeSingle();
    const companyId = company?.id as string | undefined;

    const { data: withUsername } = await supabase
      .from("intranet_accounts")
      .select("id, company_id")
      .eq("company_id", companyId ?? "")
      .eq("username", username)
      .limit(1);

    if (withUsername && withUsername.length > 0) {
      const acct = withUsername[0] as { id: string; company_id: string };
      // 실패 기록
      await supabase.from("login_history").insert({
        company_id: acct.company_id,
        account_id: acct.id,
        username,
        ip_address: ip,
        user_agent: ua,
        success: false,
      });
      return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const { data: pendingOnly } = await supabase
      .from("intranet_accounts")
      .select("id")
      .eq("company_id", companyId ?? "")
      .is("username", null)
      .eq("display_name", username)
      .limit(1);

    if (pendingOnly && pendingOnly.length > 0) {
      return NextResponse.json(
        {
          error:
            "아직 관리자가 로그인 계정을 발급하지 않았습니다. 설정 → 직원 관리에서 해당 직원에 대해 「계정 발급」을 누른 뒤, 이름과 동일한 아이디·기본 비밀번호 1234로 로그인하세요.",
        },
        { status: 401 },
      );
    }

    // 아이디를 아예 못 찾았거나 기타 실패
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }


  // 성공 기록
  const { error: histErr } = await supabase.from("login_history").insert({
    company_id: row.company_id,
    account_id: row.id,
    username,
    ip_address: ip,
    user_agent: ua,
    success: true,
  });
  if (histErr) {
    console.error("[login_history insert error]", histErr.message, histErr.details);
  }

  const role = row.role === "admin" ? "admin" : "user";

  // Supabase Auth 전환 준비: 로그인 성공 시 auth.users 계정 자동 연동
  await ensureSupabaseAuthLink({
    accountId: row.id,
    companyId: row.company_id,
    username: row.username,
    password,
    displayName: row.display_name,
    role,
  });

  try {
    return await jsonWithSessionCookie(
      { ok: true, must_change_password: row.must_change_password === true },
      {
        sub: row.id,
        cid: row.company_id,
        role,
        uname: row.username,
        dname: row.display_name,
        did: row.department_id ?? null,
        mcp: row.must_change_password === true,
      },
    );
  } catch {
    return NextResponse.json({ error: "AUTH_SECRET 설정을 확인하세요." }, { status: 500 });
  }
}
