# CLAUDE.md

Behavioral guidelines for AI-assisted development of Maimang Readbox.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Project-Specific Guidelines

This is a small, quiet reading platform called **Maimang Readbox**.

Do not turn it into a social feed, recommendation platform, hot ranking platform, or full content community unless explicitly requested.

### Core Product Loop

1. User subscribes to authors.
2. Authors publish articles.
3. Articles are delivered to the user's inbox.
4. User saves external links or texts.
5. User reads, classifies, stars, archives, and takes notes.

### MVP Boundaries

Do not add unless explicitly requested:
- payments
- recommendation algorithms
- comments
- private messages
- hot rankings
- complex analytics
- browser extensions
- native mobile apps
- AI assistants
- bulk import

### External Content Compliance

Do not implement bulk scraping.
Do not bypass paywalls, login walls, anti-scraping measures, or platform restrictions.
External content import must be user-initiated.
Do not publicly expose full third-party imported content.
Sharing should prefer title, source, original link, and the user's own notes.

### Technical Defaults

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui (when needed)
- Supabase Auth
- Supabase PostgreSQL
- PostgreSQL RLS
- pnpm

Do not introduce Python backend in MVP.
Future Python FastAPI service is reserved only for OCR, PDF parsing, text extraction, classification, and summarization.

### Before Coding Checklist

Before implementation, always state:
- assumptions
- touched files
- success criteria
- verification steps
- what is explicitly not included

### After Coding Checklist

After implementation, always report:
- changed files
- why each file changed
- validation commands run
- validation results
- unresolved risks
- next recommended task

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
