import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthTokenPayload, SessionUser } from "@/types";

export const SESSION_COOKIE = "flint_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

function sessionDays() {
  return Number(process.env.AUTH_SESSION_DAYS ?? 7);
}

export async function createSessionToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${sessionDays()}d`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as AuthTokenPayload["role"],
      permissions: (payload.permissions as AuthTokenPayload["permissions"]) ?? [],
      customerId: payload.customerId ? String(payload.customerId) : undefined,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDays() * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    permissions: payload.permissions,
    customerId: payload.customerId,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
