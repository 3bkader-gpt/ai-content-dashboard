import { isGarbageToken } from "./authUtils";
const ADMIN_SESSION_KEY = "agency_admin_session_token";

export function getAdminSessionToken(): string {
  try {
    const val = localStorage.getItem(ADMIN_SESSION_KEY)?.trim() ?? "";
    return isGarbageToken(val) ? "" : val;
  } catch {
    return "";
  }
}

export function setAdminSessionToken(token: string) {
  try {
    if (isGarbageToken(token)) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return;
    }
    localStorage.setItem(ADMIN_SESSION_KEY, token.trim());
  } catch {
    // ignore
  }
}

export function clearAdminSessionToken() {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
}
