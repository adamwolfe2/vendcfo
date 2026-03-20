# Codebase Cleanup Report

**Date**: 2026-03-19

## Baseline Metrics (Before)

- Source files (ts/tsx/js/jsx/css): 2,301
- TypeScript lines of code: ~436,245
- Root package.json deps: 4
- Dashboard package.json deps: 86 + 9 devDeps

## After Cleanup

- Source files: 2,300 (1 dead file removed)
- TypeScript LOC: ~437,785 (net increase due to biome reformatting expanding compact lines)
- Biome auto-fixed: 298 files (unused imports, formatting, lint rules)

## What Was Removed

### Dead Root-Level Files
- `HARDENING_REPORT.md` — one-time audit report, preserved in git history
- `REFINEMENT_REPORT.md` — one-time audit report, preserved in git history
- `OVERNIGHT-AUDIT-REPORT.md` — one-time audit report, preserved in git history
- `ARCHITECTURE_NOTES.md` — one-time audit notes, preserved in git history
- `test-data.csv` — test artifact, not referenced by code
- `github.png` — hero image not needed (removed README reference)

### Dead Source Files
- `apps/api/src/ai/tools/get-expenses-breakdown.ts` — entirely commented out, not imported anywhere

### Debug Console.log Statements Removed
- `apps/dashboard/src/trpc/server.tsx` — fallback auth debug logs
- `apps/dashboard/src/hooks/use-audio-recording.ts` — recording timer log
- `apps/dashboard/src/components/forms/create-team-form.tsx` — verbose team creation logs with user agent, URL, timestamps
- `apps/dashboard/src/app/api/webhook/teller/route.ts` — sync eligibility debug log
- `apps/api/src/trpc/routers/team.ts` — verbose TRPC team creation request/success/error logs (removed try/catch wrapper that only added logging)
- `packages/db/src/queries/teams.ts` — 8 verbose step-by-step creation logs with timing
- `packages/db/src/queries/transaction-matching.ts` — 3 debug logs (AMOUNT DEBUG, CURRENCY DEBUG, FIRST CANDIDATE)

### Formatting & Import Cleanup
- Biome check --write fixed 298 files: unused imports removed, formatting normalized

## What Was Kept and Why

- `SECURITY_AUDIT.md` — active security reference document
- `SECURITY.md` — security policy (standard for open-source repos)
- `scripts/*.sql` — migration reference scripts (7 files), useful for schema understanding
- `packages/db/src/test/` console.logs — these are in test files where console output is expected
- `apps/dashboard/src/utils/logger.ts` — this is the logger utility itself
- `console.error` calls — kept operational error logging throughout
- TODO in `select-bank-accounts.tsx` — legitimate pending fix for currency from engine
