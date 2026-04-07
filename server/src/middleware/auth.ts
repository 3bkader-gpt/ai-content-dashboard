import type { Context, Next } from "hono";

export async function bearerAuth(c: Context, next: Next) {
  const secret = String(process.env.API_SECRET ?? "").trim();
  if (!secret) {
    return c.json({ error: "Server misconfiguration: API_SECRET not set." }, 500);
  }
  const auth = c.req.header("authorization") ?? "";
  const expected = "Bearer " + secret;
  if (auth !== expected) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
}
