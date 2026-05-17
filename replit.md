# KenyaPay — Kenyan Payroll System

A full-stack payroll management system built for Kenyan businesses, handling PAYE, NSSF, SHIF, and Housing Levy calculations with M-Pesa and bank disbursements.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, mapped to `/api`)
- `pnpm --filter @workspace/payroll run dev` — run the frontend (React + Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk Auth middleware
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + shadcn/ui + TailwindCSS + Recharts
- Auth: Clerk (managed tenant)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (Orval)
- `lib/api-zod/src/generated/` — Generated Zod validation schemas (Orval)
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/kenyaTax.ts` — Kenya tax calculation engine
- `artifacts/payroll/src/pages/` — Frontend pages (React + wouter routing)
- `artifacts/payroll/src/components/` — Shared UI components

## Architecture decisions

- Contract-first API: OpenAPI spec drives both Zod validation on the server and React Query hooks on the client
- Numeric fields stored as PostgreSQL `numeric` strings in DB; converted to `Number()` in API responses
- Tax engine (`kenyaTax.ts`) is a pure function module with no DB dependency — easy to test and reuse
- NSSF uses 2024 Tier I/II structure (6% of ≤KSh 7K, 6% of ≤KSh 36K)
- Clerk proxied through the API server so auth works across the shared reverse proxy

## Product

- **Employee Management**: Add, edit, search employees with department assignment, KRA PIN, NSSF/SHIF numbers, and M-Pesa or bank payment details
- **Payroll Processing**: One-click monthly payroll run calculating PAYE, NSSF, SHIF, and Housing Levy for all active employees
- **Tax Calculator**: Interactive tool showing real-time breakdowns of all deductions for any gross salary
- **Leave Management**: Request and approve annual, sick, maternity, paternity, and compassionate leave
- **Reports**: Monthly payslips per employee, department breakdowns, annual trend charts
- **Disbursements**: Track M-Pesa and bank transfer payment status per payroll run

## Kenya Tax Rates (2024/2025)

- PAYE: 10% (≤24K), 25% (≤32.3K), 30% (≤500K), 32.5% (≤800K), 35% (>800K)
- Personal Relief: KSh 2,400/month
- NSSF Tier I: 6% employee + 6% employer (up to KSh 7,000)
- NSSF Tier II: 6% employee + 6% employer (KSh 7,001–36,000)
- SHIF: 2.75% of gross (minimum KSh 300)
- Housing Levy: 1.5% employee + 1.5% employer of gross
- Insurance Relief: 15% of SHIF contributions

## User preferences

- Use KSh currency formatting throughout (not USD)
- Kenyan teal/green color theme (#0d9488 primary)
- No emojis in UI

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- Run `pnpm --filter @workspace/db run push` after any schema changes in `lib/db/src/schema/`
- The API server must be restarted after route changes (it builds with esbuild on startup)
- `inArray` from drizzle-orm must be used for `WHERE id IN (...)` — raw SQL `ANY($1)` doesn't bind arrays correctly

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/clerk-auth/` for Clerk auth setup and customization
