import { describe, expect, it } from "vitest";
import { normalizeViewerUiPreferences } from "./KitViewer";

describe("normalizeViewerUiPreferences", () => {
  it("returns safe defaults when preferences are missing", () => {
    const normalized = normalizeViewerUiPreferences(undefined);
    expect(normalized).toEqual({
      lang: "ar",
      open_map: {},
      open_platforms: {},
      open_days: {},
    });
  });

  it("normalizes persisted grouped-state maps and language", () => {
    const normalized = normalizeViewerUiPreferences({
      lang: "en",
      open_map: { "kit-section-posts": 1, "kit-section-video": 0 },
      open_platforms: { instagram: true },
      open_days: { "instagram-Day 1": "yes" },
    });
    expect(normalized.lang).toBe("en");
    expect(normalized.open_map["kit-section-posts"]).toBe(true);
    expect(normalized.open_map["kit-section-video"]).toBe(false);
    expect(normalized.open_platforms.instagram).toBe(true);
    expect(normalized.open_days["instagram-Day 1"]).toBe(true);
  });
});
