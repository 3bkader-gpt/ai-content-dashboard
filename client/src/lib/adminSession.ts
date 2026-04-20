const ADMIN_SESSION_KEY = "agency_admin_session_token";

export function getAdminSessionToken(): string {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setAdminSessionToken(token: string) {
  try {
    if (!token.trim()) {
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
