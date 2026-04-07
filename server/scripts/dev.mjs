/**
 * Frees PORT (from env / .env) then starts tsx watch.
 * Prevents EADDRINUSE when a previous BFF instance is still bound.
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(serverRoot, ".env") });

const require = createRequire(import.meta.url);
const killPort = require("kill-port");

let port = Number.parseInt(String(process.env.PORT ?? "8787").trim(), 10);
if (!Number.isFinite(port) || port < 1 || port > 65535) {
  console.error("[dev] Invalid PORT; using 8787.");
  port = 8787;
}
process.env.PORT = String(port);

await killPort(port).catch(() => {});

const child = spawn("npx", ["tsx", "watch", "src/index.ts"], {
  cwd: serverRoot,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

child.on("exit", (code) => process.exit(code ?? 0));
