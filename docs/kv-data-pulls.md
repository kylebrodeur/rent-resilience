# Pulling opt-in data from Cloudflare

The landing page writes opt-in records into the `RENT_OPTIN` KV namespace.
This runbook explains what is stored and how to pull it locally.

## What is in the namespace

| Key shape | Record | Contents |
| --- | --- | --- |
| `<txHash>` | payment record | `payer` wallet address, `txHash`, `network`, `at`, and `email` + `emailAt` when the payer later gave an email |
| `email:<txHash or email>:<timestamp>` | email capture | `email`, `via` (`post-payment` or `email-only`), `txHash`, `at`, `verify` |
| `contact:<uuid>` | legacy email capture (pre-2026-09-08 worker) | `email`, `note`, `via`, `txHash`, `at` |
| `rl:<ip>:<bucket>` | rate limiter | ephemeral, skipped by the pull tool |

The canonical "paid + email" record is the payment record: `/api/contact`
folds the email into it at signup, so the founding list is one KV lookup.

## Usage

```sh
wrangler login        # once; opens the browser
pnpm kv:pull founding # the paid + email list
pnpm kv:pull paid     # every payment record, anonymous included
pnpm kv:pull emails   # every email capture
pnpm kv:pull all      # everything in one file
```

Output lands in `site/.kv-data/<mode>-<date>.json`, which is gitignored.

## Handling rules

- The files contain emails and wallet addresses. Keep them local; never
  commit them or paste contents into shared docs, issues, or the dashboard.
- The founding NFT drop (wk 3, Sep 22 to 23) reads from `pnpm kv:pull founding`.
- Counts print to the terminal; row contents print nowhere. If you need to
  eyeball a single record, open the JSON file directly.
