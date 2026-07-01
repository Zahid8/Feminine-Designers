# Setup

## Prerequisites

- Node.js 22 or newer
- npm 11 or newer
- Supabase CLI for local database work, optional but recommended

## Install and Run

```bash
npm install
npm run dev
```

The app builds without Supabase credentials by using deterministic seed data.

## Supabase Environment

Create `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key-do-not-expose
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database

Apply:

```bash
supabase db push
```

Or run the SQL files manually in order:

1. `supabase/migrations/202607010001_initial_schema.sql`
2. `supabase/seed.sql`

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
