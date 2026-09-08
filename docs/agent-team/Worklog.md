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
- Any-wallet pay is live: Kyle created the Reown project, WC_PROJECT_ID set
  (commit 56dcc6a, deploy d80def17). Verified end-to-end against the real
  relay before deploy: provider init + live wc: pairing URI + client-drawn QR
  in Playwright. Remaining manual check: scan the desktop QR with a wallet app
  and complete a 1c transfer.
- Mobile moved onto the relay too (commit fbe66fc, deploy 461b31bc): no
  injected wallet means WalletConnect on every platform, so the hash returns
  automatically on every lane and paste demoted to pure fallback (hidden
  after a wallet-lane confirm). On touch devices the wc: link is primary and
  the QR canvas is skipped. Form focus rings on inputs replaced with a
  border-color change (outer ring made focused inputs stand taller than the
  sibling button; both now a verified 44px). Static EIP-681 QR removed after
  Kyle's review (two QRs with different contracts invite scanning the wrong
  one; commit dfb744d): the WalletConnect modal QR is now the only QR, the
  ethereum: href stays as the no-JS fallback, paste survives for
  pay-another-way cases, optin-qr.png dropped from the bundle. Dead-code
  sweep found no dead functions anywhere (page + worker fully wired); five
  unused id hooks and stale paste copy removed (3d78ccc). Mobile modal now
  shows a named universal-link chooser (Base app, MetaMask, Rainbow, Trust,
  raw wc: fallback) instead of an empty QR box, fixing the OS-default
  Rainbow problem (commit 84301bc, deploy b4514888).
- Kyle's live mobile test: Rainbow works end to end (chooser opens the app,
  connection prompt appears); the Base app row did not (app opened to the
  home screen, no approval prompt). Root cause is upstream: the July 2025
  Coinbase Wallet -> Base app migration broke the go.cb-w.com/wc?uri=
  deep link (reown-com/appkit-react-native#511). Base app row removed
  (commit 7f6c5ca, deploy 021eda2b), then restored on its own lane via the
  Base Account SDK (@base-org/account, lazy +esm import, same JSON-RPC
  provider contract as WC so payFlow is unchanged): first row on the mobile
  chooser, own row in the desktop picker, verified to open the real
  keys.coinbase.com connect popup in Playwright (commit c195108, deploy
  7e6a7919). Hash-return fallback direction documented: the tx hash
  travels over the WC relay to the pending eth_sendTransaction promise,
  not via the redirect, so a manual swipe back to the browser still
  resolves; a killed tab falls back to the paste field, which is why it
  stays.
- Try-it-now redesign from Kyle's review: lucide scan-frame icon replaces
  the retired QR slot, Pay 1c button in terminal amber (--te, text --bg so
  both themes flip correctly) to stand out from the green form buttons,
  copy trimmed across the section, the Mint parenthetical removed.
- Mobile overflow sweep at 320px, root-caused from Kyle's report: the
  optgrid 1fr track is really minmax(auto,1fr), so the form row's
  intrinsic min-content (input default width + nowrap button) floored the
  track wider than its container; fixed with minmax(0,1fr), min-width:0 on
  form inputs, stacked input/button below 360px, and wrapping footer
  links. Page is now scroll-clean at 320 and 390.
