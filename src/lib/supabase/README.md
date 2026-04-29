# Supabase Integration

## Scope of T02

This directory now provides the minimum Supabase client setup for later tasks.

T02 includes:
- installing the official Supabase client packages
- wiring browser and server client factories
- documenting environment variables

T02 does not include:
- login or registration flows
- business queries or CRUD
- database migration completion
- RLS implementation

Auth work starts in `T10`.
Database schema and RLS work continue in `T03`.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in the values from your Supabase project:

```bash
cp .env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Rules:
- `NEXT_PUBLIC_SUPABASE_URL` can be exposed to the browser.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be exposed to the browser, but data safety depends on RLS.
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only, must never be exposed to the browser, and is not used by the current T02 code.

## Client Split

### Browser client

File: `src/lib/supabase/client.ts`

Use this in Client Components when browser-side Supabase access is needed. It only reads:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

It does not read or use `SUPABASE_SERVICE_ROLE_KEY`.

### Server client

File: `src/lib/supabase/server.ts`

Use this in Server Components, Route Handlers, or Server Actions. It:
- uses `createServerClient` from `@supabase/ssr`
- reads cookies via `next/headers`
- uses the anon key, not the service role key

This file only provides the SSR client factory. It does not perform auth or data access by itself.

## Current Limitations

- `SUPABASE_SERVICE_ROLE_KEY` is documented but intentionally unused in MVP T02.
- `src/types/database.ts` is still a placeholder until later schema/type work.
- `supabase/migrations/0001_initial_schema.sql` is not updated in this task.
- RLS is not completed in this task and must be finished in T03 before relying on browser-side anon-key access.

## Next Steps

- `T03`: complete database migration and RLS
- `T10`: implement registration, login, logout, and session handling
