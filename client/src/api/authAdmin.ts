import { ApiError, apiUrl, parseErrorMessage } from "./httpClient";
import { clearAdminSessionToken, getAdminSessionToken, setAdminSessionToken } from "../lib/adminSession";

type AgencyAdminLoginResponse = {
  ok: boolean;
  username: string;
  token: string;
};

export async function loginAgencyAdmin(username: string, password: string): Promise<void> {
  const res = await fetch(apiUrl("/api/auth/agency-admin/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "Admin login failed"), res.status);
  const payload = (await res.json()) as AgencyAdminLoginResponse;
  if (!payload?.token) throw new ApiError("Admin session token is missing.", 502);
  setAdminSessionToken(payload.token);
}

export async function validateAgencyAdminSession(): Promise<boolean> {
  const token = getAdminSessionToken();
  if (!token) return false;
  const res = await fetch(apiUrl("/api/auth/agency-admin/session"), {
    headers: {
      "X-Agency-Admin-Session": token,
    },
  });
  if (!res.ok) return false;
  const body = (await res.json().catch(() => ({}))) as { valid?: boolean };
  return Boolean(body.valid);
}

export function logoutAgencyAdmin() {
  clearAdminSessionToken();
}
