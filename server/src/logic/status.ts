export function normalizeDeliveryStatus(status: string): string {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (!normalized) return "";
  if (normalized.indexOf("failed_generation") !== -1) return "failed_generation";
  if (normalized.indexOf("retry_in_progress") !== -1) return "retry_in_progress";
  if (normalized.indexOf("generated_email_failed") !== -1) return "generated_email_failed";
  if (normalized.indexOf("generated_invalid_email") !== -1) return "generated_invalid_email";
  if (normalized.indexOf("generated_no_email") !== -1) return "generated_no_email";
  if (normalized === "sent") return "sent";
  if (normalized === "generated") return "generated";

  return normalized;
}

export function getStatusBadgeLabel(status: string): string {
  const normalized = normalizeDeliveryStatus(status);

  if (!normalized) return "-";
  if (normalized === "retry_in_progress") return "Running";
  if (normalized === "failed_generation") return "Failed";
  return "Done";
}

export type BadgePalette = { bg: string; fg: string; border: string };

export function getStatusBadgePalette(status: string): BadgePalette {
  const normalized = normalizeDeliveryStatus(status);

  if (normalized === "retry_in_progress") {
    return { bg: "#fff8e1", fg: "#8a5300", border: "#ffd54f" };
  }

  if (normalized === "failed_generation") {
    return { bg: "#ffebee", fg: "#b71c1c", border: "#ef9a9a" };
  }

  if (normalized) {
    return { bg: "#e8f5e9", fg: "#1b5e20", border: "#a5d6a7" };
  }

  return { bg: "#eceff1", fg: "#37474f", border: "#cfd8dc" };
}
