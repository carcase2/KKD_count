import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, signSessionToken, type SessionPayload } from "@/lib/auth/jwt";

const cookieOptions = {
  httpOnly: true,
  path: "/" as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

export async function jsonWithSessionCookie(body: Record<string, unknown>, payload: SessionPayload) {
  const token = await signSessionToken(payload);
  const res = NextResponse.json(body);
  res.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
  return res;
}
