# VendCFO Codebase Audit

**Date:** 2026-03-25
**Auditor:** Claude Opus 4.6 (automated)
**Scope:** Phase 0 (Discovery) + Phase 1 (Code Quality)

---

## Phase 0: Discovery

### Monorepo Structure

| Layer | Item | Notes |
|-------|------|-------|
| Root | `bun@1.2.22` package manager | Turborepo 2.7.0 orchestration |
| Root | `biome 1.9.4` | Formatting + linting |
| Root | `typescript ^5.9.3` | |
| Apps | `dashboard` | Next.js 16.1.5, React 19.2.3, main product UI |
| Apps | `api` | TRPC v11 + REST (Hono-style routes) |
| Apps | `engine` | Banking provider integrations (Plaid, GoCardless, EnableBanking) |
| Apps | `worker` | BullMQ job processors (Redis-backed) |
| Apps | `website` | Marketing site (Next.js) |
| Apps | `desktop` | Tauri desktop wrapper |

**Packages (35 total):**
accounting, app-store, cache, calculators, categories, customers, db, desktop-client, documents, email, encryption, engine-client, events, import, inbox, insights, invoice, job-client, jobs, location, logger, notifications, plans, spreadsheet-bridge, supabase, tsconfig, ui, utils, vending-data-model, vending-kb, workbench

### Deployment Configuration

- **Hosting:** Vercel (dashboard + website + email preview)
- **Region:** `iad1` (US East)
- **Build command (Vercel):** `TURBOPACK=0 next build` (Turbopack disabled for prod builds)
- **Dev mode:** Turbopack enabled (`--turbopack`)
- **Sentry:** Configured for production only, source maps uploaded
- **Security headers:** CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff -- all properly set

### File Counts

| Area | TypeScript files |
|------|-----------------|
| `apps/` | ~1,596 |
| `packages/` | ~829 |
| `apps/dashboard/src/` | ~124,704 lines total |

---

## Phase 1: Code Quality

### 1.1 Dead Code & Suppressions

#### @ts-ignore / @ts-expect-error: 110 occurrences across 74 files

| Severity | Category | Count | Top locations |
|----------|----------|-------|---------------|
| HIGH | JSONB type mismatches | ~30 | `packages/db/src/queries/invoices.ts` (7), `apps/api/src/rest/routers/apps/slack/` (7), invoice components (6) |
| MEDIUM | Library type issues | ~15 | `apps/engine/tasks/` (6), `packages/ui/` (3), `packages/jobs/` (10) |
| LOW | Test files (accessing private props) | ~10 | `packages/accounting/src/providers/*.test.ts` |
| MEDIUM | Untyped component props | ~40 | Scattered across `apps/dashboard/src/components/` |
| LOW | PostCSS config | 1 | `apps/dashboard/postcss.config.cjs` |

**Root cause:** The single biggest source is JSONB columns from Drizzle ORM that return `unknown` at the type level. A proper fix would be to define typed JSONB column helpers or create typed accessor functions.

**Fixable now?** Yes -- define JSONB column type helpers in `packages/db/` to eliminate ~30 suppressions.

#### eslint-disable comments: 7 occurrences across 6 files

All are `react-hooks/exhaustive-deps` or `@typescript-eslint/no-explicit-any`. Low severity, mostly justified.

#### TODO/FIXME/HACK comments: ~20 in production code (excluding tests/scripts)

| File | Line | Content | Severity |
|------|------|---------|----------|
| `packages/jobs/src/tasks/bank/sync/connection.ts` | 33 | "Remove this function after 2025-01-20" | **HIGH** -- past due by 14+ months |
| `packages/jobs/src/tasks/bank/sync/connection.ts` | 61 | "Remove this entire backfill function after 2026-01-20" | MEDIUM -- due in ~10 months |
| `packages/jobs/src/tasks/bank/sync/connection.ts` | 212 | "Remove this backfill logic after 2025-02-01" | **HIGH** -- past due by 13+ months |
| `packages/jobs/src/tasks/bank/sync/connection.ts` | 266 | "Fix types" | MEDIUM |
| `packages/jobs/src/tasks/bank/transactions/upsert.ts` | 41,52 | "Fix types with drizzle" | MEDIUM |
| `packages/jobs/src/tasks/transactions/import.ts` | 95 | "Fix transaction type mapping" | MEDIUM |
| `packages/jobs/src/tasks/transactions/update-base-currency.ts` | 37 | "Fix types with drizzle" | MEDIUM |
| `packages/jobs/src/tasks/inbox/provider/sync-account.ts` | 58 | "Unregister inbox account scheduler" | LOW |
| `apps/dashboard/src/components/modals/select-bank-accounts.tsx` | 287 | "Return currency from engine" | LOW |
| `apps/dashboard/src/app/api/apps/xero/install-url/route.ts` | 19 | Stub -- Xero OAuth not implemented | LOW |
| `apps/dashboard/src/app/api/apps/fortnox/install-url/route.ts` | 19 | Stub -- Fortnox OAuth not implemented | LOW |
| `apps/dashboard/src/app/api/invoice-payments/connect-stripe/route.ts` | 19 | Stub -- Stripe Connect not implemented | LOW |
| `packages/jobs/src/utils/transaction-notifications.tsx` | 20 | "Get correct locale" | LOW |

**Fixable now?** The two **HIGH** items (expired backfill TODOs) should be investigated and the dead backfill code removed. The Drizzle type TODOs can be batched with the JSONB fix above.

---

### 1.2 Type Safety

#### `as any` type casts: 75 total (41 in apps, 34 in packages)

| Severity | Pattern | Count | Example locations |
|----------|---------|-------|-------------------|
| HIGH | JSONB field access (`template as any`, `config as any`) | ~20 | `apps/api/src/rest/routers/invoices.ts`, `apps/dashboard/src/components/inbox/` |
| HIGH | Supabase client cast (`supabase as any`) | 2 | `apps/dashboard/src/components/capacity/capacity-dashboard.tsx:126`, `apps/dashboard/src/components/finance/finance-dashboard.tsx:131` |
| MEDIUM | Status enum mismatches | ~8 | `apps/dashboard/src/components/tables/invoices/columns.tsx` |
| MEDIUM | BullMQ job type workarounds | ~10 | `packages/workbench/src/core/queue-manager.ts` |
| LOW | Test helpers | ~10 | Various `.test.ts` files |
| MEDIUM | Dynamic field access in documents package | ~8 | `packages/documents/src/utils/cross-field-validation.ts`, `packages/documents/src/utils/merging.ts` |

**Fixable now?** The JSONB casts (same root cause as @ts-expect-error above) and status enum mismatches can be fixed with proper typing. The Supabase client casts suggest a version mismatch worth investigating.

#### Bare `catch {}` blocks (no error variable): 146 total (109 apps, 37 packages)

Most follow the pattern of silent fallback (returning null/default). While many are intentional (e.g., pages that gracefully degrade when DB tables don't exist), the sheer count suggests some swallowed errors that could hide bugs. The `apps/dashboard/src/app/[locale]/(app)/(sidebar)/` pages account for many -- these were added per commit `74cf21f` to "harden pages against missing tables."

**Severity:** MEDIUM overall. Consider adding at minimum `console.error` in catch blocks that aren't purely for graceful degradation.

---

### 1.3 Security

#### Hardcoded URLs that should be env vars

| Severity | URL | Locations | Recommendation |
|----------|-----|-----------|----------------|
| **HIGH** | `https://api.resend.com/emails` | `apps/dashboard/src/app/api/reports/send-email/route.ts:96`, `apps/dashboard/src/app/api/revenue-share/send-report/route.ts:407` | Use Resend SDK or env var |
| **HIGH** | `pk_X-1ZO13GSgeOoUrIuJ6GMQ` (logo.dev API token) | `apps/dashboard/src/utils/logos.ts:4`, `apps/dashboard/src/components/web-search-sources.tsx:147` | Move to env var `NEXT_PUBLIC_LOGO_DEV_TOKEN` |
| MEDIUM | `https://cdn-engine.vendhub.com/` | 5 locations across 3 files | Already a CDN URL, but should be `process.env.CDN_ENGINE_URL` for environment flexibility |
| MEDIUM | `https://cdn.vendhub.com/fonts/` | 3 OG image files | Font CDN, lower risk but still should be configurable |
| LOW | `https://connect.stripe.com/oauth/authorize` | `apps/api/src/rest/routers/invoice-payments.ts:115` | Standard Stripe URL, acceptable |
| LOW | `https://slack.com/api/oauth.v2.access` | `apps/api/src/rest/routers/apps/slack/oauth-callback.ts:148` | Standard Slack API URL, acceptable |
| LOW | Plaid URLs with env-based switching | 4 files in dashboard | Pattern is correct (sandbox vs production switching) |

#### console.log in production code

| Area | Occurrences | Severity |
|------|------------|----------|
| `apps/worker/` (non-script) | ~20 | **HIGH** -- worker runtime logs should use structured logger |
| `packages/inbox/` (gmail.ts, outlook.ts) | ~8 | **HIGH** -- email provider code logs sensitive refresh token operations |
| `packages/customers/src/enrichment/verify.ts` | 8 | MEDIUM -- logs user URLs being validated |
| `packages/desktop-client/` | 8 | LOW -- desktop debugging, acceptable |
| `packages/events/` (server.ts, client.tsx) | 2 | **HIGH** -- event tracking dev stubs left in production |
| `packages/notifications/` | 5 | MEDIUM -- notification dispatch logging |
| `packages/documents/src/utils/retry.ts` | 1 | LOW |
| `packages/jobs/src/tasks/document/` | 4 | MEDIUM |
| `apps/engine/src/utils/logger.ts` | 1 | LOW -- this IS the logger |
| `apps/dashboard/src/utils/logger.ts` | 1 | LOW -- this IS the logger |
| Test files / scripts | ~150+ | N/A -- acceptable in test/script context |

**Total non-test console.log:** ~57 occurrences in production code paths

**Fixable now?** Yes. Replace with the existing `logger` utility or `console.error`/`console.warn` where appropriate.

#### dangerouslySetInnerHTML: 20 occurrences across 18 files

Almost all in `apps/website/` (marketing site MCP component pages, MDX rendering, pricing page). One in `packages/ui/src/components/chart.tsx`.

**Severity:** LOW -- all appear to be rendering trusted content (MDX output, SVG code blocks, Recharts markup). No user-generated content is being rendered unsanitized.

---

### 1.4 Configuration

#### `ignoreBuildErrors: true` in next.config.ts

| App | Status | Severity |
|-----|--------|----------|
| `apps/dashboard/next.config.ts:42` | **YES -- enabled** | **CRITICAL** |
| `apps/website/next.config.ts:13` | **YES -- enabled** | **HIGH** |

This means TypeScript errors are silently ignored during production builds. This is the single highest-priority finding in this audit. Any type error introduced will ship to production undetected.

**Fixable now?** Removing it will likely surface build errors given the 110 `@ts-expect-error` and 75 `as any` casts. Recommended approach: fix the JSONB typing first, then attempt to remove `ignoreBuildErrors`.

#### Environment Validation at Startup

**Not present.** There is no `env.ts` / `env.mjs` / `createEnv` validation file anywhere in the codebase. Environment variables are accessed directly via `process.env.*` throughout the code with no runtime validation.

**Severity:** **HIGH** -- A missing or misspelled env var will cause a runtime crash rather than a clear startup failure. Recommend adding `@t3-oss/env-nextjs` or a Zod-based env validation module.

#### .gitignore Completeness

The `.gitignore` is comprehensive and covers:
- node_modules, .next, dist, build outputs
- .env and .env*.local
- .mcp.json (MCP auth tokens)
- .vercel, .turbo, .trigger
- Editor files, logs, Supabase temp files

**One gap:** No explicit exclusion for `.env.production` or `.env.staging` (only `.env` and `.env*.local` are covered). If someone creates `.env.production` it would be tracked.

**Severity:** LOW

---

## Summary of Findings

| Severity | Count | Category |
|----------|-------|----------|
| CRITICAL | 1 | `ignoreBuildErrors: true` in both Next.js apps |
| HIGH | 6 | No env validation, hardcoded API token (logo.dev), hardcoded Resend URL, console.log in production (inbox/worker/events), 2 expired TODO backfills |
| MEDIUM | 8 | 75 `as any` casts, 110 `@ts-expect-error`, 146 bare catch blocks, CDN URLs not configurable, Drizzle JSONB typing, status enum mismatches, Supabase client casts, notifications console.log |
| LOW | 5 | 7 eslint-disable, 20 dangerouslySetInnerHTML (trusted content), .gitignore gap, desktop console.log, stub TODOs for unimplemented OAuth |

### Recommended Fix Order

1. **Add env validation** (HIGH, low effort) -- create `packages/env/` with Zod schemas
2. **Move logo.dev token to env var** (HIGH, 5 min fix)
3. **Replace direct Resend fetch with SDK** (HIGH, both route files already import resend)
4. **Replace console.log with logger** in `packages/inbox/`, `packages/events/`, `apps/worker/` (HIGH, mechanical)
5. **Remove expired backfill code** in `packages/jobs/src/tasks/bank/sync/connection.ts` (HIGH, investigate first)
6. **Create typed JSONB helpers** in `packages/db/` (MEDIUM, eliminates ~30 ts-expect-error + ~20 as-any)
7. **Remove `ignoreBuildErrors`** after fixing type issues (CRITICAL, but depends on items above)
