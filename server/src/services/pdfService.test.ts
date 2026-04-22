import { describe, expect, it } from "vitest";
import { buildKitPdfHtml, sanitizeKitForPdf } from "./pdfService.js";

describe("pdfService", () => {
  it("removes image/video prompt fields from result json", () => {
    const sanitized = sanitizeKitForPdf({
      id: "k1",
      brief_json: "{\"brand_name\":\"Florenza\"}",
      created_at: "2026-04-22T10:00:00.000Z",
      result_json: {
        posts: [{ caption_ar: "A" }],
        image_prompts: [{ full_ai_image_prompt: "remove-me" }],
        video_prompts: [{ ai_tool_instructions: "remove-me" }],
        image_designs: [{ full_ai_image_prompt: "remove-me-too", caption_ar: "img caption" }],
      },
    });

    const result = sanitized.result_json as Record<string, unknown>;
    expect(result.image_prompts).toBeUndefined();
    expect(result.video_prompts).toBeUndefined();

    const imageDesigns = result.image_designs as Array<Record<string, unknown>>;
    expect(imageDesigns[0]?.full_ai_image_prompt).toBeUndefined();
  });

  it("builds html safely when optional sections are missing", async () => {
    const html = await buildKitPdfHtml({
      id: "k2",
      brief_json: "{\"brand_name\":\"Minimal Brand\"}",
      created_at: "2026-04-22T10:00:00.000Z",
      result_json: {
        posts: [],
      },
    });

    expect(html).toContain("Minimal Brand");
    expect(html).toContain("k2");
    expect(html).toContain("Agency Export");
  });
});
