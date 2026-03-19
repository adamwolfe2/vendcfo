# VendCFO Architecture Notes
**Date:** 2026-03-19 | **Stack:** Next.js 16 + Bun + Hono + TRPC v11 + Drizzle + Supabase

## Monorepo Structure
- **6 apps:** dashboard (Next.js 3001), api (Bun/Hono 3003), engine (CF Workers 3002), website, desktop (Tauri), worker (BullMQ)
- **33 packages:** db, supabase, ui, cache, jobs, events, etc.
- **Build:** Turborepo 2.7.0 + Biome 1.9.4 + Bun 1.2.22

## Key Stats
- 2,318 TS/TSX files, 843 in dashboard alone
- 40 TRPC routers (~200+ procedures)
- 80+ DB tables, 30+ enums, 27 migrations
- 30+ dashboard routes, 13 API route handlers

## Auth: Supabase Auth (JWT)
- OTP + OAuth flows
- Middleware validates session, TRPC `protectedProcedure` checks JWT
- `ensureUserExists` creates public.users on first login

## Data Flow
User → Supabase Auth → Dashboard (TRPC) → API (Bun/Hono) → Drizzle → Postgres

## Build Baseline
- **Build:** Clean (no errors)
- **Lint:** Not run yet (Biome)
- **Tests:** None exist
- **TypeScript:** Strict mode via tsconfig
