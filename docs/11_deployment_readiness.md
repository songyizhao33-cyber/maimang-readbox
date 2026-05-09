# MVP Deployment Readiness

- Date: 2026-05-09
- Baseline commit: `ed57380 feat: align mvp copy and empty states`
- Smoke harness: `scripts/smoke-mvp.mjs`

This checklist is the release gate for Maimang Readbox MVP. It is documentation only and does not change Supabase configuration or deploy anything by itself.

## Required Local Checks

Run these before every release candidate:

```bash
pnpm lint
corepack pnpm build
```

Start a production server locally:

```powershell
& "C:\Program Files\nodejs\node.exe" node_modules/next/dist/bin/next start -p 3001 -H 127.0.0.1
```

Run smoke against that server:

```powershell
$env:SMOKE_BASE_URL="http://127.0.0.1:3001"
node scripts/smoke-mvp.mjs
```

The smoke harness creates timestamped temporary users and test data. It must not print cookies, tokens, passwords, or `.env.local` contents.

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Notes:

- `NEXT_PUBLIC_*` variables are visible to browser code.
- Do not place secrets in `NEXT_PUBLIC_*` variables.
- MVP runtime code does not require `SUPABASE_SERVICE_ROLE_KEY`.
- Do not configure service role keys in client-visible environments.

## Supabase Checks

Before production release, verify:

- All migrations in `supabase/migrations/` have been applied to the target project.
- RLS is enabled for user-owned tables.
- Policies still isolate owner-only data.
- Auth Site URL matches the production app URL.
- Auth Redirect URLs include production and any intended preview domains.
- Email confirmation behavior is intentional for the deployment environment.
- SMTP or email sending strategy is configured if email delivery is expected.
- Public article traces remain exposed only through safe read-only RPC DTOs.
- External item raw fields such as `original_content` and `extracted_content` are not returned by public or owner DTOs.

Migration set currently expected:

- `0001_initial_schema.sql`
- `0002_create_profile_on_signup.sql`
- `0003_publish_article_and_fanout.sql`
- `0004_public_article_reading_traces.sql`

## Deployment Platform Checks

Verify the platform supports:

- Next.js App Router.
- Next.js Route Handlers.
- Node.js server runtime.
- Runtime environment variables for server execution.
- Separate preview and production environment variables.

Recommended platform settings:

- Keep preview and production Supabase projects or environments clearly separated.
- Enable deployment protection for preview builds when appropriate.
- Do not expose `.env.local`, logs with cookies, auth tokens, or database credentials.
- Confirm production build command: `corepack pnpm build`.
- Confirm start command supports `next start` or the platform's managed Next.js runtime.

## Production Smoke

After deploying to a production-like URL:

```powershell
$env:SMOKE_BASE_URL="https://your-production-domain.example"
node scripts/smoke-mvp.mjs
```

Production smoke notes:

- The script creates timestamped test accounts and data in the target Supabase project.
- It does not delete real user data.
- It should be run only when test-account creation is acceptable in the target environment.
- Review the JSON summary and confirm `ok: true`.
- If production Auth email confirmation blocks automated login, either configure a staging project for smoke or adjust the Auth strategy before Go.

## Data And Security Checks

- `.env.local` is not tracked by Git.
- No service role key is committed.
- No real token, cookie, database password, or Supabase secret is committed.
- API DTOs do not expose `userId`, `user_id`, email, raw profile rows, or owner foreign keys.
- Public article traces do not expose private traces.
- Draft articles remain invisible to non-owners.
- External items do not publicly expose third-party full text.

## Known Non-Blocking Warnings

- Git may emit `C:\Users\21218/.config/git/ignore` permission denied warnings. This is not a code blocker.
- Google Fonts or network-backed build steps can fail transiently in restricted environments. Re-run once before treating it as product code failure.
- `TASKS.md` and `docs/08_codex_task_board.md` contain legacy encoding issues. Do not force-edit them during release checks unless encoding is fixed deliberately.

## Go / No-Go

Go only if all are true:

- `pnpm lint` passes.
- `corepack pnpm build` passes.
- `node scripts/smoke-mvp.mjs` passes against the intended target URL.
- Supabase migrations are applied.
- RLS is enabled and verified.
- Production environment variables are set with placeholders replaced by correct project values.
- No service role key is used by runtime code.
- No secrets are committed.
- Auth URL and Redirect URLs match the deployment.
- The team accepts the limitations in `docs/13_known_limitations.md`.

No-Go if any are true:

- Smoke fails on auth, profile, subscriptions, inbox, notes, reflections, collections, external items, or sensitive-field checks.
- Draft articles become visible to non-owners.
- API responses expose blocked sensitive fields.
- External item full text is publicly exposed.
- Production Auth settings prevent the intended sign-in flow.
