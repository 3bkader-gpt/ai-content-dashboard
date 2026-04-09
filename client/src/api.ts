export { ApiError } from "./api/httpClient";
export { generateKit, listKits, getKit, retryKit } from "./api/kits";
export { listNotifications, markAllNotificationsRead } from "./api/notifications";
export type { NotificationItem } from "./api/notifications";
export {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
  getBrandVoice,
  updateBrandVoice,
} from "./api/profile";
export type { StudioProfile, StudioPreferences, BrandVoicePillar, BrandVoicePayload } from "./api/profile";
export {
  listPromptCatalogIndustries,
  createPromptCatalogIndustry,
  listPromptVersions,
  createPromptVersion,
  activatePromptVersion,
  deletePromptVersion,
  getFallbackPrompt,
  validatePromptTemplate,
} from "./api/promptCatalog";
export type { PromptCatalogIndustry, PromptCatalogPrompt } from "./api/promptCatalog";
export { getHelpTopics, postExtrasWaitlist, getHealth } from "./api/misc";
export type { HelpTopicsResponse } from "./api/misc";

import { regenerateKitItem as regenerateKitItemCore } from "./api/kits";
import type { KitSummary } from "./types";

export async function regenerateKitItem(
  id: string,
  item_type: "post" | "image" | "video",
  index: number,
  row_version: number,
  feedback?: string
): Promise<KitSummary> {
  return regenerateKitItemCore(id, item_type, index, row_version, feedback);
}
