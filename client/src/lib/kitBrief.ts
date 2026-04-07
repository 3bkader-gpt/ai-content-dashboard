/** Parse brief_json from kit summaries — shared by Dashboard, Kit detail, search. */
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
    return o.industry ?? "—";
  } catch {
    return "—";
  }
}
