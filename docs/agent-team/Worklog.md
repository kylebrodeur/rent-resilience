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
- Desktop wallet pay (zero SDK): EIP-6963 injected-wallet discovery, on-brand
  picker, Base chain switch, hand-encoded USDC transfer (68-byte calldata
  verified against selector/recipient/amount), auto-confirm into /api/confirm.
  Fallback to the ethereum: deep link preserved for mobile wallet apps. Wallet
  flow sends tx hash to PostHog on optin_confirm and email_signup for Kyle's
  funnel tracking; email lane merges the email into the payment KV record so
  "paid + email" is one lookup.
- KV pull tool: `pnpm kv:pull [founding|paid|emails|all]` (site/scripts/kv-pull.mjs,
  wrangler --remote) writes local gitignored JSON; runbook in docs/kv-data-pulls.md.
  Legacy `contact:*` key shape covered. wrangler pinned as devDependency;
  pnpm-workspace allowBuilds filled in.
- Windows-ready: .gitattributes (LF normalize + binary exceptions),
  packageManager pinned to pnpm@12.3.4, README Setup section (Node 24,
  corepack pnpm, uv PowerShell install; agent-team scripts documented as
  mac/Linux-only with gates cross-platform).
- Week 1 build runbook written (docs/agent-team/wk1-build-runbook.md): day
  plan Wed schemas, Thu dataset, Fri-Sat ledger, Sun reliability, Mon ritual,
  with per-day checklists and handoff discipline.
- Any-wallet pay (WalletConnect relay, no AppKit): raw
  `@walletconnect/ethereum-provider@2.23.7` lazy-imported from jsdelivr behind
  an "Any wallet app" picker row and a desktop no-extension QR path; QR drawn
  client-side (qrcode-generator, lazy) into our own modal with a wc: deep-link
  fallback. Feature inert until WC_PROJECT_ID is set (free project at
  dashboard.reown.com). Fixed a latent picker bug: inline display:flex beat the
  hidden attribute, so the picker could never dismiss. Card-rail analysis for
  Kyle: 1c Visa lane rejected (30c fixed fees vs 1c payment); card belongs in
  real-amount on-ramps later. Commits 7f9c76e, 5729744; deploy 28bc0a1f.
