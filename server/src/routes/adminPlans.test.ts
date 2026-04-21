import { beforeEach, describe, expect, it, vi } from "vitest";

const isAgencyAdminRequest = vi.fn();
const getAuthUser = vi.fn();

vi.mock("../middleware/agencyAdminAuth.js", () => ({
  isAgencyAdminRequest,
}));

vi.mock("../middleware/userAuth.js", () => ({
  getAuthUser,
}));

vi.mock("../db/index.js", () => ({
  db: {},
}));

describe("admin plans auth boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAgencyAdminRequest.mockResolvedValue(false);
    getAuthUser.mockReturnValue(null);
    process.env.API_SECRET = "service-secret";
  });

  it("rejects API_SECRET bearer-only access to admin endpoints", async () => {
    const { createAdminPlansRouter } = await import("./adminPlans.js");
    const app = createAdminPlansRouter(async (_c, next) => next());

    const res = await app.request("/api/admin/users", {
      headers: {
        Authorization: "Bearer service-secret",
      },
    });

    expect(res.status).toBe(401);
  });

  it("rejects API_SECRET bearer-only access to premium upgrade endpoint", async () => {
    const { createAdminPlansRouter } = await import("./adminPlans.js");
    const app = createAdminPlansRouter(async (_c, next) => next());

    const res = await app.request("/api/admin/users/user-1/upgrade", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer service-secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_premium: true }),
    });

    expect(res.status).toBe(401);
  });
});
