import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { G_LIMITS } from "./constants.js";
import { expectedHooksTotal } from "./packageConstants.js";

type MaxKitFixture = {
  limits_snapshot: {
    num_posts_max: number;
    num_image_designs_max: number;
    num_video_prompts_max: number;
    content_package_idea_count_max: number;
  };
  brief: {
    num_posts: number;
    num_image_designs: number;
    num_video_prompts: number;
    content_package_idea_count: number;
  };
  result_json: {
    posts: unknown[];
    image_designs: unknown[];
    video_prompts: unknown[];
    content_ideas_package: {
      ideas: unknown[];
      hooks: unknown[];
      templates: unknown[];
    };
  };
  validation_expectations: {
    posts_count: number;
    image_designs_count: number;
    video_prompts_count: number;
    content_ideas_ideas_count: number;
    content_ideas_hooks_count: number;
    content_ideas_templates_count: number;
  };
};

async function readMaxKitFixture(): Promise<MaxKitFixture> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fixturePath = path.resolve(__dirname, "../../../test-fixtures/kits/max-content-kit.json");
  const raw = await fs.readFile(fixturePath, "utf-8");
  return JSON.parse(raw) as MaxKitFixture;
}

describe("max kit fixture", () => {
  it("matches server hard limits and expected max counts", async () => {
    const fixture = await readMaxKitFixture();

    expect(fixture.limits_snapshot.num_posts_max).toBe(G_LIMITS.num_posts.max);
    expect(fixture.limits_snapshot.num_image_designs_max).toBe(G_LIMITS.num_image_designs.max);
    expect(fixture.limits_snapshot.num_video_prompts_max).toBe(G_LIMITS.num_video_prompts.max);
    expect(fixture.limits_snapshot.content_package_idea_count_max).toBe(G_LIMITS.content_package_ideas.max);

    expect(fixture.brief.num_posts).toBe(G_LIMITS.num_posts.max);
    expect(fixture.brief.num_image_designs).toBe(G_LIMITS.num_image_designs.max);
    expect(fixture.brief.num_video_prompts).toBe(G_LIMITS.num_video_prompts.max);
    expect(fixture.brief.content_package_idea_count).toBe(G_LIMITS.content_package_ideas.max);

    expect(fixture.result_json.posts.length).toBe(fixture.validation_expectations.posts_count);
    expect(fixture.result_json.image_designs.length).toBe(fixture.validation_expectations.image_designs_count);
    expect(fixture.result_json.video_prompts.length).toBe(fixture.validation_expectations.video_prompts_count);
    expect(fixture.result_json.content_ideas_package.ideas.length).toBe(
      fixture.validation_expectations.content_ideas_ideas_count
    );
    expect(fixture.result_json.content_ideas_package.hooks.length).toBe(
      fixture.validation_expectations.content_ideas_hooks_count
    );
    expect(fixture.result_json.content_ideas_package.templates.length).toBe(
      fixture.validation_expectations.content_ideas_templates_count
    );

    expect(fixture.result_json.content_ideas_package.hooks.length).toBe(
      expectedHooksTotal(fixture.result_json.content_ideas_package.ideas.length)
    );
  });
});
