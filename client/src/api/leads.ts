import { apiUrl, ApiError, buildHeaders, parseErrorMessage } from "./httpClient";

export type PremiumLeadPayload = {
  name: string;
  phone: string;
  email?: string;
};

export async function submitPremiumLead(payload: PremiumLeadPayload): Promise<{ ok: true }> {
  const res = await fetch(apiUrl("/api/leads/premium-request"), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new ApiError(await parseErrorMessage(res, "Failed to submit premium request"), res.status);
  return res.json() as Promise<{ ok: true }>;
}
