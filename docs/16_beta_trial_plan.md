# Small Beta Trial Plan

## Trial Goal

This small beta is not a public launch. It is a focused check with 1-5 trusted users to learn whether Maimang Readbox is understandable, usable, and worth continuing.

Validate whether testers can:

- Understand the product position from the landing page.
- Register or sign in without help.
- Browse authors.
- Subscribe to an author.
- Find subscribed articles in Inbox.
- Read a published article.
- Save an external item manually.
- Create notes and reflections.
- Create collections.
- Understand Reading Traces.
- Judge whether the product has enough value to revisit.

## Trial Size

- Round 1: 1-3 people.
- Round 2: 3-5 people after the first feedback pass.
- Do not send the MVP broadly before the first two rounds are reviewed.

## Trial Entry

Current entry:

https://maimang-readbox.vercel.app

Notes:

- The MVP still uses the Vercel domain.
- Some networks may have unstable access to `.vercel.app`.
- Custom domain binding is paused until a domain is purchased or selected.
- Keep `https://maimang-readbox.vercel.app` as the current trial and fallback entry.

## Recommended Trial Path

1. Open the homepage.
2. Switch between Chinese and English.
3. Register an account.
4. Browse Authors.
5. Subscribe to an author.
6. Open Inbox.
7. Read an article.
8. Add one note.
9. Add one reflection.
10. Save one external item manually.
11. Create one collection.
12. Add content to the collection.
13. Open Reading Traces.
14. Update Settings.
15. Optional: create an author profile and publish a draft/article.

## Trial Duration

- Quick pass: 10-15 minutes.
- Deep pass: about 30 minutes.

## Observation Focus

Watch for:

- Whether the homepage explains the product quickly.
- Whether the navigation is clear.
- Whether registration and login are smooth.
- Whether author subscription is understandable.
- Whether Inbox feels like an inbox.
- Whether Later, Collections, and Reading Traces are understandable.
- Whether testers understand the difference between notes and reflections.
- Whether external content compliance language feels natural.
- Whether there are visible layout issues, loading failures, or broken states.
- Whether testers know what to click next.

## Trial Boundary

Do not test or promise:

- Search.
- Tags.
- Sharing pages.
- Comments.
- Likes.
- AI summaries.
- OCR.
- Automatic crawling.
- Paid subscriptions.
- Full mobile-device acceptance.
- Custom domain stability.

## Test Account Strategy

- Prefer self-registration by each tester so the registration path is exercised.
- Do not share real passwords in documents or chat.
- Do not ask testers to send passwords, cookies, tokens, or private browser data.
- If a prepared account is needed for a demo, share credentials out of band and rotate or delete it after the session.

## Demo Data Strategy

- Use non-private sample article content.
- Use public links or fictional examples for external items.
- Avoid personal notes, real private reading data, private email addresses, or production user records in recordings.
- Record whether smoke-created test data remains in production and plan cleanup before a broader release.

## Feedback Handling

- Ask testers to complete `docs/17_beta_feedback_template.md`.
- Convert actionable issues into `docs/18_beta_issue_log.md`.
- Classify feedback before deciding what to build.
- Prioritize blockers, confusing core paths, visible UI regressions, and access failures before adding new features.
