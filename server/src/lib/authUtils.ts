/**
 * Checks if a token string represents a "garbage" value that should be ignored.
 * Garbage values include empty strings, or the literal strings "undefined" or "null"
 * (which can result from frontend state serializations).
 */
export function isGarbageToken(token: string | undefined | null): boolean {
  if (!token) return true;
  const t = token.trim().toLowerCase();
  return (
    t === "" ||
    t === "undefined" ||
    t === "null" ||
    t.startsWith("bearer undefined") ||
    t.startsWith("bearer null")
  );
}
