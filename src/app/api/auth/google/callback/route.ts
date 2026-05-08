import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth/jwt";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const sessionCookieOptions = {
  httpOnly: true,
  path: "/" as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

function getSafeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  return raw;
}

type AccountRow = {
  id: string;
  company_id: string;
  role: string;
  display_name: string | null;
  username: string;
  department_id: string | null;
  must_change_password: boolean;
  login_enabled: boolean;
};

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const next = getSafeNext(reqUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=supabase_not_configured", req.url));
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=supabase_client_error", req.url));
  }

  const code = reqUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=google_code_missing", req.url));
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=google_exchange_failed", req.url));
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const googleEmail = authData.user?.email?.trim().toLowerCase() ?? "";
  if (authError || !googleEmail) {
    return NextResponse.redirect(new URL("/login?error=google_user_not_found", req.url));
  }

  const { data: account, error: accountError } = await supabase
    .from("intranet_accounts")
    .select("id, company_id, role, display_name, username, department_id, must_change_password, login_enabled")
    .eq("username", googleEmail)
    .maybeSingle();

  if (accountError || !account) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=google_account_not_linked", req.url));
  }

  const accountRow = account as AccountRow;
  if (accountRow.login_enabled === false) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=login_disabled", req.url));
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  await supabase.from("login_history").insert({
    company_id: accountRow.company_id,
    account_id: accountRow.id,
    username: accountRow.username,
    ip_address: ip,
    user_agent: ua,
    success: true,
  });

  const role = accountRow.role === "admin" ? "admin" : "user";
  const token = await signSessionToken({
    sub: accountRow.id,
    cid: accountRow.company_id,
    role,
    uname: accountRow.username,
    dname: accountRow.display_name,
    did: accountRow.department_id ?? null,
    mcp: accountRow.must_change_password === true,
  });

  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return res;
}
