import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
  }

  let body: { displayName?: string; phone?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const displayName = body.displayName?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";

  if (!displayName) {
    return NextResponse.json({ error: "이름을 입력하세요." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "전화번호를 입력하세요." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase 클라이언트 오류" }, { status: 500 });
  }

  const { error } = await supabase.rpc("register_employee_request", {
    p_display_name: displayName,
    p_phone: phone,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message:
      "신청이 접수되었습니다. 관리자가 설정 → 직원 관리에서 「계정 발급」을 해야 로그인할 수 있습니다. 발급 후 아이디는 이름과 같고 초기 비밀번호는 1234입니다.",
  });
}
