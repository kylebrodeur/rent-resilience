---
name: anti-slop
description: How to write TypeScript/JavaScript that passes this repo's anti-slop Oxlint rules. Use before adding type assertions, unknown params/returns, Record<string, unknown> maps, typeof narrowing, module mocks, comment blocks, money arithmetic, or randomness. Read it when pnpm lint reports anti-slop/* or anti-slop-rent/* findings.
---

# anti-slop (Rent Resilience)

This repo runs the vendored [anti-slop](https://github.com/dmmulroy/anti-slop) Oxlint
rules (`tools/oxlint/anti-slop/`, wired through `oxlint.config.ts`) plus three
repo-owned rules under `anti-slop-rent`. Run `pnpm lint`; rule unit tests run with
`pnpm lint:rules:test`.

## The one hard rule for agents

Never launder types or values to make lint pass. No suppressions, no severity
downgrades, no `as any`, no deleting a comment's meaning. Fix the code so the evidence
is real. If you genuinely cannot, leave the finding and say why.

## Generic rules

Same set and remedies as upstream anti-slop: parse at boundaries into named domain
types instead of `unknown`; no `Record<string, unknown>`; no ad-hoc `typeof` branching;
no chained or widened assertions; every remaining assertion needs a
`// SAFETY: <why this holds>` line; keep inference or `satisfies` instead of widening;
no bare `object` params; no conditional empty-object spreads; no `vi.mock`/`jest.mock`
(inject seams); no `Reflect.apply`/`Reflect.get`.

## Rent-owned rules (`anti-slop-rent`)

- **`no-float-money`** — money is integer minor units end to end (protocol invariant 6).
  No `parseFloat` anywhere; no `* 100`, `/ 100`, or `* 0.01` on money-named values.
  Parse amounts as integers at the boundary and keep them integers.
- **`no-weak-randomness`** — no `Math.random`. Use `crypto.randomUUID` or
  `crypto.getRandomValues`; use a seeded generator in tests. This repo signs events and
  handles payment identifiers; weak randomness is never worth the review burden.
- **`no-oversized-comments`** — comment blocks over 4 lines are rejected unless they are
  JSDoc (`/** ... */`), tooling directives, or marked `WHY:` / `SAFETY:` for genuinely
  hard logic. Prefer self-documenting names and small functions.
- **`no-slop-prose`** — reader-facing prose (string literals, template strings, comments)
  rejects AI filler words (delve, leverage, robust, seamless, streamline, and the rest of
  Kyle's no-ai-slop list). Replace the word with the concrete fact it stands in for.
  Reader-facing copy in markdown/HTML runs through the separate publish gate
  (`pnpm gate:prose`, vendored from Kyle's publishing system) and the
  [rent-writing](../rent-writing/SKILL.md) skill.
