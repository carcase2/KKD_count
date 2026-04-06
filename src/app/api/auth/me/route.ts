import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/jwt";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("intranet_accounts")
        .select(
          "username, display_name, role, department_id, company_id, phone, login_enabled, must_change_password",
        )
        .eq("id", session.sub)
        .maybeSingle();

      if (!error && data) {
        if (data.company_id !== session.cid) {
          return NextResponse.json({ session: null }, { status: 401 });
        }
        return NextResponse.json({
          session: {
            id: session.sub,
            company_id: data.company_id,
            role: data.role === "admin" ? "admin" : "user",
            username: data.username,
            display_name: data.display_name,
            department_id: data.department_id ?? null,
            phone: data.phone ?? null,
            login_enabled: data.login_enabled !== false,
            must_change_password: data.must_change_password === true,
          },
        });
      }
    }
  }

  return NextResponse.json({
    session: {
      id: session.sub,
      company_id: session.cid,
      role: session.role,
      username: session.uname,
      display_name: session.dname,
      department_id: session.did,
      phone: null,
      login_enabled: true,
      must_change_password: session.mcp,
    },
  });
}
