import { SignJWT, jwtVerify } from "jose";
import type { Context } from "hono";

const encoder = new TextEncoder();
const SESSION_HEADER = "x-agency-admin-session";

type AgencyAdminSessionPayload = {
  sub: string;
  username: string;
};

function isAgencyEdition() {
  return String(process.env.APP_EDITION ?? "").trim().toLowerCase() === "agency";
}

function getAdminAuthSecret(): Uint8Array | null {
  const secret = String(process.env.ADMIN_AUTH_SECRET ?? "").trim();
  if (!secret) return null;
  return encoder.encode(secret);
}

export function getAgencyAdminSessionToken(c: Context): string {
  return c.req.header(SESSION_HEADER)?.trim() ?? "";
}

export async function issueAgencyAdminSessionToken(username: string): Promise<string | null> {
  const secret = getAdminAuthSecret();
  if (!secret) return null;
  return await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("agency-admin")
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyAgencyAdminSessionToken(token: string): Promise<AgencyAdminSessionPayload | null> {
  const secret = getAdminAuthSecret();
  if (!secret || !token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (String(payload.sub ?? "") !== "agency-admin") return null;
    const username = String(payload.username ?? "").trim();
    if (!username) return null;
    return {
      sub: "agency-admin",
      username,
    };
  } catch {
    return null;
  }
}

export async function isAgencyAdminRequest(c: Context): Promise<boolean> {
  if (!isAgencyEdition()) return false;
  const token = getAgencyAdminSessionToken(c);
  if (!token) return false;
  const session = await verifyAgencyAdminSessionToken(token);
  if (!session) return false;
  c.set("agencyAdminSession", session);
  return true;
}
