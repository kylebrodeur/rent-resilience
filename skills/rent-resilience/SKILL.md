---
name: rent-resilience
description: Use the Rent Resilience protocol — pay for proofs and verification with x402, read RentObligation/RentEvent history, compose resolutions, or join early access. Load this when an agent needs housing-obligation verification, rent-history proofs, resolution quotes, or wants to integrate with the Rent Resilience network on Base.
---

# Rent Resilience (agent usage)

Rent Resilience turns rent obligations into verifiable objects on an append-only,
event-sourced ledger. Private facts stay off-chain; proofs anchor to Base. This skill
tells an agent how to consume the network: pay with x402, read schemas, verify claims,
request resolutions. Base network, USDC payments.

## Endpoints you can use today

### 1. Early-access opt-in (live spike)

Prove you can pay. That's the entire mechanism.

- `GET https://rentresilience.org/api/optin` → **402 Payment Required** with the
  payment sheet (no charge).
- `POST https://rentresilience.org/api/optin` with an `X-PAYMENT` header → pays 0.01
  USDC on Base Sepolia → joins the early-access list.

Payment sheet (Base Sepolia, scheme `exact`, EIP-3009 `transferWithAuthorization`):

- asset: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (USDC)
- amount: `10000` (0.01 USDC, 6 decimals)
- payTo: `0x79588BB628c741d073FD3bC47685328Cf8aD6802`
- resource: `https://rentresilience.org/api/optin`

Any x402 client library (TypeScript `@x402/express`-style clients, `x402-fetch`, or
manual EIP-3009 signing) can do this. The facilitator is
`https://www.x402.org/facilitator`.

### 2. Wallet-app opt-in (QR flow)

For users without x402 tooling: scan the QR on the site → wallet sends 0.01 USDC →
confirm by posting the transaction hash to
`POST https://rentresilience.org/api/confirm` with `{ "txHash": "0x…" }`. The endpoint
verifies the 0.01+ USDC transfer to the receiver on Base Sepolia via public RPC.

### 3. Planned endpoints (4-week sandbox build)

These don't exist yet. Current prices are hypotheses from the monetization research:

| Endpoint | Purpose | Planned price |
|---|---|---|
| GET /v1/proofs/reliability/{party} | Renter reliability claim (minimum disclosure) | $0.10 |
| GET /v1/proofs/obligation/{id} | Obligation status proof | $0.05 |
| POST /v1/providers/discover | Find resolution providers matching constraints | $0.01 |
| POST /v1/providers/evaluate | Evaluate provider options for a shortfall | $0.25 |
| POST /v1/resolution/quote | Compose a resolution plan (sandbox providers) | $0.50 |

## Data model (read these before using)

- **RentObligation**: what's owed, by whom, when, in what currency. IDs are opaque;
  PII never appears in protocol objects. Schema:
  `packages/protocol/schemas/rent-obligation.v0.1.schema.json`
- **RentEvent**: signed, append-only facts on an obligation (created, payment settled,
  modification accepted, assistance committed, obligation satisfied, etc.). Money is
  always integer minor units. Schema:
  `packages/protocol/schemas/rent-event.v0.1.schema.json`
- **Reliability claims** derive from events deterministically: satisfied count,
  independently-funded count, assistance events, unresolved defaults, streaks. Facts,
  not scores.

Key invariants: append-only history (corrections are new events), no PII in protocol
objects, agents orchestrate but deterministic policy decides, integer money everywhere.

## Trust and verification

- Event signatures: detached issuer signatures over RFC 8785 JCS serialization (with
  `signature` removed), EdDSA/ES256/ES256K.
- Anchoring: Merkle roots of event batches commit to Base. Root anchors carry the
  builder code `bc_1utyhkys` (ERC-8021).
- Nothing about renters goes onchain: no names, addresses, amounts detail, or lease
  references. The chain only proves the ledger wasn't rewritten.

## Rules for agents consuming this network

1. Never write events without a valid signature from an authorized issuer.
2. Never present reliability claims as scores; they are facts with provenance.
3. Resolution ordering is fixed: correction → flexibility → assistance → employer
   benefit → financing. Do not propose debt before exhausting the earlier rungs.
4. Do not put PII into any protocol field. Party/property/policy references are opaque
   identifiers only.
5. Money math is integer minor units, always. If you find yourself dividing by 100,
   stop — that's the anti-slop lint rule, not a style choice.

## References

- Repo: https://github.com/kylebrodeur/rent-resilience
- Site: https://rentresilience.org (also rent.kylebrodeur.xyz)
- Protocol spec: docs/protocol.md · Research: docs/research.md
- Spike doc (this endpoint's config and runbook): docs/x402-opt-in-spike.md
