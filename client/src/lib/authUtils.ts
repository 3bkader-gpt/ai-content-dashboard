/**
 * Checks if a token string represents a "garbage" value that should be ignored.
 */
export function isGarbageToken(token: string | undefined | null): boolean {
  if (!token) return true;
  const t = token.trim().toLowerCase();
  return (
    t === "" ||
    t === "undefined" ||
    t === "null" ||
    t === "[object object]" // just in case
  );
}
