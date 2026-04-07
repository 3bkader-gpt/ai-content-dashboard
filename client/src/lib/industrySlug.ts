/** Mirrors server `normalizeIndustrySlug` in `promptResolver.ts`. */
export function normalizeIndustrySlug(value: string): string {
  const base = String(value ?? "").trim().toLowerCase();
  if (!base) return "general";
  return (
    base
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
      .replace(/-{2,}/g, "-") || "general"
  );
}
