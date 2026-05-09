# Maimang Readbox

Project name: 麦芒订阅 / Maimang Readbox

Maimang Readbox is a quiet reading product for subscriptions, saved external reading, and private reflection.

It is intentionally anti-feed:

- No recommendation feed.
- No trending list.
- No complex social graph.
- No comments or likes.
- No automatic crawling.
- No OCR or AI summary in the MVP.

## Product Shape

The MVP is built around a small set of reading loops:

- Subscribe to authors, then receive their published articles in an Inbox.
- Save external reading manually into Later.
- Organize articles and saved external items into private Collections.
- Leave private Notes and Reflections while reading.
- Make article notes or reflections public only through the safe public article traces DTO.
- Review all personal Notes and Reflections in Reading Traces.
- Use Author Workspace to create drafts, publish articles, and manage your public author profile.

External items are manual records. The app stores user-entered metadata, links, short excerpts, and notes. It does not automatically import source pages, bypass paywalls, or publicly expose third-party full text.

## Tech Stack

- Next.js App Router and Route Handlers
- React and TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres with Row Level Security
- pnpm
- `scripts/smoke-mvp.mjs` for end-to-end MVP smoke coverage

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create `.env.local` from `.env.example` and fill in your local Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Do not commit `.env.local`.

Run local development:

```bash
pnpm dev
```

Build and start the production server locally:

```bash
corepack pnpm build
corepack pnpm start
```

If port `3000` is occupied, start Next directly on another port:

```powershell
& "C:\Program Files\nodejs\node.exe" node_modules/next/dist/bin/next start -p 3001 -H 127.0.0.1
```

## Validation

Run static checks:

```bash
pnpm lint
corepack pnpm build
```

Run the MVP smoke harness after a server is available:

```bash
node scripts/smoke-mvp.mjs
```

For a non-default server URL:

```powershell
$env:SMOKE_BASE_URL="http://127.0.0.1:3001"
node scripts/smoke-mvp.mjs
```

The smoke harness creates timestamped temporary users and test data. It does not use a service role key and does not print cookies, tokens, passwords, or `.env.local` contents.

## MVP Features

- Auth and safe profile DTOs
- Public author profiles
- Author subscription and unsubscribe
- Inbox fanout for newly published subscribed articles
- Article draft and publish flow
- Published article reading pages
- Manual external item saving in Later
- Private collections and collection items
- Article notes and reflections
- External item notes and reflections
- Public article reading traces through safe DTOs
- Private Reading Traces overview
- Profile settings
- Author Dashboard, Write, and My Articles
- Reusable MVP smoke harness

## Security Principles

- Runtime code uses Supabase anon key plus RLS, not service role key.
- RLS remains the primary database isolation boundary.
- API DTOs must not expose `userId`, `user_id`, email, raw profile rows, or owner foreign keys.
- Public article traces are exposed only through read-only safe DTOs.
- Draft articles are hidden from non-owners.
- External items are private to their owner and must not expose `original_content` or `extracted_content`.
- Third-party full text is not publicly exposed.

## Explicit MVP Non-Goals

- Search
- Tags
- Sharing pages
- Public square
- Recommendations
- Trending lists
- Comments
- Likes
- Direct messages
- Export
- OCR
- AI summary
- Automatic crawling or automatic page extraction
- Paid subscriptions
- Real email delivery workflows

## Deployment Materials

- `docs/10_mvp_acceptance_report.md`
- `docs/11_deployment_readiness.md`
- `docs/12_demo_script.md`
- `docs/13_known_limitations.md`

Use `docs/11_deployment_readiness.md` as the deployment gate before any production release.
