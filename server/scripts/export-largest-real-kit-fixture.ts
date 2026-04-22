import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { generateKitPdf } from "../src/services/pdfService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverDir = join(__dirname, "..");
const rootDir = join(serverDir, "..");

dotenv.config({ path: join(serverDir, ".env") });

const { Pool } = pg;

function databaseUrlForPgPool(raw: string) {
  try {
    const u = new URL(raw);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return raw;
  }
}

function parseResultJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

function countArray(root: Record<string, unknown>, key: string): number {
  const v = root[key];
  return Array.isArray(v) ? v.length : 0;
}

function countNestedArray(root: Record<string, unknown>, parent: string, key: string): number {
  const p = root[parent];
  if (!p || typeof p !== "object" || Array.isArray(p)) return 0;
  const v = (p as Record<string, unknown>)[key];
  return Array.isArray(v) ? v.length : 0;
}

type KitRow = {
  id: string;
  brief_json: string;
  result_json: string;
  created_at: string;
  delivery_status: string;
};

async function main() {
  const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (!rawDatabaseUrl) {
    throw new Error("DATABASE_URL missing in server/.env");
  }

  const useSsl =
    !/localhost|127\.0\.0\.1/.test(rawDatabaseUrl) &&
    !rawDatabaseUrl.includes("sslmode=disable");

  const pool = new Pool({
    connectionString: databaseUrlForPgPool(rawDatabaseUrl),
    max: 2,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const query = `
      SELECT id, brief_json, result_json, created_at, delivery_status
      FROM social_geni.kits
      WHERE result_json IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1500
    `;
    const result = await pool.query<KitRow>(query);
    if (!result.rows.length) throw new Error("No done kits with result_json found.");

    let best: {
      row: KitRow;
      score: number;
      counts: {
        posts: number;
        image_designs: number;
        video_prompts: number;
        ideas: number;
        hooks: number;
        templates: number;
      };
    } | null = null;

    for (const row of result.rows) {
      const parsed = parseResultJson(row.result_json);
      const counts = {
        posts: countArray(parsed, "posts"),
        image_designs: countArray(parsed, "image_designs"),
        video_prompts: countArray(parsed, "video_prompts"),
        ideas: countNestedArray(parsed, "content_ideas_package", "ideas"),
        hooks: countNestedArray(parsed, "content_ideas_package", "hooks"),
        templates: countNestedArray(parsed, "content_ideas_package", "templates"),
      };
      const score =
        counts.posts +
        counts.image_designs +
        counts.video_prompts +
        counts.ideas +
        counts.hooks +
        counts.templates;

      if (!best || score > best.score) {
        best = { row, score, counts };
      }
    }

    if (!best) throw new Error("Could not determine largest kit.");

    const fixture = {
      fixture_name: "largest-real-kit",
      fixture_version: 1,
      source: {
        kit_id: best.row.id,
        delivery_status: best.row.delivery_status,
        created_at: best.row.created_at,
        score: best.score,
      },
      counts: best.counts,
      brief: JSON.parse(best.row.brief_json),
      result_json: JSON.parse(best.row.result_json),
    };

    const fixtureJsonPath = path.resolve(rootDir, "test-fixtures/kits/largest-real-kit.json");
    const fixturePdfPath = path.resolve(rootDir, "test-fixtures/kits/largest-real-kit.preview.pdf");

    await fs.writeFile(fixtureJsonPath, JSON.stringify(fixture, null, 2), "utf-8");

    const pdfBuffer = await generateKitPdf({
      id: best.row.id,
      brief_json: JSON.stringify(fixture.brief),
      result_json: fixture.result_json,
      created_at: best.row.created_at,
    });
    await fs.writeFile(fixturePdfPath, pdfBuffer);

    console.log("Largest real kit exported successfully.");
    console.log("JSON:", fixtureJsonPath);
    console.log("PDF:", fixturePdfPath);
    console.log("Selected kit:", best.row.id, "score:", best.score, "counts:", best.counts);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[export-largest-real-kit-fixture] failed:", err.message);
  process.exit(1);
});
