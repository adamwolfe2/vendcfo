import { test, expect } from "@playwright/test";

test.describe("Dashboard Overview", () => {
  test("main dashboard loads after login", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    // Verify we are on the dashboard (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("sidebar navigation is visible", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    // The sidebar should be present in the layout
    const sidebar = page.locator("aside, nav, [data-testid='sidebar']").first();
    await expect(sidebar).toBeVisible({ timeout: 15_000 });
  });

  test("key sidebar navigation links exist", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    // Check for key navigation items by their link text or href
    const expectedLinks = [
      { name: /operations/i, href: /\/operations/ },
      { name: /finance/i, href: /\/finance/ },
      { name: /transactions/i, href: /\/transactions/ },
    ];

    for (const { name } of expectedLinks) {
      const link = page.getByRole("link", { name }).first();
      await expect(link).toBeVisible({ timeout: 10_000 });
    }
  });

  test("clicking Operations navigates to operations page", async ({
    page,
  }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    const opsLink = page.getByRole("link", { name: /operations/i }).first();
    await opsLink.click();

    await expect(page).toHaveURL(/\/operations/, { timeout: 15_000 });
  });
});
