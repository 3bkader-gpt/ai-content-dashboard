import { pool } from "./connection.js";

const DDL = `
CREATE SCHEMA IF NOT EXISTS social_geni;

CREATE TABLE IF NOT EXISTS social_geni.kits (
  id TEXT PRIMARY KEY NOT NULL,
  device_id TEXT NOT NULL DEFAULT '',
  user_id TEXT,
  brief_json TEXT NOT NULL,
  brief_hash TEXT NOT NULL DEFAULT '',
  target_audience_v2 JSONB NOT NULL DEFAULT '[]'::jsonb,
  platforms_v2 JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_content_types_v2 JSONB NOT NULL DEFAULT '[]'::jsonb,
  ui_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json TEXT,
  delivery_status TEXT NOT NULL,
  model_used TEXT NOT NULL,
  last_error TEXT NOT NULL DEFAULT '',
  correlation_id TEXT NOT NULL,
  prompt_version_id TEXT,
  is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  usage_charged_at TIMESTAMPTZ,
  row_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT '';

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS user_id TEXT;

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS brief_hash TEXT NOT NULL DEFAULT '';

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS usage_charged_at TIMESTAMPTZ;

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS target_audience_v2 JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS platforms_v2 JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS best_content_types_v2 JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS ui_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER NOT NULL DEFAULT 0;

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS completion_tokens INTEGER NOT NULL DEFAULT 0;

ALTER TABLE social_geni.kits
ADD COLUMN IF NOT EXISTS total_tokens INTEGER NOT NULL DEFAULT 0;

UPDATE social_geni.kits
SET
  target_audience_v2 = COALESCE(target_audience_v2, '[]'::jsonb),
  platforms_v2 = COALESCE(platforms_v2, '[]'::jsonb),
  best_content_types_v2 = COALESCE(best_content_types_v2, '[]'::jsonb),
  ui_preferences = COALESCE(ui_preferences, '{}'::jsonb)
WHERE target_audience_v2 IS NULL
   OR platforms_v2 IS NULL
   OR best_content_types_v2 IS NULL
   OR ui_preferences IS NULL;

CREATE TABLE IF NOT EXISTS social_geni.kit_interactions (
  id TEXT PRIMARY KEY NOT NULL,
  kit_id TEXT NOT NULL,
  user_id TEXT,
  device_id TEXT NOT NULL DEFAULT '',
  interaction_type TEXT NOT NULL,
  meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kit_interactions_kit_created
  ON social_geni.kit_interactions (kit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kit_interactions_type_created
  ON social_geni.kit_interactions (interaction_type, created_at DESC);

CREATE TABLE IF NOT EXISTS social_geni.idempotency_keys (
  key_hash TEXT PRIMARY KEY NOT NULL,
  brief_hash TEXT NOT NULL,
  kit_id TEXT NOT NULL,
  expires_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS social_geni.kit_failure_logs (
  id TEXT PRIMARY KEY NOT NULL,
  kit_id TEXT,
  phase TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  model_used TEXT NOT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kit_failure_logs_kit ON social_geni.kit_failure_logs (kit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kit_failure_logs_phase ON social_geni.kit_failure_logs (phase, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kits_created ON social_geni.kits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kits_device_created ON social_geni.kits (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kits_user_created ON social_geni.kits (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kits_brief_hash ON social_geni.kits (brief_hash);

CREATE TABLE IF NOT EXISTS social_geni.users (
  id TEXT PRIMARY KEY NOT NULL,
  supabase_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE social_geni.users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS social_geni.user_devices (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON social_geni.user_devices (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS social_geni.plan_subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  plan_code TEXT NOT NULL,
  status TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plan_subscriptions_user ON social_geni.plan_subscriptions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_subscriptions_status ON social_geni.plan_subscriptions (status, period_end);

CREATE TABLE IF NOT EXISTS social_geni.monthly_usage_counters (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  device_id TEXT,
  period_key TEXT NOT NULL,
  video_prompts_used INTEGER NOT NULL DEFAULT 0,
  image_prompts_used INTEGER NOT NULL DEFAULT 0,
  kits_used INTEGER NOT NULL DEFAULT 0,
  regenerate_used INTEGER NOT NULL DEFAULT 0,
  retry_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE social_geni.monthly_usage_counters
ADD COLUMN IF NOT EXISTS video_prompts_used INTEGER NOT NULL DEFAULT 0;

ALTER TABLE social_geni.monthly_usage_counters
ADD COLUMN IF NOT EXISTS image_prompts_used INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usage_user_period
  ON social_geni.monthly_usage_counters (user_id, period_key)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_usage_device_period
  ON social_geni.monthly_usage_counters (device_id, period_key)
  WHERE device_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS social_geni.notifications (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL,
  kit_id TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE social_geni.notifications
ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_created ON social_geni.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON social_geni.notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS social_geni.kit_delete_audit (
  id TEXT PRIMARY KEY NOT NULL,
  kit_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kit_delete_audit_kit_deleted
  ON social_geni.kit_delete_audit (kit_id, deleted_at DESC);

CREATE TABLE IF NOT EXISTS social_geni.user_profile (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS social_geni.app_preferences (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  compact_table BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS social_geni.brand_voice (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  pillars_json TEXT NOT NULL,
  avoid_words_json TEXT NOT NULL,
  sample_snippet TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Migration for existing non-functional tables
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'social_geni' AND table_name = 'user_profile' AND data_type = 'integer' AND column_name = 'id') THEN
    DROP TABLE social_geni.user_profile;
    CREATE TABLE social_geni.user_profile (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL
    );
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'social_geni' AND table_name = 'app_preferences' AND data_type = 'integer' AND column_name = 'id') THEN
    DROP TABLE social_geni.app_preferences;
    CREATE TABLE social_geni.app_preferences (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      compact_table BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL
    );
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'social_geni' AND table_name = 'brand_voice' AND data_type = 'integer' AND column_name = 'id') THEN
    DROP TABLE social_geni.brand_voice;
    CREATE TABLE social_geni.brand_voice (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      pillars_json TEXT NOT NULL,
      avoid_words_json TEXT NOT NULL,
      sample_snippet TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS social_geni.extras_waitlist (
  id TEXT PRIMARY KEY NOT NULL,
  tool_id TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS social_geni.industries (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_industries_slug ON social_geni.industries (slug);

CREATE TABLE IF NOT EXISTS social_geni.industry_prompts (
  id TEXT PRIMARY KEY NOT NULL,
  industry_id TEXT,
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_industry_prompts_industry ON social_geni.industry_prompts (industry_id);
CREATE INDEX IF NOT EXISTS idx_industry_prompts_status ON social_geni.industry_prompts (status);

-- -------------------------------------------------------------------
-- Row Level Security hardening (Phase 4)
-- NOTE:
-- - Policies are primarily effective for JWT-scoped PostgREST paths.
-- - Service-role / bypass-RLS connections can still access all rows.
-- - In plain Postgres environments (without Supabase auth schema),
--   this block is skipped to avoid startup failures.
-- -------------------------------------------------------------------

DO $$
DECLARE
  has_auth_schema BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_namespace
    WHERE nspname = 'auth'
  ) INTO has_auth_schema;

  IF NOT has_auth_schema THEN
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE social_geni.kits ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE social_geni.kit_interactions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE social_geni.notifications ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE social_geni.monthly_usage_counters ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE social_geni.kit_delete_audit ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'social_geni'
      AND tablename = 'kits'
      AND policyname = 'kits_owner_rw'
  ) THEN
    EXECUTE 'CREATE POLICY kits_owner_rw ON social_geni.kits
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'social_geni'
      AND tablename = 'kit_interactions'
      AND policyname = 'kit_interactions_owner_rw'
  ) THEN
    EXECUTE 'CREATE POLICY kit_interactions_owner_rw ON social_geni.kit_interactions
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'social_geni'
      AND tablename = 'notifications'
      AND policyname = 'notifications_owner_rw'
  ) THEN
    EXECUTE 'CREATE POLICY notifications_owner_rw ON social_geni.notifications
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'social_geni'
      AND tablename = 'monthly_usage_counters'
      AND policyname = 'monthly_usage_owner_rw'
  ) THEN
    EXECUTE 'CREATE POLICY monthly_usage_owner_rw ON social_geni.monthly_usage_counters
      USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'social_geni'
      AND tablename = 'kit_delete_audit'
      AND policyname = 'kit_delete_audit_admin_read'
  ) THEN
    EXECUTE 'CREATE POLICY kit_delete_audit_admin_read ON social_geni.kit_delete_audit
      FOR SELECT
      USING (COALESCE((auth.jwt() ->> ''is_admin'')::boolean, false))';
  END IF;
END $$;
`;

function splitDdlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let dollarTag: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (!inSingleQuote) {
      if (ch === "$") {
        const tail = sql.slice(i);
        const openMatch = tail.match(/^\$[A-Za-z_][A-Za-z0-9_]*\$/) ?? tail.match(/^\$\$/);
        if (openMatch) {
          const tag = openMatch[0];
          if (!dollarTag) {
            dollarTag = tag;
          } else if (dollarTag === tag) {
            dollarTag = null;
          }
          current += tag;
          i += tag.length - 1;
          continue;
        }
      }
    }

    if (!dollarTag && ch === "'" && next === "'") {
      current += "''";
      i++;
      continue;
    }

    if (!dollarTag && ch === "'") {
      inSingleQuote = !inSingleQuote;
      current += ch;
      continue;
    }

    if (!dollarTag && !inSingleQuote && ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const trailing = current.trim();
  if (trailing.length > 0) statements.push(trailing);
  return statements;
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const stmt of splitDdlStatements(DDL)) {
      await client.query(stmt);
    }
  } finally {
    client.release();
  }
}
