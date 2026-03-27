import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD environment variables are required"
    );
  }

  // Ensure auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await page.goto("/en/login");
  await expect(page.locator("h1")).toContainText("Welcome to VendCFO");

  // The login form uses OTP (magic code) flow.
  // For E2E tests, we bypass the UI login by injecting Supabase session
  // cookies directly via the Supabase test helpers.
  //
  // Strategy: Use Supabase Admin API to generate a session for the test user,
  // then set the auth cookies so middleware sees a valid session.
  //
  // If password-based sign-in is enabled for the test user, we can use
  // signInWithPassword via the Supabase JS client.
  await page.evaluate(
    async ({ email, password }) => {
      const { createClient } = await import("@supabase/supabase-js");

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        ?? document.querySelector<HTMLMetaElement>('meta[name="supabase-url"]')?.content
        ?? "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ?? document.querySelector<HTMLMetaElement>('meta[name="supabase-anon-key"]')?.content
        ?? "";

      // Try to extract from window.__NEXT_DATA__ or inline scripts
      let url = supabaseUrl;
      let key = supabaseAnonKey;

      if (!url || !key) {
        // Fallback: look for env vars embedded in the page
        const scripts = document.querySelectorAll("script");
        for (const script of scripts) {
          const text = script.textContent ?? "";
          const urlMatch = text.match(/NEXT_PUBLIC_SUPABASE_URL['":\s]+"([^"]+)"/);
          const keyMatch = text.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY['":\s]+"([^"]+)"/);
          if (urlMatch) url = urlMatch[1];
          if (keyMatch) key = keyMatch[1];
        }
      }

      if (!url || !key) {
        throw new Error("Could not find Supabase URL and anon key on the page");
      }

      const supabase = createClient(url, key);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(`Supabase login failed: ${error.message}`);
      }
    },
    { email, password }
  );

  // Wait for auth cookies to be set
  await page.waitForTimeout(2000);

  // Verify login succeeded by navigating to the app
  await page.goto("/en");
  await page.waitForURL(/\/en(?!\/login)/, { timeout: 15_000 });

  // Save storage state for reuse across tests
  await page.context().storageState({ path: authFile });
});
