# x402 Opt-In Spike — design, implementation, and runbook

**Status:** live spike as of 2026-09-08 · **Owner:** kylebrodeur · **Repo:** this one

This is the first x402 spike into the system: a paid endpoint on rentresilience.org that
an agent can pay without onboarding, and that records paying agents as early-access
signups. It is deliberately small. It proves the payment rail works end to end before the
protocol's proof endpoints exist.

## What it does

`POST /api/optin` on the site Worker:

1. No `X-PAYMENT` header → **402 Payment Required** with an `accepts` block describing the
   price, the USDC contract, the network, and the receiver address.
2. With `X-PAYMENT` (base64 of a signed x402 payment payload) → verify with the
   facilitator, settle on Base, log the settlement to KV, return a receipt.
3. The caller holds an onchain receipt (the settlement tx hash). We hold a waitlist row
   keyed by payer address and tx hash. Neither side collected an email.

## Why this shape and not a proof endpoint

The research doc's milestone is *an unrelated agent pays for a verification with zero
manual onboarding*. A proof endpoint needs reliability data to be real first — that data
lives in the sandbox ledger, which is weeks out. An opt-in needs only a payer, a price,
and a durable log. Same handshake, no dependency. When the proof endpoints ship, this
route's verify/settle code is reused unchanged; the resource and price metadata are the
only differences.

## Configuration

| Field | Value | Why |
|---|---|---|
| Network | `base-sepolia` for the agent 402 lane; `base` for the wallet QR lane | Consumer wallet apps don't list testnet tokens — the QR path must be mainnet. The agent path stays Sepolia (free, no CDP keys). |
| Asset | USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Base Sepolia, agents) · `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Base, QR lane) | Stable unit of account; no token of ours exists. |
| Price | `10000` atomic units = **0.01 USDC** | The price is a statement — paying one cent proves you meant to. |
| payTo | Kyle's Base wallet | The settlement destination is public onchain identity already; receipts are auditable publicly. |
| Scheme | `exact` with EIP-3009 (`transferWithAuthorization`) | Gasless authorization transfer; the agent signs, the facilitator submits. |
| Facilitator | `https://www.x402.org/facilitator` | Hosted x402 reference facilitator; no auth needed for Base Sepolia. |

Promotion checklist before mainnet: CDP API keys from portal.cdp.coinbase.com (KYT
screening and 1,000 free settled transactions/month), network/asset fields switch to
`base` + mainnet USDC, and the site route gets rate limiting.

## Data safety

- What we persist: payer address, settlement tx hash, timestamp. That's it. An event, not
  a person. No email, no names, nothing the ledger pattern forbids.
- What we don't do: no refunds flow (it's a cent), no recurring charge, no address
  harvesting elsewhere on the page.
- KV namespace `RENT_OPTIN` is append-only by convention; deletes only for a requester.
- Builder Code `bc_1utyhkys` is not in the settlement calldata (receivers don't control
  payer transactions). It *is* in the anchor/x402-seller flows we originate; the opt-in
  attribution arrives via the facilitator's settlement activity on our address.

## Failure behavior

- Facilitator down or invalid payment → 402 again with `invalidReason` surfaced, never a
  500 with partial state. The waitlist row is written only after settlement returns a
  `transaction` hash.
- Replay: settlement of an already-settled payload errors at the facilitator; we return
  409 with the original receipt link.
- KV write failure after settlement: log the tx hash in the response body so the payer
  can still reference it, and alert. The chain is the source of truth; KV is convenience.

## Verifying by hand

```bash
# Expect: HTTP 402 with JSON { x402Version: 1, accepts: [...] }
curl -i -X POST https://rentresilience.org/api/optin
```

A paid end-to-end run needs an x402-capable agent wallet (EIP-3009 signing on Base
Sepolia). That's the test harness in `tools/x402-optin-test` (or run by hand with
`@x402-fetch` style clients). Record the tx hash in the project history when the first
external agent pays.

## Cost

Sepolia: zero. Mainnet after promotion: Coinbase facilitator charges nothing for the
first 1,000 settled transactions each month, then $0.001 each. The spike pays for itself
long past any realistic test volume.
