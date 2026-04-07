import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { nanoid } from "nanoid";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL ?? "file:./data/app.db";
const filePath = url.replace(/^file:/, "");
mkdirSync(dirname(filePath), { recursive: true });

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

function ensureColumn(tableName: string, columnName: string, ddl: string) {
  const cols = sqlite.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === columnName)) {
    sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${ddl}`);
  }
}

function seedPromptCatalog() {
  const now = Date.now();
  const industrySeeds = [
    { slug: "ecommerce", name: "E-commerce" },
    { slug: "real-estate", name: "Real Estate" },
    { slug: "restaurants", name: "Restaurants" },
    { slug: "clinics", name: "Clinics" },
    { slug: "education", name: "Education" },
  ];

  const insertIndustry = sqlite.prepare(
    "INSERT OR IGNORE INTO industries (id, slug, name, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)"
  );
  for (const item of industrySeeds) {
    insertIndustry.run(nanoid(), item.slug, item.name, now, now);
  }

  const activeFallbackExists = sqlite
    .prepare("SELECT id FROM industry_prompts WHERE industry_id IS NULL AND status = 'active' LIMIT 1")
    .get() as { id: string } | undefined;

  if (!activeFallbackExists) {
    const fallbackTemplate = [
      "You are a world-class AI Creative Director and Growth Strategist.",
      "Return ONLY valid JSON, no markdown, no code fences, no extra text.",
      "Brand Name: {{brand_name}}",
      "Industry: {{industry}}",
      "Target Audience: {{target_audience}}",
      "Main Goal: {{main_goal}}",
      "Platforms: {{platforms}}",
      "Brand Tone: {{brand_tone}}",
      "Brand Colors: {{brand_colors}}",
      "Offer: {{offer}}",
      "Competitors: {{competitors}}",
      "Visual Notes: {{visual_notes}}",
      "Campaign Duration: {{campaign_duration}}",
      "Budget Level: {{budget_level}}",
      "Best Content Types: {{best_content_types}}",
      "Counts: posts={{num_posts}}, images={{num_image_designs}}, videos={{num_video_prompts}}",
      "Now output valid JSON only.",
    ].join("\n");

    sqlite
      .prepare(
        "INSERT INTO industry_prompts (id, industry_id, version, status, prompt_template, notes, created_at, updated_at) VALUES (?, NULL, 1, 'active', ?, ?, ?, ?)"
      )
      .run(nanoid(), fallbackTemplate, "Global fallback prompt", now, now);
  }
}

export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS kits (
      id TEXT PRIMARY KEY NOT NULL,
      brief_json TEXT NOT NULL,
      result_json TEXT,
      delivery_status TEXT NOT NULL,
      model_used TEXT NOT NULL,
      last_error TEXT NOT NULL DEFAULT '',
      correlation_id TEXT NOT NULL,
      prompt_version_id TEXT,
      is_fallback INTEGER NOT NULL DEFAULT 0,
      row_version INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key_hash TEXT PRIMARY KEY NOT NULL,
      brief_hash TEXT NOT NULL,
      kit_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_kits_created ON kits(created_at DESC);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      kind TEXT NOT NULL,
      kit_id TEXT,
      read_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      display_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      compact_table INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brand_voice (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pillars_json TEXT NOT NULL,
      avoid_words_json TEXT NOT NULL,
      sample_snippet TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS extras_waitlist (
      id TEXT PRIMARY KEY NOT NULL,
      tool_id TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS industries (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_industries_slug ON industries(slug);

    CREATE TABLE IF NOT EXISTS industry_prompts (
      id TEXT PRIMARY KEY NOT NULL,
      industry_id TEXT,
      version INTEGER NOT NULL,
      status TEXT NOT NULL,
      prompt_template TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_industry_prompts_industry ON industry_prompts(industry_id);
    CREATE INDEX IF NOT EXISTS idx_industry_prompts_status ON industry_prompts(status);
  `);

  // Migration-safe additive changes for older databases.
  ensureColumn("kits", "prompt_version_id", "prompt_version_id TEXT");
  ensureColumn("kits", "is_fallback", "is_fallback INTEGER NOT NULL DEFAULT 0");

  seedPromptCatalog();
}
