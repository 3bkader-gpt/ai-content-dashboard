import { describe, it, expect, afterEach, vi } from "vitest";
import { buildSubmissionSnapshot, sanitizeCount, extractFirstEmail, briefFingerprint } from "./parse.js";
import { getIndustryModule, isHighBudget, parseBudgetLevel } from "./industry.js";
import { normalizeDeliveryStatus, getStatusBadgeLabel, getStatusBadgePalette } from "./status.js";
import { validateGeminiResponse } from "./validate.js";
import { validatePromptTemplateContract } from "./promptTemplateValidation.js";
import { isStrictPromptTemplates } from "./promptStrictEnv.js";
import { campaignModeInstructionBlock } from "./campaignMode.js";

describe("parse", () => {
  it("sanitizes counts", () => {
    expect(sanitizeCount("x", 1, 10, 5)).toBe(5);
    expect(sanitizeCount("12 posts", 1, 10, 5)).toBe(10);
    expect(sanitizeCount(3, 1, 10, 5)).toBe(3);
  });

  it("extracts first email", () => {
    expect(extractFirstEmail("contact me at test@example.com thanks")).toBe("test@example.com");
  });

  it("brief fingerprint stable for same snapshot", () => {
    const a = buildSubmissionSnapshot({
      brand_name: "X",
      num_posts: 5,
      submitted_at: "2020-01-01T00:00:00.000Z",
    });
    const b = buildSubmissionSnapshot({
      brand_name: "X",
      num_posts: 5,
      submitted_at: "2020-01-01T00:00:00.000Z",
    });
    expect(briefFingerprint(a)).toBe(briefFingerprint(b));
  });

  it("normalizes campaign_mode", () => {
    expect(buildSubmissionSnapshot({ campaign_mode: "deep" }).campaign_mode).toBe("deep");
    expect(buildSubmissionSnapshot({}).campaign_mode).toBe("social");
    expect(buildSubmissionSnapshot({ campaign_mode: "bogus" }).campaign_mode).toBe("social");
  });
});

describe("industry", () => {
  it("clinic module includes Arabic طب", () => {
    expect(getIndustryModule("عيادة طب")).toContain("CLINIC");
  });

  it("high budget", () => {
    expect(isHighBudget("6")).toBe(true);
    expect(parseBudgetLevel("")).toBe(3);
  });
});

describe("status", () => {
  it("normalizes delivery statuses", () => {
    expect(normalizeDeliveryStatus("FAILED_GENERATION")).toBe("failed_generation");
    expect(getStatusBadgeLabel("failed_generation")).toBe("Failed");
    expect(getStatusBadgeLabel("retry_in_progress")).toBe("Running");
    expect(getStatusBadgePalette("failed_generation").fg).toContain("#");
  });
});

describe("promptTemplateValidation", () => {
  it("accepts farming_niche as alias for industry", () => {
    const t =
      "{{brand_name}}{{farming_niche}}{{target_audience}}{{main_goal}}{{platforms}}{{brand_tone}}{{offer}}{{num_posts}}{{num_image_designs}}{{num_video_prompts}}";
    const r = validatePromptTemplateContract(t);
    expect(r.ok).toBe(true);
  });
});

describe("campaignModeInstructionBlock", () => {
  it("returns non-empty blocks for each mode", () => {
    expect(campaignModeInstructionBlock("social").length).toBeGreaterThan(40);
    expect(campaignModeInstructionBlock("offer")).toContain("conversion");
    expect(campaignModeInstructionBlock("deep")).toContain("authority");
  });
});

describe("promptStrictEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to non-strict when STRICT_PROMPT_TEMPLATES unset", () => {
    vi.stubEnv("STRICT_PROMPT_TEMPLATES", "");
    expect(isStrictPromptTemplates()).toBe(false);
  });

  it("is strict when STRICT_PROMPT_TEMPLATES is true", () => {
    vi.stubEnv("STRICT_PROMPT_TEMPLATES", "true");
    expect(isStrictPromptTemplates()).toBe(true);
  });
});

describe("validate", () => {
  it("requires kpi for high budget", () => {
    const data = buildSubmissionSnapshot({ brand_name: "b", budget_level: "7", num_posts: 1, num_image_designs: 1, num_video_prompts: 1 });
    const bad = {
      posts: [{ platform: "x", format: "y", goal: "g", caption: "c", hashtags: ["#a"], cta: "x" }],
      image_designs: [
        {
          platform_format: "1:1",
          design_type: "d",
          goal: "g",
          visual_scene: "v",
          headline_text_overlay: "h",
          supporting_copy: "s",
          full_ai_image_prompt: "9:16 detailed",
          text_policy: "ar",
          conversion_trigger: "t",
        },
      ],
      video_prompts: [
        {
          platform: "p",
          duration: "15s",
          style: "s",
          hook_type: "h",
          scenes: [{ time: "0", label: "l", visual: "v", text: "t", audio: "a" }],
          ai_tool_instructions: "i",
          why_this_converts: "w",
        },
      ],
      marketing_strategy: {
        content_mix_plan: "a",
        weekly_posting_plan: "b",
        platform_strategy: "c",
        key_messaging_angles: ["d"],
        brand_positioning_statement: "e",
      },
      sales_system: {
        pain_points: ["p"],
        offer_structuring: "o",
        funnel_plan: "f",
        ad_angles: ["a"],
        objection_handling: [{ objection: "o", response: "r" }],
        cta_strategy: "c",
      },
      offer_optimization: {
        rewritten_offer: "r",
        urgency_or_scarcity: "u",
        alternative_offers: ["a"],
      },
    };
    expect(validateGeminiResponse(bad, data).some((e) => e.includes("kpi_tracking"))).toBe(true);
  });
});
