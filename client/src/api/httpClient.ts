export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const base = import.meta.env.VITE_API_URL ?? "";

export function buildHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...extra,
  };
}

export function apiUrl(path: string) {
  return `${base}${path}`;
}

export async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const j = await res.json().catch(() => ({}));
  return (j as { error?: string }).error ?? fallback;
}
