import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const kits = sqliteTable("kits", {
  id: text("id").primaryKey(),
  briefJson: text("brief_json").notNull(),
  resultJson: text("result_json"),
  deliveryStatus: text("delivery_status").notNull(),
  modelUsed: text("model_used").notNull(),
  lastError: text("last_error").notNull().default(""),
  correlationId: text("correlation_id").notNull(),
  promptVersionId: text("prompt_version_id"),
  isFallback: integer("is_fallback", { mode: "boolean" }).notNull().default(false),
  rowVersion: integer("row_version").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const idempotencyKeys = sqliteTable("idempotency_keys", {
  keyHash: text("key_hash").primaryKey(),
  briefHash: text("brief_hash").notNull(),
  kitId: text("kit_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export type KitRow = typeof kits.$inferSelect;

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull(),
  kitId: text("kit_id"),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const userProfile = sqliteTable("user_profile", {
  id: integer("id").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  email: text("email").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const appPreferences = sqliteTable("app_preferences", {
  id: integer("id").primaryKey(),
  compactTable: integer("compact_table", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const brandVoice = sqliteTable("brand_voice", {
  id: integer("id").primaryKey(),
  pillarsJson: text("pillars_json").notNull(),
  avoidWordsJson: text("avoid_words_json").notNull(),
  sampleSnippet: text("sample_snippet").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const extrasWaitlist = sqliteTable("extras_waitlist", {
  id: text("id").primaryKey(),
  toolId: text("tool_id").notNull(),
  email: text("email").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const industries = sqliteTable("industries", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const industryPrompts = sqliteTable("industry_prompts", {
  id: text("id").primaryKey(),
  industryId: text("industry_id"),
  version: integer("version").notNull(),
  status: text("status").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
