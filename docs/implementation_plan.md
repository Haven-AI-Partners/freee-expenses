# Freee Expenses Automation - Implementation Plan

## Context
Build a full Next.js 14 App Router application that automates monthly expense submissions to Freee for a team. Users connect their Freee and Google Drive accounts, and the app scans receipt images from Drive folders, extracts data via Claude Vision, and submits expense applications to Freee automatically.

## File Structure

```
freee-expenses/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── vercel.json
├── components.json                  # shadcn/ui config
├── .env.example
├── README.md
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout with ClerkProvider
│   │   ├── page.tsx                 # Landing page
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Main dashboard
│   │   ├── connect/
│   │   │   └── page.tsx             # Connection wizard
│   │   ├── runs/
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Run detail view
│   │   ├── settings/
│   │   │   └── page.tsx             # User preferences
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── freee/
│   │       │   │   └── callback/route.ts
│   │       │   └── google/
│   │       │       └── callback/route.ts
│   │       ├── runs/
│   │       │   ├── route.ts         # GET list runs
│   │       │   ├── trigger/route.ts # POST trigger run
│   │       │   └── [id]/
│   │       │       └── process/route.ts  # POST process run
│   │       └── cron/
│   │           └── monthly/route.ts
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   ├── dashboard/
│   │   │   ├── connection-status.tsx
│   │   │   ├── recent-runs.tsx
│   │   │   └── run-trigger.tsx
│   │   ├── connect/
│   │   │   ├── freee-connect.tsx
│   │   │   ├── google-connect.tsx
│   │   │   └── preferences-form.tsx
│   │   └── runs/
│   │       ├── run-progress.tsx
│   │       └── expense-items-table.tsx
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── encryption.ts            # AES-256 encrypt/decrypt
│   │   ├── freee/
│   │   │   ├── oauth.ts             # OAuth helpers
│   │   │   └── api.ts               # Freee API calls
│   │   ├── google/
│   │   │   ├── oauth.ts             # Google OAuth helpers
│   │   │   └── drive.ts             # Google Drive API
│   │   ├── claude/
│   │   │   └── extract-receipt.ts   # Claude Vision receipt OCR
│   │   ├── processing/
│   │   │   └── run-processor.ts     # Main processing pipeline
│   │   └── utils.ts                 # Shared utilities
│   ├── middleware.ts                 # Clerk auth middleware
│   └── types/
│       └── index.ts                 # TypeScript types
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   # Database schema
```

## Implementation Phases

### Phase 1: Project Setup & Config
- [x] Initialize package.json with all dependencies
- [ ] Create tsconfig.json, next.config.js, tailwind.config.ts, postcss.config.js
- [ ] Set up shadcn/ui (components.json + base UI components)
- [ ] Create vercel.json with cron config
- [ ] Create .env.example
- [ ] Create Clerk middleware

### Phase 2: Database & Core Libraries
- [ ] Create database migration SQL (all 5 tables)
- [ ] Create `src/lib/supabase.ts` - Supabase client
- [ ] Create `src/lib/encryption.ts` - AES-256 token encryption
- [ ] Create `src/types/index.ts` - TypeScript interfaces

### Phase 3: OAuth Flows
- [ ] Create `src/lib/freee/oauth.ts` - Freee OAuth helpers
- [ ] Create `src/lib/google/oauth.ts` - Google OAuth helpers
- [ ] Create `src/app/api/auth/freee/callback/route.ts`
- [ ] Create `src/app/api/auth/google/callback/route.ts`

### Phase 4: External API Integrations
- [ ] Create `src/lib/freee/api.ts` - Freee API (receipts, expense_applications, companies)
- [ ] Create `src/lib/google/drive.ts` - Google Drive API
- [ ] Create `src/lib/claude/extract-receipt.ts` - Claude Vision receipt OCR

### Phase 5: Processing Pipeline
- [ ] Create `src/lib/processing/run-processor.ts` - Main pipeline orchestrator
- [ ] Create `src/app/api/runs/[id]/process/route.ts`
- [ ] Create `src/app/api/runs/trigger/route.ts`
- [ ] Create `src/app/api/runs/route.ts`
- [ ] Create `src/app/api/cron/monthly/route.ts`

### Phase 6: UI Pages
- [ ] Create root layout with ClerkProvider
- [ ] Create landing page
- [ ] Create sign-in/sign-up pages
- [ ] Create dashboard page
- [ ] Create connect wizard page
- [ ] Create run detail page
- [ ] Create settings page

### Phase 7: UI Components
- [ ] Header and sidebar components
- [ ] Dashboard components (connection-status, recent-runs, run-trigger)
- [ ] Connect wizard components (freee-connect, google-connect, preferences-form)
- [ ] Run detail components (run-progress, expense-items-table)

### Phase 8: Final
- [ ] Update README with setup instructions
- [ ] Verify TypeScript compiles without errors

## Key Architecture Decisions

### Token Encryption
- Use Node.js `crypto` module with AES-256-GCM
- Store IV alongside ciphertext (prepended)
- ENCRYPTION_KEY from env var (32-byte hex)

### OAuth Flow Pattern
Both Freee and Google OAuth follow the same pattern:
1. Frontend redirects to provider auth URL with state param (includes Clerk user ID)
2. Provider redirects to `/api/auth/{provider}/callback`
3. Callback exchanges code for tokens, encrypts, stores in `user_connections`
4. Redirects back to `/connect` page

### Processing Pipeline
Sequential processing to stay within Vercel's 60s timeout:
1. Load run + user connections
2. Refresh tokens if expiring within 5 minutes
3. Resolve folder name from pattern + month
4. Search Google Drive for folder by name
5. List image files in folder
6. For each image (sequentially): download → Claude Vision → upload to Freee → create expense
7. Update expense_runs with final counts

### Cron Job Logic
- Vercel cron hits `/api/cron/monthly` daily (hobby plan limitation)
- Route checks if today is the 1st of the month
- If yes, queries all users with active connections and triggers runs
- Secured with CRON_SECRET header check

## Critical API Details

### Freee API
- Base URL: `https://api.freee.co.jp/api/1`
- POST `/receipts`: multipart/form-data with `company_id` and `receipt` (file)
- POST `/expense_applications`: JSON body with company_id, title, expense_application_lines[]
- GET `/companies`: returns company list to get company_id
- Token refresh: POST to `https://accounts.secure.freee.co.jp/public_api/token`

### Google Drive API
- Search folder: `name='FOLDER_NAME' and mimeType='application/vnd.google-apps.folder'`
- List images: `'FOLDER_ID' in parents and (mimeType contains 'image/')`
- Download: `GET /files/FILE_ID?alt=media` with auth header

### Claude Vision
- Model: claude-sonnet-4-20250514
- Extract: issue_date, partner_name, amount, tax_amount, description, account_item_name
- Bilingual prompt for Japanese receipts

## Environment Variables
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/connect
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
FREEE_CLIENT_ID
FREEE_CLIENT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
ENCRYPTION_KEY (32-byte hex string for AES-256)
CRON_SECRET
NEXT_PUBLIC_APP_URL
```
