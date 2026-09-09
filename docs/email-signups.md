# Email signups and the "you're in" confirmation

How the email lane works end to end: signup capture, the one-shot confirmation
email, and the ops levers when something gets stuck.

## Flow

1. The landing page form POSTs to `/api/contact` with `email`, optional
   `txHash`, and `via`.
2. `contactAllowed` rate limits per IP: 5 attempts per 10-minute bucket,
   stored in KV with a 1-hour TTL. Coarse by design; KV is eventually
   consistent, so a burst can slip through. The real wall is a Cloudflare WAF
   rate-limiting rule on the zone, not the worker.
3. The handler validates the address, runs `verifyEmail` (disposable and
   undeliverable addresses get a 422), and writes an `email:` audit row.
4. If the contact carries a confirmed payment's `txHash`, the email folds into
   the payment KV row (canonical join: "paid + email" is one lookup). The
   first fold triggers the one-shot "you're in" email; re-folds never re-send.

## The "you're in" email

- Sent via Resend's plain HTTPS API from the worker (no SDK). From is
  `Kyle Brodeur <kyle at rentresilience dot org>`; replies and the unsubscribe
  link go to the help-at box.
- Exactly one send per address, ever. The KV flag `yourein:<email-lowercase>`
  is written only after Resend accepts the message, so a failed send leaves no
  flag and retries naturally; a delivered send never repeats, even across
  repeat payments.
- The button links to the site with `?tx=<hash>`; the page pre-fills the
  paste field, scrolls to the opt-in section, verifies, and shows the receipt
  card on load.
- Send failures are telemetry only (`yourein_send_failed` with the HTTP
  status) and never fail the signup response.

## Ops: checking and unsticking

- KV flag present? `wrangler kv key get "yourein:<email>" --binding RENT_OPTIN
  --remote` (or `pnpm kv:pull emails`).
- Resend status: query the domain (id
  `9af145bc-8b9d-4ae7-8ba3-7534c74a86eb` in Resend) for the message's
  `last_event`; `delivered` is the finish line.
- Stuck send with no KV flag: fold the email onto the payment row is not
  needed if `pay.email` is already set. To re-arm the flow for one payment,
  remove `email`/`emailAt` from that payment's KV row and re-POST
  `/api/contact` with the same email and `txHash`.
- Domain verification (DKIM/SPF/MX/tracking) lives in Resend's domain
  settings; conflicting root MX records block full verification. The current
  receiving MX is Resend's inbound endpoint for the `kyle@` and `help@` boxes.

## Rate limits

| Layer | Limit | Where |
| --- | --- | --- |
| Worker KV | 5 attempts per IP per 10-minute bucket | `contactAllowed` |
| Cloudflare WAF | configured rate-limiting rule on `/api/contact` | zone dashboard |
| Resend | per-account sending limits | Resend dashboard |

KV free-tier budget: 1,000 writes/day shared across opt-in rows, audit rows,
rate-limit buckets, and the dedup flag.
