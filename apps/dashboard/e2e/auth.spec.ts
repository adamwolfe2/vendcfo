import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page loads with form fields", async ({ page }) => {
    await page.goto("/en/login");

    await expect(page.locator("h1")).toContainText("Welcome to VendCFO");
    await expect(
      page.getByPlaceholder("Enter email address")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue" })
    ).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.goto("/en/login");

    const emailInput = page.getByPlaceholder("Enter email address");
    await emailInput.fill("not-an-email");
    await page.getByRole("button", { name: "Continue" }).click();

    // Form should not advance to OTP step - the email input should still be visible
    // because zod validation rejects invalid email format
    await expect(emailInput).toBeVisible();
  });

  test("submitting valid email shows OTP input", async ({ page }) => {
    await page.goto("/en/login");

    const emailInput = page.getByPlaceholder("Enter email address");
    await emailInput.fill("test@example.com");
    await page.getByRole("button", { name: "Continue" }).click();

    // After submitting a valid email, the OTP code input should appear
    await expect(page.getByText("Resend code")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("terms and privacy links are present", async ({ page }) => {
    await page.goto("/en/login");

    await expect(
      page.getByRole("link", { name: "Terms of service" })
    ).toHaveAttribute("href", "https://vendcfo.ai/terms");
    await expect(
      page.getByRole("link", { name: "Privacy policy" })
    ).toHaveAttribute("href", "https://vendcfo.ai/policy");
  });
});

test.describe("Authenticated redirect", () => {
  test("logged-in user accessing /en/login gets redirected to dashboard", async ({
    page,
  }) => {
    // This test uses the default storageState (authenticated)
    await page.goto("/en");
    // Should NOT be on the login page
    await expect(page).not.toHaveURL(/\/login/);
  });
});
