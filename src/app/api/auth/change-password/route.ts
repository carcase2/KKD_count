import { NextResponse } from "next/server";
import { jsonWithSessionCookie } from "@/lib/auth/cookie-response";
import { getSessionPayload } from "@/lib/auth/get-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }

  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const current = (body.currentPassword ?? "").trim();
  const next = (body.newPassword ?? "").trim();
  if (!current || !next) {
    return NextResponse.json({ error: "현재 비밀번호와 새 비밀번호를 입력하세요." }, { status: 400 });
  }
  if (next.length < 4) {
    return NextResponse.json({ error: "새 비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 클라이언트 오류" }, { status: 500 });
  }

  const { error } = await supabase.rpc("intranet_change_own_password", {
    p_account_id: session.sub,
    p_old_password: current,
    p_new_password: next,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    return await jsonWithSessionCookie(
      { ok: true },
      {
        sub: session.sub,
        cid: session.cid,
        role: session.role,
        uname: session.uname,
        dname: session.dname,
        did: session.did,
        mcp: false,
      },
    );
  } catch {
    return NextResponse.json({ error: "AUTH_SECRET 설정을 확인하세요." }, { status: 500 });
  }
}
