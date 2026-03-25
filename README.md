# Freee Expenses

Automated monthly expense submissions to Freee. Scans Google Drive receipt folders, extracts data via Claude Vision, and submits expense applications to Freee.

## Features

- **Clerk Auth** — Google SSO sign-in
- **Freee OAuth** — Connect your Freee accounting account
- **Google Drive OAuth** — Read-only access to scan receipt folders
- **Claude Vision OCR** — Extracts dates, amounts, vendors, categories from receipt images
- **Auto-submit** — Creates expense applications in Freee with receipt attachments
- **Cron automation** — Runs automatically on the 1st of each month via Vercel cron
- **Dashboard** — View run history, submission results, and connection status

## Tech Stack

- Next.js 14 (App Router)
- Clerk for authentication
- Supabase (Postgres) for data storage
- Anthropic SDK (Claude Vision) for receipt OCR
- Tailwind CSS + shadcn/ui
- Vercel for hosting + cron

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd freee-expenses
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
3. Copy the project URL and service role key

### 3. Set up Clerk

1. Create an app at [clerk.com](https://clerk.com)
2. Enable Google SSO in the Clerk dashboard
3. Copy the publishable key and secret key

### 4. Set up Freee OAuth

1. Create an app at [Freee Developer](https://app.secure.freee.co.jp/developers)
2. Set the redirect URI to `https://<your-domain>/api/auth/freee/callback`
3. Copy the client ID and secret

### 5. Set up Google OAuth

1. Create credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable the Google Drive API
3. Add `https://<your-domain>/api/auth/google/callback` as an authorized redirect URI
4. Copy the client ID and secret

### 6. Configure environment variables

```bash
cp .env.example .env
```

Fill in all values in `.env`. Generate encryption and cron keys with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 8. Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy

The cron job is configured in `vercel.json` to run on the 1st of every month.

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/
│   │   ├── auth/           # OAuth callbacks (Freee, Google)
│   │   ├── runs/           # Run management endpoints
│   │   ├── cron/           # Monthly cron endpoint
│   │   └── preferences/    # User preferences endpoint
│   ├── dashboard/          # Main dashboard
│   ├── connect/            # Connection wizard
│   ├── runs/[id]/          # Run detail view
│   └── settings/           # User settings
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Header component
│   ├── dashboard/          # Dashboard components
│   ├── connect/            # Connection wizard components
│   └── runs/               # Run detail components
├── lib/
│   ├── freee/              # Freee OAuth + API
│   ├── google/             # Google OAuth + Drive API
│   ├── claude/             # Claude Vision receipt extraction
│   ├── processing/         # Run processing pipeline
│   ├── supabase.ts         # Supabase client
│   ├── encryption.ts       # AES-256-GCM token encryption
│   └── utils.ts            # Shared utilities
└── types/                  # TypeScript interfaces
```

## Environment Variables

See `.env.example` for the full list.
