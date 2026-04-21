import { getDeviceId } from "../lib/deviceId";
import { getAccessToken } from "../lib/authToken";
import { getAdminSessionToken } from "../lib/adminSession";
import { isGarbageToken } from "../lib/authUtils";

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const base = import.meta.env.VITE_API_URL ?? "";

export function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const token = getAccessToken();
  const adminSessionToken = getAdminSessionToken();

  // Filter out literal "undefined" or "null" strings
  const authVal = isGarbageToken(token) ? null : token;
  const adminVal = isGarbageToken(adminSessionToken) ? null : adminSessionToken;

  const authorization = authVal ? `Bearer ${authVal}` : undefined;

  return {
    "Content-Type": "application/json",
    "X-Device-ID": getDeviceId(),
    ...(authorization ? { Authorization: authorization } : {}),
    ...(adminVal ? { "X-Agency-Admin-Session": adminVal } : {}),
    ...extra,
  };
}

export function apiUrl(path: string) {
  return `${base}${path}`;
}

export async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const j = await res.json().catch(() => ({}));
  return (j as { error?: string }).error ?? fallback;
}
