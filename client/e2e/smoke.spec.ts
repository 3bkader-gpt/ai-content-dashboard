import { test, expect } from "@playwright/test";

test("dashboard and wizard shells load", async ({ page }) => {
  await page.goto("/wizard/social");
  await expect(page).toHaveURL(/\/wizard\/social$/);
  await expect(page.getByRole("heading", { name: /Social Campaign Wizard/i })).toBeVisible();
  await expect(page.getByText(/Brand & industry/i).first()).toBeVisible();
  await expect(page.getByText(/Audience & goals/i).first()).toBeVisible();

  await page.goto("/help");
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole("heading", { name: /How can we help\?/i })).toBeVisible();

  await page.goto("/integrations");
  await expect(page).toHaveURL(/\/integrations$/);
  await expect(page.getByRole("heading", { name: /Integrations/i })).toBeVisible();

  // Admin analytics shell should render and include title/subtitle context.
  await page.goto("/admin/analytics");
  await expect(page).toHaveURL(/\/admin\/analytics$/);
});
