import { test, expect } from "@playwright/test";

test("dashboard and wizard shells load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Content Wizard/i })).toBeVisible();

  await page.getByRole("link", { name: /Content Wizard/i }).click();
  await expect(page).toHaveURL(/\/wizard$/);
  await expect(page.getByRole("heading", { name: /masterpiece/i })).toBeVisible();

  await page.getByRole("button", { name: /Start wizard/i }).first().click();
  await expect(page.getByRole("heading", { name: /Content creation wizard/i })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: /^Help$/i }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole("heading", { name: /illuminate/i })).toBeVisible();

  await page.goto("/integrations");
  await expect(page.getByRole("heading", { name: /Integrations Hub/i })).toBeVisible();
});
