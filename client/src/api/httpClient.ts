import { getDeviceId } from "../lib/deviceId";
import { getAccessToken } from "../lib/authToken";
import { getAdminSessionToken } from "../lib/adminSession";

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
  // Frontend must only send a user token when available; never embed API secrets in client runtime.
  const authorization = token ? `Bearer ${token}` : undefined;
  return {
    "Content-Type": "application/json",
    "X-Device-ID": getDeviceId(),
    ...(authorization ? { Authorization: authorization } : {}),
    ...(adminSessionToken ? { "X-Agency-Admin-Session": adminSessionToken } : {}),
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
