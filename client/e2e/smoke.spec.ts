import { test, expect } from "@playwright/test";

test("dashboard and wizard shells load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Launch Wizard/i }).first()).toBeVisible();
  await page.getByRole("link", { name: /Launch Wizard/i }).first().click();
  await expect(page).toHaveURL(/\/wizard\/social$/);
  await expect(page.getByRole("heading", { name: /Social Campaign Wizard/i })).toBeVisible();

  await page.goto("/help");
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole("heading", { name: /How can we help\?/i })).toBeVisible();

  await page.goto("/integrations");
  await expect(page).toHaveURL(/\/integrations$/);
  await expect(page.getByRole("heading", { name: /Integrations/i })).toBeVisible();
});
