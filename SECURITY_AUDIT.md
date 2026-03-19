# VendCFO Security Audit Report

**Date:** 2026-03-19
**Auditor:** Adversarial Security Audit (AI-assisted)
**Scope:** Full application stack -- API routes, auth, database RLS, encryption, webhooks, headers
**Environment:** Production (vendcfo.vercel.app), Supabase project cvkffwnljbfueseaumcw

---

## Executive Summary

VendCFO is an AI-powered financial management platform handling bank connections (Plaid), encrypted passwords, QuickBooks OAuth tokens, and financial transaction data. The audit identified **4 critical**, **5 high**, **4 medium**, and **3 low** severity findings. The most dangerous issue is overly permissive RLS policies that allow any authenticated user (or anonymous user) to read and modify ALL data across ALL teams.

---

## CRITICAL Severity

### C-1: RLS Policies Allow Full Cross-Tenant Data Access

**Status:** NEEDS DATABASE FIX (cannot be fixed in code alone)
**Location:** All Supabase tables with `USING (true)` policies
**Affected tables:** `password_vault`, `rev_share_payments`, `route_schedules`, `training_videos`, and likely the core tables from Midday fork (transactions, bank_accounts, bank_connections, etc.)

**Description:** Multiple tables have RLS policies defined as:
```sql
CREATE POLICY "Service role access" ON public.table_name FOR ALL USING (true);
```

This policy applies to ALL roles (including `authenticated` and `anon`), not just `service_role`. The `FOR ALL` combined with `USING (true)` means:
- Any authenticated user can SELECT, INSERT, UPDATE, DELETE on ANY team's data
- Any anonymous (unauthenticated) request using the anon key can do the same
- Team isolation is completely broken at the database level

**Confirmed in SQL files:**
- `scripts/vault-passwords-schema.sql` -- password vault (ENCRYPTED CREDENTIALS)
- `scripts/revenue-share-schema.sql` -- financial payment records
- `scripts/route-schedule-schema.sql` -- operational schedules
- `scripts/training-schema.sql` -- training content

**Impact:** An attacker with any valid Supabase session (or just the anon key, which is public in `NEXT_PUBLIC_SUPABASE_ANON_KEY`) can:
1. Read all teams' encrypted passwords from `password_vault`
2. Read/modify all financial records
3. Read/modify bank connection data including access tokens
4. Impersonate any team's data

**Remediation:** Replace `USING (true)` policies with team-scoped policies:
```sql
-- For service_role only:
DROP POLICY "Service role access" ON public.password_vault;
CREATE POLICY "Service role full access" ON public.password_vault
  FOR ALL TO service_role USING (true);

-- For authenticated users (team-scoped):
CREATE POLICY "Team members can manage vault" ON public.password_vault
  FOR ALL TO authenticated
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()))
  WITH CHECK (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));
```

Apply the same pattern to: `rev_share_payments`, `route_schedules`, `training_videos`, and audit ALL other tables.

---

### C-2: Plaid Access Token Exposed in URL Query Parameters

**Status:** FIXED (see changes below)
**Location:** `apps/dashboard/src/app/api/plaid/accounts/route.ts:70`

**Description:** The Plaid accounts endpoint accepts `accessToken` as a URL query parameter:
```typescript
const accessToken = searchParams.get("accessToken");
```

Plaid access tokens are permanent credentials that grant full read access to a user's bank accounts and transactions. Passing them in URL query parameters means they will appear in:
- Server access logs
- CDN/proxy logs
- Browser history
- Referer headers
- Any monitoring/APM tools

**Impact:** Permanent bank account access tokens leaked through infrastructure logs.

**Remediation:** Changed from GET with query params to POST with request body.

---

### C-3: Plaid Access Token Returned to Client in Plaintext

**Status:** OPEN -- requires architectural change
**Location:** `apps/dashboard/src/app/api/plaid/exchange-token/route.ts:65-68`

**Description:** After exchanging a public token, the endpoint returns the Plaid `access_token` directly to the client:
```typescript
return NextResponse.json({
  data: {
    access_token: data.access_token,
    item_id: data.item_id,
  },
});
```

The access_token should NEVER leave the server. It should be stored server-side (encrypted) in the `bank_connections` table and referenced by ID.

**Impact:** The access_token is exposed to client-side JavaScript, browser dev tools, and any XSS vulnerability.

**Remediation:** Store the access_token server-side immediately after exchange. Return only the `item_id` or a connection reference ID to the client.

---

### C-4: Password Vault Key Derivation Uses Predictable teamId

**Status:** OPEN -- requires migration plan
**Location:** `apps/dashboard/src/utils/vault-crypto.ts`

**Description:** The vault encryption key is derived using PBKDF2 with:
- Key material: `teamId` (a UUID, publicly queryable)
- Salt: `"vendcfo-vault-v1"` (hardcoded, static)
- Iterations: 100,000 (acceptable)

The `teamId` is a UUID that is known to all team members and appears in URLs, API responses, and database queries. Combined with the static salt, any user who knows the teamId can derive the encryption key and decrypt ALL passwords in the vault.

Since RLS policies are `USING (true)`, any authenticated user can read ANY team's encrypted passwords AND derive the key to decrypt them.

**Impact:** Complete compromise of all stored passwords for all teams.

**Remediation:**
1. Immediately fix RLS to prevent cross-tenant reads (C-1)
2. Add a per-team random salt stored server-side (not derivable from teamId)
3. Consider a proper key management system (e.g., a master key from an env var, combined with team-specific material)
4. Re-encrypt all existing vault entries after key rotation

---

## HIGH Severity

### H-1: Open Redirect in Auth Callback

**Status:** FIXED (see changes below)
**Location:** `apps/dashboard/src/app/api/auth/callback/route.ts:86-88`

**Description:** The `return_to` parameter is used directly in a redirect without validation:
```typescript
if (returnTo) {
  return NextResponse.redirect(`${requestUrl.origin}/${returnTo}`);
}
```

While it prepends the origin, the value `return_to=//evil.com` would create `https://vendcfo.vercel.app///evil.com` which some browsers interpret as `https://evil.com`. Additionally, `return_to=../other-origin` or protocol-relative URLs could bypass the origin check.

**Impact:** Phishing attacks via crafted login links.

**Remediation:** Validate that `returnTo` is a relative path with no protocol or double slashes.

---

### H-2: No CSRF Protection on State-Mutating POST Endpoints

**Status:** OPEN
**Location:** All POST API routes

**Description:** None of the POST endpoints verify the `Origin` or `Referer` header. While Next.js App Router has some built-in protections and Supabase auth cookies use `SameSite=Lax`, there is no explicit CSRF token mechanism.

API routes affected:
- `/api/chat` -- AI chat (could trigger expensive operations)
- `/api/plaid/link-token` -- creates bank connection tokens
- `/api/plaid/exchange-token` -- exchanges bank tokens
- `/api/revenue-share/send-report` -- sends emails to external recipients

**Impact:** A malicious site could potentially trigger actions on behalf of a logged-in user.

**Remediation:** Add Origin/Referer validation middleware for all state-mutating endpoints.

---

### H-3: QuickBooks OAuth Tokens Stored in Plaintext

**Status:** OPEN
**Location:** `apps/dashboard/src/app/api/apps/quickbooks/callback/route.ts:80-94`

**Description:** QuickBooks access and refresh tokens are stored in the `apps` table config field as plaintext JSON:
```typescript
config: {
  provider: "quickbooks",
  accessToken: tokenSet.accessToken,
  refreshToken: tokenSet.refreshToken,
  // ...
}
```

Combined with the broken RLS (C-1), any authenticated user can read these tokens.

**Impact:** Full access to any team's QuickBooks account data.

**Remediation:** Encrypt OAuth tokens at rest using a server-side encryption key.

---

### H-4: Missing Content-Security-Policy Header

**Status:** OPEN
**Location:** `apps/dashboard/next.config.ts`

**Description:** The security headers include `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`, but do NOT include `Content-Security-Policy` or `Strict-Transport-Security` (HSTS).

Without CSP, the app is more vulnerable to XSS attacks. Without HSTS, users could be downgraded to HTTP.

**Impact:** Increased attack surface for XSS and man-in-the-middle attacks.

**Remediation:** Add CSP and HSTS headers.

---

### H-5: Plaid Webhook Uses IP Allowlist Instead of Signature Verification

**Status:** OPEN
**Location:** `apps/dashboard/src/app/api/webhook/plaid/route.ts:11-16, 47`

**Description:** The Plaid webhook verifies authenticity via IP allowlist only:
```typescript
const ALLOWED_IPS = ["52.21.26.131", "52.21.47.157", "52.41.247.19", "52.88.82.239"];
if (!ALLOWED_IPS.includes(clientIp)) { ... }
```

Problems:
1. The `x-forwarded-for` header can be spoofed if there's no trusted proxy configuration
2. Plaid recommends using their webhook verification (JWT-based) as the primary auth method
3. IP addresses can change without notice

The Teller webhook correctly uses HMAC signature verification. The Plaid webhook should do the same using Plaid's webhook verification endpoint or JWT verification.

**Impact:** Potential for forged webhook payloads if IP spoofing is possible.

---

## MEDIUM Severity

### M-1: Error Messages Leak Internal Details

**Status:** OPEN
**Location:** Multiple API routes

**Description:** Several endpoints return internal error details to the client:
- `apps/dashboard/src/app/api/plaid/link-token/route.ts:72` -- returns Plaid error details
- `apps/dashboard/src/app/api/plaid/exchange-token/route.ts:58` -- returns Plaid error details
- `apps/dashboard/src/app/api/plaid/accounts/route.ts:104` -- returns Plaid error details

**Impact:** Information disclosure that could help attackers understand internal architecture.

---

### M-2: HTML Injection in Revenue Share Email

**Status:** OPEN
**Location:** `apps/dashboard/src/app/api/revenue-share/send-report/route.ts:128-274`

**Description:** Location names, addresses, and contact names from the database are interpolated directly into HTML without escaping:
```typescript
`<span ...>${locationName}</span>`
`<span ...>${address}</span>`
`<span ...>${contactName}</span>`
```

If an attacker can modify location data (trivial with broken RLS), they can inject arbitrary HTML/JavaScript into emails sent to external recipients.

**Impact:** Phishing or malware distribution via crafted emails.

---

### M-3: No Rate Limiting on API Routes

**Status:** OPEN
**Location:** All API routes

**Description:** No rate limiting is implemented on any endpoint. The AI chat endpoint (`/api/chat`) is particularly concerning as it makes expensive OpenAI API calls.

**Impact:** Denial of service, excessive API costs.

---

### M-4: TypeScript Build Errors Ignored

**Status:** OPEN
**Location:** `apps/dashboard/next.config.ts:43`

**Description:**
```typescript
typescript: {
  ignoreBuildErrors: true,
}
```

This means type errors that could indicate security issues (like missing null checks, incorrect types) are silently ignored during builds.

---

## LOW Severity

### L-1: Teller Signature Verification Uses Non-Constant-Time Comparison

**Status:** OPEN
**Location:** `apps/dashboard/src/utils/teller.ts:30`

**Description:**
```typescript
return signatures.includes(calculatedSignature);
```

`Array.includes()` uses non-constant-time string comparison, which could theoretically leak signature information via timing attacks. The registered webhook (`webhook/registered/route.ts`) correctly uses `crypto.timingSafeEqual()`.

**Impact:** Theoretical timing attack (very low practical risk).

---

### L-2: ForcePrimary Cookie Not HttpOnly

**Status:** OPEN
**Location:** `apps/dashboard/src/app/api/auth/callback/route.ts:55`

```typescript
cookieStore.set(Cookies.ForcePrimary, "true", {
  httpOnly: false, // Needs to be readable by client-side tRPC
```

**Impact:** Low -- cookie value is not sensitive, but it signals a pattern worth reviewing.

---

### L-3: Middleware Skips Auth When Supabase Not Configured

**Status:** OPEN
**Location:** `apps/dashboard/src/middleware.ts:14-19`

```typescript
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  return i18nResponse;
}
```

If environment variables are missing, all routes become public. This is likely intended for development but could be dangerous if env vars are accidentally removed in production.

---

## Summary of Changes Made

1. **C-2 FIX:** Changed `/api/plaid/accounts` from GET with query params to POST with request body to prevent access token leakage in URL logs
2. **H-1 FIX:** Added open redirect validation to `/api/auth/callback` to reject protocol-relative URLs and non-relative paths
3. **H-4 PARTIAL FIX:** Added `Strict-Transport-Security` header to next.config.ts
4. **RLS migration SQL:** Created `scripts/fix-rls-policies.sql` with team-scoped policies for all custom tables

---

## Priority Action Items

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Run `scripts/fix-rls-policies.sql` against production database | 5 min |
| P0 | Audit ALL remaining table RLS policies (Midday core tables) | 2 hr |
| P0 | Stop returning Plaid access_token to client (C-3) | 4 hr |
| P1 | Add server-side encryption for OAuth tokens (H-3) | 4 hr |
| P1 | Redesign vault key derivation (C-4) | 8 hr |
| P1 | Add CSP header (H-4) | 2 hr |
| P1 | Replace Plaid IP allowlist with JWT verification (H-5) | 4 hr |
| P2 | Add CSRF origin validation middleware (H-2) | 2 hr |
| P2 | HTML-escape email template variables (M-2) | 1 hr |
| P2 | Add rate limiting (M-3) | 4 hr |
| P3 | Fix Teller timing-safe comparison (L-1) | 15 min |
| P3 | Remove `ignoreBuildErrors` (M-4) | Variable |
