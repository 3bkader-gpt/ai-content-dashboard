export const CAMPAIGN_MODES = ["social", "offer", "deep"] as const;
export type CampaignMode = (typeof CAMPAIGN_MODES)[number];

export function normalizeCampaignMode(raw: unknown): CampaignMode {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "social" || s === "offer" || s === "deep") return s;
  return "social";
}

/**
 * Prepended to the industry template so the model behaves like a Creative Director for this path.
 * Keep concise: industry-specific detail stays in the catalog template below.
 */
export function campaignModeInstructionBlock(mode: CampaignMode): string {
  const blocks: Record<CampaignMode, string> = {
    social:
      "[Creative direction: SOCIAL — reach & engagement]\n" +
      "Act as a social-first creative lead. Prioritize scroll-stopping hooks (first line tension), platform-native pacing, and share/comment triggers. " +
      "Mix short punchy lines with one clear CTA to follow or engage — not hard sell. " +
      "Arabic tone: خفيف، صايع، مناسب للفيديو القصير والكاروسيل.\n\n",
    offer:
      "[Creative direction: OFFER — conversion]\n" +
      "Act as a performance creative: lead with the offer and outcome, stack proof or specificity, then urgency/scarcity only if it fits the brand voice. " +
      "Every asset should ladder to one primary conversion (book, buy, DM). " +
      "Arabic tone: واضح، مبيعاتي بذكاء، بدون مبالغة فارغة.\n\n",
    deep:
      "[Creative direction: DEEP — authority & trust]\n" +
      "Act as a subject-matter expert: teach, structure arguments, and show credibility (frameworks, steps, nuance). " +
      "Favor depth over hype; long captions, explainer angles, and thoughtful video scripts. " +
      "Arabic tone: رزينة، خبيرة، مناسبة لمحتوى تعليمي وثقة.\n\n",
  };
  return blocks[mode];
}
