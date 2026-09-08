# Worklog (append-only)

## 2026-09-08

- Team scaffolded (5 roles, Zellij layout, session scripts, handoff discipline) from
  the enviro-grow-pico template with btc-market-learning-lab governance learnings.
- Next: wk 1 day plan per dashboard: Wed schemas, Thu dataset, Fri-Sat ledger,
  Sun reliability (ledger lane), Mon ship review.
- Markdownlint publish gate live as the fourth quality gate: custom rule
  (`tools/markdownlint/rules/rr-publish-gate.cjs`, six codes) + `pnpm lint:md`
  wired into husky and CI, after oxlint and before the HTML publish gate. Frozen
  research docs excluded. Porting runbook + 3 open decisions handed to the
  Personal Publishing Plan inbox.
- uv enforced as the only Python path: `gate:prose` runs via `uv run`, validator
  carries PEP 723 metadata, CI uses astral-sh/setup-uv. README now frames
  enviro-grow-pico and btc-market-learning-lab as past projects, not references.
- Landing page share + confirmation flow: client-drawn "I'm in" card (1200x630
  PNG download), share section with X/Farcaster/copy, post-optin confirmation
  card on both the 1c and email lanes (wording flips to "I supported"), share
  text split plain-vs-1c so only opt-in sharers carry the 1c line, #rentresilience
  hashtag adopted, share rails added to hero and footer.
- Landing page structure fixes: resolution walkthrough rebuilt as a
  container-width terminal card (old classes had no CSS, so it rendered as bare
  text); mobile nav replaced with a hamburger + right-anchored dropdown holding
  theme toggle and protocol link; flow terminal cards made equal height.
- Accessibility pass: aria-labels on placeholder-only inputs, canvas role=img,
  aria-controls on the mobile menu, FAQ glyphs aria-hidden, `--dm` token raised
  to WCAG AA contrast in both themes. Commits b1f3f0a..d20c6c8, deploys
  aa6802ae..5f25ebbf.
