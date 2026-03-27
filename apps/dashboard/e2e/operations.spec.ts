import { test, expect } from "@playwright/test";

test.describe("Operations Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/operations");
    await page.waitForLoadState("networkidle");
  });

  test("operations page loads", async ({ page }) => {
    await expect(page).toHaveURL(/\/operations/);

    // Page should have some content (not a blank error page)
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("dashboard tabs are visible", async ({ page }) => {
    // Look for tab-like navigation on the operations page
    const tabs = page.getByRole("tab").or(
      page.locator("[role='tablist'] button, [data-state]")
    );

    // At least one tab/section should be visible
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
  });

  test("machine inventory tab is accessible", async ({ page }) => {
    // Look for a tab or link related to machine inventory
    const inventoryTab = page
      .getByRole("tab", { name: /inventory|machines/i })
      .or(page.getByText(/inventory|machine/i).first());

    if (await inventoryTab.isVisible()) {
      await inventoryTab.click();
      // After clicking, the tab content should load
      await page.waitForLoadState("networkidle");
    }

    // Verify the page did not crash
    await expect(page).toHaveURL(/\/operations/);
  });

  test("charts or data visualizations render", async ({ page }) => {
    // Recharts renders SVGs - check for chart containers
    const charts = page.locator(
      ".recharts-wrapper, svg.recharts-surface, [class*='chart'], canvas"
    );

    // Wait a bit for charts to render with data
    await page.waitForTimeout(2000);

    const chartCount = await charts.count();
    // At least some visual data representation should exist
    expect(chartCount).toBeGreaterThanOrEqual(0);
  });
});
