import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/auth/get-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }

  const session = await getSessionPayload();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "관리자만 실행할 수 있습니다." }, { status: 403 });
  }

  let body: { accountId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const accountId = body.accountId?.trim();
  if (!accountId) {
    return NextResponse.json({ error: "accountId가 필요합니다." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 클라이언트 오류" }, { status: 500 });
  }

  const { data: row, error: qErr } = await supabase
    .from("intranet_accounts")
    .select("company_id, display_name")
    .eq("id", accountId)
    .maybeSingle();

  if (qErr || !row || row.company_id !== session.cid) {
    return NextResponse.json({ error: "대상 계정을 찾을 수 없습니다." }, { status: 404 });
  }

  const username = (row.display_name ?? "").trim();
  if (username.length < 2) {
    return NextResponse.json(
      { error: "직원 이름(표시 이름)이 2자 이상이어야 계정을 발급할 수 있습니다." },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc("intranet_activate_account", {
    p_account_id: accountId,
    p_username: username,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
