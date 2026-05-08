import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/jwt";
import { getSupabasePublicKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

type Body = {
  url?: string;
  publishableKey?: string;
};

const ENV_PATH = path.join(process.cwd(), ".env.local");

function upsertEnvLine(content: string, key: string, value: string) {
  const escaped = value.replace(/\n/g, "").trim();
  const line = `${key}=${escaped}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  const normalized = content.endsWith("\n") || content.length === 0 ? content : `${content}\n`;
  return `${normalized}${line}\n`;
}

async function writeSupabaseEnv(url: string, publishableKey: string) {
  let current = "";
  try {
    current = await fs.readFile(ENV_PATH, "utf8");
  } catch {
    current = "";
  }

  let next = current;
  next = upsertEnvLine(next, "NEXT_PUBLIC_SUPABASE_URL", url);
  next = upsertEnvLine(next, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY", publishableKey);
  await fs.writeFile(ENV_PATH, next, "utf8");
}

async function isAdminSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await verifySessionToken(token);
  return session?.role === "admin";
}

export async function GET() {
  return NextResponse.json({
    configured: isSupabaseConfigured(),
    url: getSupabaseUrl(),
    hasKey: Boolean(getSupabasePublicKey()),
  });
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const url = body.url?.trim() ?? "";
  const publishableKey = body.publishableKey?.trim() ?? "";
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    return NextResponse.json({ error: "Supabase URL 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (!publishableKey.startsWith("sb_publishable_") && publishableKey.length < 20) {
    return NextResponse.json({ error: "Publishable/anon 키 형식이 올바르지 않습니다." }, { status: 400 });
  }

  // 최초 설정 이후에는 관리자만 수정 가능
  if (isSupabaseConfigured()) {
    const admin = await isAdminSession();
    if (!admin) {
      return NextResponse.json(
        { error: "이미 설정된 상태입니다. 관리자만 Supabase 연결을 변경할 수 있습니다." },
        { status: 403 },
      );
    }
  }

  await writeSupabaseEnv(url, publishableKey);
  return NextResponse.json({
    ok: true,
    message:
      "설정을 저장했습니다. 서버 프로세스 재시작 후 반영됩니다. (npm run dev 재실행)",
  });
}
