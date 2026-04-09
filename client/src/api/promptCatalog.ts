import { apiUrl, ApiError, buildHeaders, parseErrorMessage } from "./httpClient";

export type PromptCatalogIndustry = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  active_prompt_version_id: string | null;
  active_prompt_version: number | null;
};

export type PromptCatalogPrompt = {
  id: string;
  industry_id: string | null;
  version: number;
  status: "draft" | "active";
  prompt_template: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export async function listPromptCatalogIndustries(): Promise<{ items: PromptCatalogIndustry[] }> {
  const res = await fetch(apiUrl("/api/prompt-catalog/industries"), { headers: buildHeaders() });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "Failed to load industries"), res.status);
  return res.json() as Promise<{ items: PromptCatalogIndustry[] }>;
}

export async function createPromptCatalogIndustry(payload: {
  slug: string;
  name: string;
  is_active?: boolean;
}): Promise<PromptCatalogIndustry> {
  const res = await fetch(apiUrl("/api/prompt-catalog/industries"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "Failed to create industry"), res.status);
  return res.json() as Promise<PromptCatalogIndustry>;
}

export async function listPromptVersions(industrySlug?: string): Promise<{
  items: PromptCatalogPrompt[];
  required_variables: readonly string[];
}> {
  const qs = industrySlug ? `?industry_slug=${encodeURIComponent(industrySlug)}` : "";
  const res = await fetch(apiUrl(`/api/prompt-catalog/prompts${qs}`), { headers: buildHeaders() });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "Failed to load prompt versions"), res.status);
  return res.json() as Promise<{ items: PromptCatalogPrompt[]; required_variables: readonly string[] }>;
}

export async function createPromptVersion(payload: {
  industry_slug?: string | null;
  prompt_template: string;
  notes?: string;
  status?: "draft" | "active";
}): Promise<{
  item: PromptCatalogPrompt;
  template_warnings?: { missing_variables: string[] };
}> {
  const res = await fetch(apiUrl("/api/prompt-catalog/prompts"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string; missing_variables?: string[] };
    let msg = j.error ?? "Failed to create prompt version";
    if (j.missing_variables?.length) {
      msg += ` — Missing placeholders: ${j.missing_variables.map((v) => `{{${v}}}`).join(", ")}`;
    }
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<{ item: PromptCatalogPrompt; template_warnings?: { missing_variables: string[] } }>;
}

export async function activatePromptVersion(id: string): Promise<{ item: PromptCatalogPrompt }> {
  const res = await fetch(apiUrl(`/api/prompt-catalog/prompts/${id}/activate`), {
    method: "POST",
    headers: buildHeaders(),
  });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "Failed to activate prompt version"), res.status);
  return res.json() as Promise<{ item: PromptCatalogPrompt }>;
}

export async function deletePromptVersion(id: string): Promise<{ ok: true }> {
  const res = await fetch(apiUrl(`/api/prompt-catalog/prompts/${id}`), {
    method: "DELETE",
    headers: buildHeaders(),
  });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "Failed to delete prompt version"), res.status);
  return res.json() as Promise<{ ok: true }>;
}

export async function getFallbackPrompt(): Promise<{ item: PromptCatalogPrompt }> {
  const res = await fetch(apiUrl("/api/prompt-catalog/fallback"), { headers: buildHeaders() });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "No active fallback prompt"), res.status);
  return res.json() as Promise<{ item: PromptCatalogPrompt }>;
}

export async function validatePromptTemplate(prompt_template: string): Promise<{
  ok: boolean;
  missing_variables: string[];
  found_variables: string[];
  mode?: "creative_only" | "template_placeholders";
  required_variables: readonly string[];
  strict_mode?: boolean;
}> {
  const res = await fetch(apiUrl("/api/prompt-catalog/prompts/validate"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ prompt_template }),
  });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "Prompt validation failed"), res.status);
  return res.json() as Promise<{
    ok: boolean;
    missing_variables: string[];
    found_variables: string[];
    mode?: "creative_only" | "template_placeholders";
    required_variables: readonly string[];
    strict_mode?: boolean;
  }>;
}
