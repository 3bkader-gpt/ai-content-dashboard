import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateKitPdf } from "../src/services/pdfService.js";

type FixtureShape = {
  brief: Record<string, unknown>;
  result_json: unknown;
};

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const fixturePath = path.resolve(__dirname, "../../test-fixtures/kits/max-content-kit.json");
  const outPath = path.resolve(__dirname, "../../test-fixtures/kits/max-content-kit.preview.pdf");

  const raw = await fs.readFile(fixturePath, "utf-8");
  const fixture = JSON.parse(raw) as FixtureShape;

  const briefJson = JSON.stringify(fixture.brief);
  const pdf = await generateKitPdf({
    id: "max-content-kit-fixture",
    brief_json: briefJson,
    result_json: fixture.result_json,
    created_at: String((fixture.brief?.submitted_at as string) ?? new Date().toISOString()),
  });

  await fs.writeFile(outPath, pdf);
  console.log(`PDF generated: ${outPath}`);
}

main().catch((err) => {
  console.error("[generate-max-kit-pdf] failed:", err);
  process.exit(1);
});
