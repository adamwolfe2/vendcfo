import { test, expect } from "@playwright/test";

test.describe("Transactions Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/transactions");
    await page.waitForLoadState("networkidle");
  });

  test("transactions page loads", async ({ page }) => {
    await expect(page).toHaveURL(/\/transactions/);

    // Page should render without errors
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("transaction list or table is visible", async ({ page }) => {
    // Look for a table or list of transactions
    const table = page
      .getByRole("table")
      .or(page.locator("[data-testid='transactions-table']"))
      .or(page.locator("table, [class*='table']"))
      .first();

    await expect(table).toBeVisible({ timeout: 15_000 });
  });

  test("filter controls exist", async ({ page }) => {
    // Look for filter UI elements (search, dropdowns, date pickers)
    const filterElements = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/search|filter/i))
      .or(page.getByRole("combobox"))
      .or(page.locator("input[type='search'], input[type='date']"))
      .or(page.locator("[data-testid*='filter']"));

    const count = await filterElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test("page does not show error state", async ({ page }) => {
    // Ensure no error boundaries or error messages are showing
    const errorIndicators = page.locator(
      "[data-testid='error'], .error-boundary, [class*='error']"
    );

    // Wait for content to settle
    await page.waitForTimeout(1000);

    // Check that obvious error states are not present
    const errorText = page.getByText(/something went wrong|error occurred/i);
    await expect(errorText).not.toBeVisible();
  });
});
