import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const srcDir = path.resolve(root, "src", "services", "pdf");
const distDir = path.resolve(root, "dist", "services", "pdf");

async function main() {
  await fs.mkdir(distDir, { recursive: true });
  await fs.copyFile(path.join(srcDir, "kit-template.hbs"), path.join(distDir, "kit-template.hbs"));
  await fs.copyFile(path.join(srcDir, "kit-template.css"), path.join(distDir, "kit-template.css"));
  console.log("[pdf-assets] copied kit-template.hbs/css to dist");
}

main().catch((err) => {
  console.error("[pdf-assets] failed to copy assets:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
