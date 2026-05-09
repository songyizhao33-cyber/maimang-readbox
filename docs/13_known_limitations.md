# MVP Known Limitations

This document lists current limitations plainly. These are not completed capabilities.

## Product Scope Not Included

- No search.
- No tags.
- No public collection pages.
- No sharing pages.
- No public square.
- No recommendation feed.
- No trending list.
- No comments.
- No likes.
- No private messages.
- No paid subscriptions.
- No export flow.
- No AI summary.
- No OCR.
- No automatic crawling.
- No automatic OpenGraph or page metadata extraction.
- No public external item notes or reflections.

## External Content Limits

- External items only store user-entered metadata, source links, short excerpts, and private notes/reflections.
- The MVP does not automatically import source pages.
- The MVP does not bypass logins, paywalls, publisher restrictions, or anti-abuse controls.
- The MVP does not publicly expose third-party full text.
- `original_content` and `extracted_content` are schema fields, but current safe DTOs must not expose them.

## Testing Limits

- `scripts/smoke-mvp.mjs` creates timestamped temporary users and test data.
- The smoke harness is HTTP-level, not browser automation.
- There is no systematic Playwright/Cypress-style end-to-end browser suite yet.
- Mobile layout has been considered in page structure, but still needs dedicated device-level acceptance.
- Real email delivery is not validated unless SMTP and Auth email settings are configured in Supabase.

## Deployment Limits

- Production deployment is not performed by this repository task.
- Supabase production Auth Site URL and Redirect URLs must be configured before release.
- Email confirmation strategy must be decided before production smoke if automated test login is required.
- Preview and production environment variables must be checked separately.
- The runtime code does not require a service role key; using one would be outside the current MVP boundary.

## Future Work Candidates

- Browser-based e2e test suite.
- Mobile detail pass.
- Dedicated staging Supabase project for production-like smoke.
- Better admin-facing operational documentation.
- Search or tags only after the current quiet-reading MVP is accepted.
