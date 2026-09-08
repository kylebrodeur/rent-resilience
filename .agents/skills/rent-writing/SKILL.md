---
name: rent-writing
description: Write or edit any reader-facing copy in this repo (site HTML, status page, docs prose, briefs) in Kyle's builder-notes voice and pass the repo's publish gate. Use before touching site/, the status page, or docs prose, and whenever a draft has slop-word or dash-gate findings.
---

# Rent writing

Reader-facing copy in this repo follows Kyle's personal publishing system
(canonical source, private repo, read-only):
`/Users/kylebrodeur/workspace/Personal-Publishing-Plan/00-system/00.02-operations/publishing/`

- Voice rules: `guides/Voice-And-Tone.md` (builder notes on useful systems; claim → receipt → interpretation → implication; first person from inside the work; no invented scenes)
- Gate rules: `guides/Edit-Pass-Checklist.md` (dash gate, editorial markers, image/caption mechanics)

Read the relevant guide before editing copy. This skill carries the non-negotiables
inline so an agent without the private repo still writes to standard.

## The one hard rule for agents

Never invent a claim, number, scene, or quote to make copy sound specific. If the
evidence is missing, qualify the claim or mark it `gated_on: factcheck`. Copy in this
repo is public the moment it deploys.

## Non-negotiables (enforced by the repo's gates)

- **Dash gate**: zero em/en dashes in publish-bound text. Use a colon, period, comma, or
  parentheses instead. Gate: `pnpm gate:prose`
- **Editorial markers**: no unresolved `[[KB: ...]]`, `[TODO: ...]`, or `<mark>` in
  shipping copy.
- **Slop words**: no delve/leverage/robust/seamless-style filler in reader-facing
  strings. In code surfaces this is enforced by the `anti-slop-rent/no-slop-prose`
  oxlint rule; in prose, the voice guides above carry it editorially.
- **Numerals and receipts over adjectives**: "cut review time from 30 minutes to 8",
  not "significantly improves engineering productivity". If a sentence could move
  unchanged to another project, it has not earned its place.
- **Honesty distinctions**: preserve implemented / tested / provider-executed /
  approved. A sandbox receipt is not a production claim. The status page is
  hand-updated; do not let copy outrun it.

## When you hit a gate finding

Fix the copy so the evidence is real. Never launder: no dash-lookalike characters,
no comment markers inserted to silence `no-slop-prose`, no weakening the gate scripts.
If a finding looks wrong (quoted source, domain term, code identifier), leave the
finding, state why it should be exempt, and let Kyle decide.