import { test, expect } from "@playwright/test";

test.describe("API Health Checks", () => {
  test("GET /api/health returns 200", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.database).toBeDefined();
  });

  test("GET /api/diagnostics returns 200 with check results", async ({
    request,
  }) => {
    const response = await request.get("/api/diagnostics");

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Verify response structure
    expect(body.summary).toBeDefined();
    expect(body.summary.total).toBeGreaterThan(0);
    expect(body.summary.passed).toBeGreaterThan(0);
    expect(body.checks).toBeDefined();
    expect(Array.isArray(body.checks)).toBe(true);

    // DB connection should always pass
    const dbCheck = body.checks.find(
      (c: { name: string }) => c.name === "DB Connection"
    );
    expect(dbCheck).toBeDefined();
    expect(dbCheck.status).toBe("pass");
  });

  test("GET /api/diagnostics has no critical failures", async ({
    request,
  }) => {
    const response = await request.get("/api/diagnostics");
    const body = await response.json();

    // Log any failures for debugging
    const failures = body.checks.filter(
      (c: { status: string }) => c.status === "fail"
    );

    // Allow warnings but flag failures
    // The summary.failed count should be 0 for a healthy system
    if (failures.length > 0) {
      const failureNames = failures.map(
        (f: { name: string; error?: string }) =>
          `${f.name}: ${f.error ?? "unknown"}`
      );
      // eslint-disable-next-line no-console
      console.warn("Diagnostic failures:", failureNames);
    }

    expect(body.summary.failed).toBe(0);
  });
});
