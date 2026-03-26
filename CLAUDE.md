# Freee Expenses

Automated monthly expense submissions to Freee. Scans Google Drive receipt folders, extracts data via Claude Vision, and submits expense applications to Freee.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Clerk (Google SSO)
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic SDK (Claude Vision) for receipt OCR
- **Package Manager**: pnpm
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/
│   ├── api/                       — API routes (auth callbacks, cron, processing)
│   ├── connect/                   — OAuth connection pages (Freee, Google)
│   ├── dashboard/                 — Main dashboard
│   ├── runs/                      — Run history views
│   ├── settings/                  — User settings
│   ├── sign-in/ & sign-up/       — Clerk auth pages
│   ├── layout.tsx                 — Root layout
│   └── page.tsx                   — Landing page
├── components/
│   ├── connect/                   — Connection status components
│   ├── dashboard/                 — Dashboard components
│   ├── layout/                    — App layout components
│   ├── runs/                      — Run history components
│   └── ui/                        — shadcn/ui components (do not edit directly)
├── lib/
│   ├── claude/                    — Claude Vision OCR helpers
│   ├── freee/                     — Freee API client
│   ├── google/                    — Google Drive API client
│   ├── processing/                — Expense processing logic
│   ├── encryption.ts              — Token encryption
│   ├── supabase.ts                — Supabase client
│   └── utils.ts                   — Shared utilities
├── types/                         — TypeScript type definitions
└── middleware.ts                  — Clerk auth middleware
```

## Key Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm typecheck        # TypeScript type checking (tsc --noEmit)
pnpm lint             # ESLint (via next lint)
pnpm test             # Run tests (Vitest — not yet configured)
```

## Code Quality Rules

### Input Validation
- Validate all API route inputs with Zod or manual checks.
- Never trust client-provided IDs without verifying ownership.

### File Size & Modularity
- Max ~200 lines per file. Split into focused modules if exceeded.
- One component per file.

### Error Handling
- Wrap external service calls (Freee API, Google Drive, Claude Vision) in try-catch.
- Use consistent error messages for auth and API failures.

### Security
- Never commit secrets or API keys.
- Encrypt OAuth tokens at rest using `lib/encryption.ts`.
- All API routes must verify authentication via Clerk.

## Testing Requirements

- Run `pnpm typecheck` after every change.
- Run `pnpm test` after every change.
- Test framework: Vitest (config in `vitest.config.ts`).
- CI: Tests run automatically on push/PR via GitHub Actions (`.github/workflows/test.yml`).

## Documentation

- `README.md` — Project overview, setup guide, tech stack
- `docs/` — Additional documentation
