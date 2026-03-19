# Code Hardening Report
**Date:** 2026-03-19
**Project:** VendCFO
**Baseline:** 20 lint errors, 0 tests (none exist), build clean

## Summary
- **Files Modified:** 59
- **Files Created:** 2 (ARCHITECTURE_NOTES.md, .env.example)
- **Files Deleted:** 2 (debug route, demo utils)
- **Lint Errors Fixed:** 20 (all auto-fixable format/import issues)
- **New Lint Errors:** 0
- **Tests Status:** N/A (no test suite exists)
- **Build Status:** Clean

## Changes by Phase

### Phase 1: Critical Fixes
- `apps/dashboard/src/app/api/auth/callback/route.ts` — Wrapped auth code exchange in try/catch, redirects to /login?error=auth_failed on failure
- `apps/dashboard/src/app/api/enablebanking/session/route.ts` — Added null check on data?.id before redirect (was passing undefined into URL)
- `apps/api/src/trpc/routers/bank-connections.ts` — Changed `throw new Error()` to `throw new TRPCError()` for proper TRPC error serialization
- `apps/dashboard/src/app/api/debug/route.ts` — **DELETED** (exposed internal system diagnostics)
- `apps/dashboard/src/app/api/webhook/plaid/route.ts` — Wrapped req.json() in try/catch, wrapped tasks.trigger() in try/catch
- `apps/dashboard/src/app/api/webhook/teller/route.ts` — Wrapped req.json() in try/catch, wrapped tasks.trigger() in try/catch
- `apps/dashboard/src/app/api/webhook/registered/route.ts` — Wrapped req.json() in try/catch, added null check on body.record.id

### Phase 2: Code Cleanliness
- 34 files auto-fixed via Biome (import ordering, formatting)
- 10 files had debug console.log statements removed (40+ total):
  - `desktop-provider.tsx` — 22 emoji-prefixed debug logs
  - `create-team-form.tsx` — 4 internal flow tracking logs
  - `teller/route.ts` — 3 payload dumps
  - `download.ts`, `save-file.ts` — file operation debug logs
  - `institutions.ts` — bare error dump
  - `enablebanking-api.ts` — 3 bare error dumps
  - `engine auth/index.ts` — errorResponse dump
  - `engine tasks/utils.ts` — 3 file save logs
  - `engine tasks/import.ts` — importResults dump

### Phase 3: UI/UX Polish
- 21 dashboard components — removed inert `dark:` Tailwind classes (VendCFO is light-mode only)
- 404 page already existed — no changes needed
- Page metadata (titles) already existed on all main routes — no changes needed

### Phase 4: Performance
- `packages/db/src/client.ts` — Conditional replica pool creation (only creates FRA/SJC/IAD pools if env vars exist, eliminating 3 Pool instances with undefined connection strings on Vercel)

### Phase 5: Developer Experience
- Created `.env.example` with 6 required environment variables
- Added `.mcp.json` to `.gitignore` (contains auth tokens)
- Created `ARCHITECTURE_NOTES.md` with project overview

### Phase 6: Feature Enhancements
- N/A (focused on stability over new features given auth was just fixed)

### Phase 7: Security
- `apps/dashboard/next.config.ts` — Added security headers: X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy (camera=(), microphone=(self), geolocation=())
- Webhook routes — All three now validate JSON body before processing
- `.mcp.json` removed from git tracking

## Known Issues Not Addressed
- `MIDDAY_*` env var naming throughout codebase (cosmetic, from Midday fork — 20+ references)
- CDN URLs pointing to vendhub.com (cosmetic)
- `dark:` classes in packages/ui/ components (shared library, would need separate pass)
- No automated test suite exists
- `ignoreBuildErrors: true` in next.config.ts (risky but changing would require fixing all TS errors)
- Worker/engine apps not build-tested (only dashboard was verified)

## Recommendations for Next Session
- Add at least smoke tests for auth flow (login, OTP, team creation)
- Consider replacing Supabase Auth with Clerk (user mentioned this as fallback)
- Add proper structured logging (pino) to replace remaining console.log statements in worker
- Remove `ignoreBuildErrors: true` and fix underlying TypeScript errors
- Set up pre-commit hooks (husky + lint-staged) for Biome
- Add rate limiting to public-facing API routes (currently none)
