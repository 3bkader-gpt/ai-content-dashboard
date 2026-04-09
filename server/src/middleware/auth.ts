import type { Context, Next } from "hono";

export async function bearerAuth(c: Context, next: Next) {
  const secret = String(process.env.API_SECRET ?? "").trim();
  if (!secret) {
    await next();
    return;
  }
  const auth = c.req.header("authorization") ?? "";
  if (!auth) {
    await next();
    return;
  }
  const expected = "Bearer " + secret;
  if (auth !== expected) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
}
