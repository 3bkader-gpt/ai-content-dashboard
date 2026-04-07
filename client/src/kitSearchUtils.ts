import type { KitSummary } from "./types";

export function briefBrand(json: string): string {
  try {
    const o = JSON.parse(json) as { brand_name?: string };
    return o.brand_name ?? "";
  } catch {
    return "";
  }
}

export function briefIndustry(json: string): string {
  try {
    const o = JSON.parse(json) as { industry?: string };
    return o.industry ?? "";
  } catch {
    return "";
  }
}

export function filterKitsByQuery(kits: KitSummary[], q: string): KitSummary[] {
  const s = q.trim().toLowerCase();
  if (!s) return kits;
  return kits.filter((k) => {
    const brand = briefBrand(k.brief_json).toLowerCase();
    const ind = briefIndustry(k.brief_json).toLowerCase();
    const id = k.id.toLowerCase();
    const badge = k.status_badge.toLowerCase();
    return brand.includes(s) || ind.includes(s) || id.includes(s) || badge.includes(s);
  });
}
