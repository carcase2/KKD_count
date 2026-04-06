import { SignJWT, jwtVerify } from "jose";

const COOKIE = "intranet_session";

export type SessionPayload = {
  sub: string;
  cid: string;
  role: "admin" | "user";
  uname: string;
  dname: string | null;
  /** intranet_accounts.department_id */
  did: string | null;
  /** 다음 로그인 시 비밀번호 변경만 허용 */
  mcp: boolean;
};

function getSecret() {
  const s = process.env.AUTH_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (min 16 chars)");
  }
  return new TextEncoder().encode(s);
}

export async function signSessionToken(p: SessionPayload, maxAgeSec = 60 * 60 * 24 * 7) {
  return new SignJWT({
    cid: p.cid,
    role: p.role,
    uname: p.uname,
    dname: p.dname,
    did: p.did,
    mcp: p.mcp,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub;
    const cid = payload.cid as string | undefined;
    const role = payload.role as string | undefined;
    const uname = payload.uname as string | undefined;
    const dname = (payload.dname as string | null | undefined) ?? null;
    const did = (payload.did as string | null | undefined) ?? null;
    const mcp = payload.mcp === true;
    if (!sub || !cid || (role !== "admin" && role !== "user") || !uname) return null;
    return { sub, cid, role, uname, dname, did, mcp };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE;
