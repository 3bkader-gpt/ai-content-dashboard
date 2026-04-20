# Database schema (Drizzle / PostgreSQL)

**Canonical source:** [server/src/db/schema.ts](../server/src/db/schema.ts).  
**Migrations / boot DDL:** [server/src/db/migrations.ts](../server/src/db/migrations.ts).

**Schema namespace:** `social_geni` (all tables below live in this PostgreSQL schema).

> **Maintenance:** After changing `schema.ts`, update this document so agents proposing telemetry or new tables do not conflict with existing structures.

---

## Tables overview

| Table | Primary key | Purpose |
|-------|-------------|---------|
| `kits` | `id` (text) | Core artifact: brief, result JSON, delivery status, tokens, row version |
| `kit_interactions` | `id` (text) | Viewer interaction telemetry linked to kits |
| `idempotency_keys` | `key_hash` | Idempotent generate mapping |
| `users` | `id` | App user linked to Supabase |
| `user_devices` | `id` | Device ↔ user linkage; `device_id` unique |
| `plan_subscriptions` | `id` | Plan periods per user |
| `monthly_usage_counters` | `id` | Usage per period (video/image/kits/regenerate/retry) |
| `kit_failure_logs` | `id` | Failure diagnostics |
| `notifications` | `id` | In-app notifications |
| `user_profile` | `id` | Profile fields; `user_id` unique |
| `app_preferences` | `id` | UI prefs; `user_id` unique |
| `brand_voice` | `id` | Pillars / avoid words / sample; `user_id` unique |
| `extras_waitlist` | `id` | Waitlist signups |
| `industries` | `id` | Prompt catalog industries |
| `industry_prompts` | `id` | Versioned prompt templates |

**Foreign keys:** Not declared as FK constraints in Drizzle excerpt; relations are by convention (`user_id`, `kit_id`, `industry_id` text references). Verify in migrations if enforcing FKs.

---

## `kits` (columns)

| Column | Type | Notes |
|--------|------|--------|
| `id` | text | PK |
| `device_id` | text | Default `''` |
| `user_id` | text | Nullable |
| `brief_json` | text | Stringified wizard payload |
| `target_audience_v2` | jsonb | `string[]` |
| `platforms_v2` | jsonb | `string[]` |
| `best_content_types_v2` | jsonb | `string[]` |
| `ui_preferences` | jsonb | Viewer UI state (`lang`, open section maps) |
| `result_json` | text | Nullable; stringified kit JSON |
| `delivery_status` | text | |
| `model_used` | text | |
| `last_error` | text | Default `''` |
| `correlation_id` | text | |
| `prompt_version_id` | text | Nullable |
| `is_fallback` | boolean | Default false |
| `prompt_tokens` | integer | Default 0 |
| `completion_tokens` | integer | Default 0 |
| `total_tokens` | integer | Default 0 |
| `row_version` | integer | Optimistic concurrency |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## `idempotency_keys`

| Column | Type |
|--------|------|
| `key_hash` | text PK |
| `brief_hash` | text |
| `kit_id` | text |
| `expires_at` | bigint |

---

## `kit_interactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `kit_id` | text | Owning kit ID |
| `user_id` | text nullable | Owner user when authenticated |
| `device_id` | text | Owner device |
| `interaction_type` | text | Action type (`copy_action`, toggles, etc.) |
| `meta_json` | jsonb | Optional metadata payload |
| `created_at`, `updated_at` | timestamptz | |

---

## `users`

| Column | Type |
|--------|------|
| `id` | text PK |
| `supabase_user_id` | text unique |
| `email` | text |
| `display_name` | text |
| `is_admin` | boolean |
| `created_at`, `updated_at` | timestamptz |

---

## `user_devices`

| Column | Type |
|--------|------|
| `id` | text PK |
| `user_id` | text |
| `device_id` | text unique |
| `created_at`, `updated_at` | timestamptz |

---

## `plan_subscriptions`

| Column | Type |
|--------|------|
| `id` | text PK |
| `user_id` | text |
| `plan_code` | text |
| `status` | text |
| `period_start` | timestamptz |
| `period_end` | timestamptz nullable |
| `created_at`, `updated_at` | timestamptz |

---

## `monthly_usage_counters`

| Column | Type |
|--------|------|
| `id` | text PK |
| `user_id` | text nullable |
| `device_id` | text nullable |
| `period_key` | text |
| `video_prompts_used` | integer |
| `image_prompts_used` | integer |
| `kits_used` | integer |
| `regenerate_used` | integer |
| `retry_used` | integer |
| `created_at`, `updated_at` | timestamptz |

---

## `kit_failure_logs`

| Column | Type |
|--------|------|
| `id` | text PK |
| `kit_id` | text nullable |
| `phase` | text |
| `error_code` | text |
| `error_message` | text |
| `correlation_id` | text |
| `model_used` | text |
| `meta_json` | text default `{}` |
| `created_at` | timestamptz |

---

## `notifications`

| Column | Type |
|--------|------|
| `id` | text PK |
| `title`, `body`, `kind` | text |
| `kit_id` | text nullable |
| `read_at` | timestamptz nullable |
| `created_at` | timestamptz |

---

## `user_profile`

| Column | Type |
|--------|------|
| `id` | text PK |
| `user_id` | text unique |
| `display_name`, `email` | text |
| `updated_at` | timestamptz |

---

## `app_preferences`

| Column | Type |
|--------|------|
| `id` | text PK |
| `user_id` | text unique |
| `compact_table` | boolean |
| `updated_at` | timestamptz |

---

## `brand_voice`

| Column | Type |
|--------|------|
| `id` | text PK |
| `user_id` | text unique |
| `pillars_json` | text |
| `avoid_words_json` | text |
| `sample_snippet` | text |
| `updated_at` | timestamptz |

---

## `extras_waitlist`

| Column | Type |
|--------|------|
| `id` | text PK |
| `tool_id` | text |
| `email` | text |
| `created_at` | timestamptz |

---

## `industries`

| Column | Type |
|--------|------|
| `id` | text PK |
| `slug` | text unique |
| `name` | text |
| `is_active` | boolean |
| `created_at`, `updated_at` | timestamptz |

---

## `industry_prompts`

| Column | Type |
|--------|------|
| `id` | text PK |
| `industry_id` | text nullable |
| `version` | integer |
| `status` | text |
| `prompt_template` | text |
| `notes` | text |
| `created_at`, `updated_at` | timestamptz |

---

## Indexes

Define explicit indexes in **`migrations.ts`** if present; Drizzle `schema.ts` does not list all indexes. Query migrations for `CREATE INDEX` before assuming an index exists.
