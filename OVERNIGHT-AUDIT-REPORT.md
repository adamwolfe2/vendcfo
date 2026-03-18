# Overnight Audit Report

**Date:** 2026-03-18
**Branch:** `overnight-improvements-2026-03-18`
**Base:** `main` at commit `7196cde`

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Build status | PASS (2 warnings) | PASS (2 warnings) |
| Test status | No tests | No tests |
| Total files modified | — | 33 |
| Lines added | — | +632 |
| Lines removed | — | -490 |
| Commits | — | 4 |

### Build Warnings (unchanged, pre-existing)
- bullmq/ioredis package resolution warning (2 instances) — benign, external dep issue

---

## Changes by Category

### Critical Fix: TRPC Server-Side Rendering (commit `af22589`)

**Problem:** Dashboard showed "Something went wrong" after login. Server-side TRPC calls used `httpBatchLink` to make HTTP requests to `/api/trpc` on the same Vercel serverless function — serverless functions cannot reliably call themselves.

**Fix:** Introduced `getServerCaller()` using `createCallerFactory(appRouter)` from TRPC v11. This invokes the router directly in-process without HTTP, eliminating the self-call problem entirely.

**Files changed (16):**
- `trpc/server.tsx` — Added `getServerCaller()` and `getAccessToken()` cached functions
- `(sidebar)/layout.tsx` — Direct caller for user.me, team.current, invoice.defaultSettings
- `(sidebar)/page.tsx` — Direct caller for widgets.getWidgetPreferences, suggestedActions
- `(sidebar)/apps/page.tsx` — Direct caller for 5 prefetch queries
- `(sidebar)/chat/[id]/page.tsx` — Direct caller for widgets, chat, suggestedActions
- `(sidebar)/customers/page.tsx` — Direct caller for 4 prefetch queries
- `(sidebar)/inbox/page.tsx` — Direct caller for inboxAccounts
- `(sidebar)/invoices/page.tsx` — Direct caller for 4 prefetch queries
- `(sidebar)/transactions/page.tsx` — Direct caller for 4 prefetch queries
- `(sidebar)/settings/billing/page.tsx` — Direct caller for user.me
- `(sidebar)/settings/developer/page.tsx` — Direct caller for 2 prefetch queries
- `(sidebar)/upgrade/page.tsx` — Direct caller for user.me
- `setup/page.tsx` — Direct caller for user.me
- `teams/page.tsx` — Direct caller for team.list, team.invitesByEmail, user.me
- `oauth/authorize/page.tsx` — Direct caller for oauthApplications, user.me, team
- `actions/safe-action.ts` — Direct caller for auth middleware

**Architecture note:** The HTTP-based `trpc` proxy is kept for:
1. Query key generation (`queryOptions().queryKey`) needed for `setQueryData`
2. Client-side TRPC calls (which correctly use relative `/api/trpc`)
3. Fallback for any remaining prefetch calls on non-critical paths

### Code Quality: Dead Code & Branding (commit `2a31a92`)

**Dead code removed:**
- `login-video-background.tsx` (91 lines) — not imported anywhere
- `login-testimonials.tsx` (149 lines) — only imported by above

**Branding fixes (VendHub → VendCFO):**
- Layout metadata: Updated title, description, removed hardcoded vendhub.com URLs
- Cookie name: `vendhub-force-primary` → `vendcfo-force-primary`
- OAuth channel: `vendhub_oauth_complete` → `vendcfo_oauth_complete`
- MFA issuer: `app.vendhub.com` → `vendcfo.ai`
- "Powered by" text on invoice, portal, report pages
- MFA pages: external vendhub.com link → relative `/`
- Upgrade page: cal.com/pontus-vendhub → cal.com/adamwolfe/vendcfo
- Payment modal: hardcoded api.vendhub.com fallback → relative `/api`
- UTM source: vendhub.com → vendcfo
- Comment: "Core Midday Features" → "Core Financial Features"

### UI Polish (commit `4930272`)

- Removed `className="dark"` from global error page HTML tag (enforces light theme)

### Security Hardening (commit `9adc188`)

- `/api/debug` route: Added auth requirement (`getUser()` check, returns 401 if unauthenticated)
- Removed env var status exposure (no longer shows which secrets are SET/MISSING)
- Removed user email/full_name/team_id from response
- Only returns: auth status, DB connection status, user record existence

---

## Known Issues Not Fixed (with reasoning)

### Left as-is (safe to defer)

1. **CDN URLs still point to vendhub.com/cdn.vendhub.com** — These reference Midday's CDN for fonts, bank logos, OG images. VendCFO doesn't have its own CDN yet. Changing them would break the assets.

2. **`MIDDAY_*` env vars not renamed** — Used in 20+ places across `apps/api/`. Renaming requires coordinated env var updates in Vercel. The prefix is cosmetic and doesn't affect functionality.

3. **`dark:` Tailwind classes in ~100+ components** — These are inert because `forcedTheme="light"` prevents dark mode activation. Removing them all risks breaking styles and provides no functional benefit.

4. **Public pages (`/i/`, `/p/`, `/r/`, `/s/`) still use HTTP TRPC** — These use `publicProcedure` and are accessed by unauthenticated users. The HTTP self-call is less problematic here since these pages are simpler and don't have the auth context issue.

5. **logo.dev public API token hardcoded** — The `pk_` prefix indicates it's a public/client-side token by design. Moving to env var provides no security benefit since `NEXT_PUBLIC_*` vars are equally exposed.

6. **No automated tests** — The project has no test suite. Adding tests is a separate initiative.

7. **`vendhub-desktop` app identifier in unified-app.tsx** — This is a functional identifier used by the desktop app client. Changing it would break the desktop app.

---

## Recommended Next Steps

1. **Deploy and verify** — Push this branch and verify the dashboard renders after login on Vercel
2. **Monitor TRPC caller** — Check Vercel function logs for any `[sidebar/layout] TRPC caller error` entries
3. **Set up custom domain** — Replace `vendcfo.vercel.app` with a proper domain
4. **Set up CDN** — Host fonts/images on own CDN to eliminate vendhub.com dependency
5. **Add error monitoring** — Sentry is configured but needs `SENTRY_AUTH_TOKEN` and `SENTRY_DSN` env vars
6. **Consider removing `/api/debug`** — Once login flow is confirmed working, this endpoint can be removed entirely
