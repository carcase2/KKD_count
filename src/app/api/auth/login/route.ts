import { NextResponse } from "next/server";
import { jsonWithSessionCookie } from "@/lib/auth/cookie-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = (body.password ?? "").trim();
  if (!username || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 클라이언트 오류" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("verify_login", {
    p_username: username,
    p_password: password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const rows = data as VerifyRow[] | null;
  const row = rows?.[0];

  // 로그인 IP / UA
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  if (!row) {
    const { data: withUsername } = await supabase
      .from("intranet_accounts")
      .select("id, company_id")
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
