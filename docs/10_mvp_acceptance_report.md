# T50 MVP Acceptance Report

- Acceptance date: 2026-05-09
- Repository HEAD before final report commit: `473c7f9 test: add mvp acceptance smoke harness`
- Smoke harness: `scripts/smoke-mvp.mjs`
- Smoke command: `SMOKE_BASE_URL=http://127.0.0.1:3001 node scripts/smoke-mvp.mjs`

## Coverage

- Auth and profile
- Author profile
- Article draft, publish, and public access
- Subscription and inbox fanout
- External items
- Collections and collection items
- Article notes and reflections
- Public article traces DTO
- External item notes and reflections
- Reading traces overview
- Lightweight HTML page verification
- Anonymous, owner, and other-user permission boundaries
- Recursive sensitive-field assertions
- Raw Supabase table probes with anon key and user JWTs

## Core Result

The reusable smoke harness passed end to end against a real local production server on `http://127.0.0.1:3001`.

Validated chains:

- Auth/Profile: register, login, logout, `GET /api/me`, `PATCH /api/me/profile`, and rejection of forbidden profile fields.
- Author/Article/Publish: author profile creation, article draft creation, article publish, anonymous access to published article, and draft invisibility to reader and anonymous users.
- Subscription/Inbox: author subscription, inbox fanout after publish, inbox state updates, and inbox isolation between users.
- External Items: create, list, detail, update, page access, and owner-only visibility.
- Collections: create, update, add published article, add external item, list items, delete relation only, and reject draft article insertion.
- Article Notes/Reflections: create, list, update, delete, visibility update, and private isolation.
- Public Article Traces DTO: public note/reflection visible to anonymous callers, private traces excluded, and DTO sanitized.
- External Item Notes/Reflections: create, list, update, delete, owner-only access, and source external item survives trace deletion.
- Reading Traces Overview: aggregation of all four trace classes, type filters, item filters, validation errors for illegal params, limit clamp, and owner-only access.
- Page verification: `inbox`, `later`, `collections`, `collections/[id]`, `articles/[id]`, `external-items/[id]`, and `reading-traces`.

## Permission Boundaries

- Anonymous callers can read published articles and public article traces DTOs only.
- Anonymous callers cannot access private inbox, profile, external items, or reading traces data.
- Other authenticated users cannot read or mutate another user's inbox items, collections, external items, private notes, private reflections, or reading traces.
- Draft articles do not leak existence to reader or anonymous callers. Access and trace creation attempts return `404`.
- Public article traces DTOs expose only public traces and do not reveal private trace content.

## Sensitive Field Assertions

The smoke harness recursively checks API payloads and rejects these fields when they appear in responses:

- `userId`
- `user_id`
- `email`
- `profiles`
- `author_profiles.user_id`
- `external_items.user_id`
- `original_content`
- `extracted_content`
- `service_role`
- `access_token`
- `refresh_token`

Trace DTO exceptions are intentionally narrow:

- `articleId` is allowed where it is content identity rather than ownership.
- `externalItemId` remains allowed for owner-only private external-item traces and reading-traces overview.
- `externalItemId` is explicitly rejected in public article traces DTO responses.

Result:

- Auth/profile owner DTOs required hardening before acceptance.
- Final smoke pass confirmed that tested API responses no longer exposed blocked fields.
- Raw Supabase REST probes confirmed anon callers and other authenticated users could not read private `notes` or `reflections` rows directly.

## Minimal T50.5 Fixes

Two regressions were found and fixed during acceptance:

1. Auth/profile/owner DTOs exposed `email` or `userId` in API responses.
2. `PATCH /api/me/profile` silently ignored forbidden fields such as `role` and `email` instead of returning `400`.

The fix scope stayed inside existing API route handlers:

- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/me/route.ts`
- `src/app/api/me/profile/route.ts`
- `src/app/api/authors/route.ts`
- `src/app/api/authors/[id]/route.ts`
- `src/app/api/collections/route.ts`
- `src/app/api/collections/[id]/route.ts`

No schema, migration, RLS, service-role usage, or product feature changes were introduced.

## Known Non-Blocking Issues

- Git may emit `C:\Users\21218/.config/git/ignore` permission warnings on status and diff commands. This did not block code changes or validation.
- `TASKS.md` and `docs/08_codex_task_board.md` still contain encoding issues. They were not modified in T50.5.
- Google Fonts / `next/font/google` network failures did not reproduce in this run. If they recur in another environment, treat them as environmental unless proven otherwise.

## Not Covered By This MVP Acceptance

- Search
- Tags
- Sharing pages
- Public square or discovery feed
- Export
- AI summary
- OCR
- Automatic crawling

## Next Stage Suggestion

T51 can start only after this T50.5 hardening commit is merged and used as the new baseline.

Recommended focus for the next task:

- Continue from the now-validated MVP baseline rather than widening acceptance scope again.
- Keep the smoke harness as the regression gate for any future auth, profile, traces, or collection work.
- If T51 touches new DTOs, apply the same blocked-field assertions before merging.

## Post-Acceptance Product Polish

After the T50/T50.5 acceptance baseline, the following MVP polish tasks were completed:

- T51: reader navigation and information architecture were consolidated.
- T52: author discovery and subscription entry were polished.
- T53: article and external item reading surfaces were polished.
- T54: Settings/Profile and Author Workspace were made clearer for reader and author states.
- T55: MVP copy, empty states, button naming, and compliance wording were aligned.

Latest verified baseline before deployment-readiness documentation:

- `ed57380 feat: align mvp copy and empty states`
- `pnpm lint` passed.
- `corepack pnpm build` passed.
- `node scripts/smoke-mvp.mjs` passed against `http://127.0.0.1:3001`.

Recommended next step: use the smoke-validated MVP as the baseline for deployment readiness, demo preparation, and known-limitation documentation.
