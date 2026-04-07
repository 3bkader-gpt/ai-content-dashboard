/**
 * When true, prompt catalog saves and kit generation require a "complete" template contract.
 * Default is false: save/generate are allowed; missing placeholders render as empty strings.
 */
export function isStrictPromptTemplates(): boolean {
  const v = String(process.env.STRICT_PROMPT_TEMPLATES ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
