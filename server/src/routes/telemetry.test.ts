import { beforeEach, describe, expect, it, vi } from "vitest";

const selectLimit = vi.fn();
const selectWhere = vi.fn(() => ({ limit: selectLimit }));
const selectFrom = vi.fn(() => ({ where: selectWhere }));
const select = vi.fn(() => ({ from: selectFrom }));
const insertValues = vi.fn();
const insert = vi.fn(() => ({ values: insertValues }));

vi.mock("../db/index.js", () => ({
  db: {
    select,
    insert,
  },
}));

vi.mock("../services/subscriptionService.js", () => ({
  ensureUserFromSupabase: vi.fn(),
}));

async function appRequest(path: string, init?: RequestInit) {
  const { createTelemetryRouter } = await import("./telemetry.js");
  const app = createTelemetryRouter(async (_c, next) => next());
  return app.request(path, init);
}

describe("telemetry routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectLimit.mockResolvedValue([{ id: "kit-1" }]);
    insertValues.mockResolvedValue(undefined);
  });

  it("rejects invalid payload shape", async () => {
    const res = await appRequest("/api/telemetry/interaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": "8c4f674f-06d9-42fe-a930-4d16f8f77268",
      },
      body: JSON.stringify({ interaction_type: "copy_action" }),
    });
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("enforces kit ownership lookup before insert", async () => {
    selectLimit.mockResolvedValue([]);
    const res = await appRequest("/api/telemetry/interaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": "8c4f674f-06d9-42fe-a930-4d16f8f77268",
      },
      body: JSON.stringify({
        kit_id: "kit-missing",
        interaction_type: "copy_action",
      }),
    });
    expect(res.status).toBe(404);
    expect(insert).not.toHaveBeenCalled();
  });

  it("accepts valid event and inserts non-blocking", async () => {
    const res = await appRequest("/api/telemetry/interaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-ID": "8c4f674f-06d9-42fe-a930-4d16f8f77268",
      },
      body: JSON.stringify({
        kit_id: "kit-1",
        interaction_type: "section_toggle",
        meta: { section: "kit-section-posts", open: true },
      }),
    });
    expect(res.status).toBe(202);
    expect(insert).toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalled();
  });
});
