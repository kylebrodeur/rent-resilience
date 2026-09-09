# Deployed QA checklist (week 1 review)

Manual QA for everything currently live, for Kyle to work through during
week 1. Written 2026-09-09 against the deployed worker (version 7e0e9b82) and
the landing page at commit 3594cea. Check items off in place; append findings
to `Worklog.md`, not here.

Surfaces:

- Landing page: rentresilience.org (worker version 7e0e9b82)
- Status page: rentresilience.org/status
- Docs site: docs.rentresilience.org
- Worker API: /api/confirm, /api/contact on the site worker
- Email: Resend (rentresilience.org, verified) + the `kyle@` and `help@` boxes

## Desktop landing page

- [ ] Page loads clean in Chrome and Safari; theme toggle cycles
      light/dark and survives a reload
- [ ] Desktop nav links scroll to each section; no hamburger visible
- [ ] Try-it-now: Pay 1c opens the wallet picker
- [ ] With MetaMask or Rainbow installed, that wallet appears via the
      6963 discovery row and connects on the right account
- [ ] Base app row opens the keys.coinbase.com connect popup
- [ ] WalletConnect row shows a client-drawn QR; scan it with a phone
      wallet and complete the 1c transfer (the one manual check still
      outstanding from the build log)
- [ ] After the transfer, the page shows "Confirming onchain... (n/10)"
      and settles into the receipt card with the real tx hash
- [ ] Submit the email after paying: the "you're in" email arrives within
      a couple of minutes (first payment with an email only; repeat
      contacts must send nothing)
- [ ] Share card: PNG downloads, copy puts share text on the clipboard,
      and the X/Farcaster buttons open pre-filled composers
- [ ] Footer and FAQ links all land (verified programmatically 2026-09-09;
      spot-check visually)

## Desktop status page

- [ ] Loads at rentresilience.org/status; no console errors
- [ ] Footer personal link goes to kylebrodeur.xyz (fixed from the dead
      kylebrodeur.com on 2026-09-09) and the mailto opens
- [ ] The "last update" date matches the latest worklog entry

## Docs site

- [ ] Index, protocol, and roadmap pages render at docs.rentresilience.org
- [ ] Repo-relative links inside pages resolve to GitHub (the sync script
      rewrites them); no 404s
- [ ] A push touching docs/ triggers the Docs site workflow and it passes
      (both workflows went green on 2026-09-09 after the pnpm setup fix)

## Worker API

- [ ] POST /api/confirm with a valid but unlanded hash returns 404 with
      "Not seen onchain yet", then resolves once the tx lands (client
      retries every 3s up to 10 rounds)
- [ ] POST /api/confirm with the real 1c tx returns `already-logged`
- [ ] A Base-app userOperation hash maps to the real tx hash (via_userop
      tag in PostHog)
- [ ] Sixth contact attempt from one IP inside 10 minutes returns 429
- [ ] A disposable-domain email gets 422 with the "can't receive mail"
      copy
- [ ] rentresilience.org, /status, and the app icon PNG all return 200

## Email lane

- [ ] The confirmation email arrives from Kyle personally at the kyle-at
      rentresilience address; reply-to is the same; button opens the
      site with ?tx= prefilled
- [ ] The ?tx= lane: page pre-fills the paste field, scrolls to the
      opt-in section, verifies, and shows the receipt card (verified in
      Playwright; confirm once on a real browser)
- [ ] Delivered send + repeat payment + repeat contact produces no second
      email (KV flag `yourein:<email>` holds)
- [ ] Send a test message from another account to kyle@ and to help@ and
      confirm both receive (Resend receiving MX, added 2026-09-08)
- [ ] Replying to the confirmation email lands in Kyle's inbox (help-at
      box is the public general box)

## Mobile (real devices: iOS Safari, Android Chrome)

- [ ] Hamburger opens the right-anchored dropdown holding the theme
      toggle and protocol link
- [ ] No horizontal scroll at 320px and 390px widths
- [ ] Tap Pay 1c: the named chooser shows (Base app, MetaMask, Rainbow,
      Trust, raw wc: fallback) instead of an empty QR box
- [ ] Base app row opens the app and the approval prompt appears (this
      lane was rebuilt on the Base Account SDK after the July 2025
      deep-link break; the Rainbow lane is known good from Kyle's live
      test)
- [ ] The tx hash returns automatically over the relay; a killed tab
      falls back to the paste field, which still works
- [ ] Inputs and buttons are 44px targets; the form stacks input/button
      below 360px
- [ ] The ?tx= lane works on mobile
- [ ] The share PNG download works on iOS Safari (download attribute
      quirks: verify it saves or at least opens the image)

## Infra and telemetry

- [ ] Cloudflare zone: Resend DKIM/SPF/receiving MX/tracking records
      present, no stale Namecheap eforward records (cleaned 2026-09-08)
- [ ] Resend domain shows fully verified
- [ ] KV rows as expected: payment row for the 1c opt-in, the
      `yourein:` flag, recent `rl:` rate-limit buckets (pnpm kv:pull)
- [ ] PostHog shows the funnel: optin_confirm, email_signup, yourein_sent
      (and via_userop on the smart-wallet lane)
- [ ] Both GitHub Actions workflows green on main

## Tooling that makes this fast

- `wrangler tail --format json` from site/ streams worker logs (RPC
  endpoint rotation, email send results)
- `pnpm kv:pull [founding|paid|emails|all]` dumps KV rows to local
  gitignored JSON (docs/kv-data-pulls.md)
- `pnpm lint`, `pnpm lint:rules:test`, `pnpm lint:md` run every gate
  locally before a push (CI runs the same set)
- docs/email-signups.md documents the email flow and the unstick
  procedure for a stuck send
