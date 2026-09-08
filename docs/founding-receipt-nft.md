# Founding Receipt NFT: design and deploy runbook

**Status:** code ready (`contracts/FoundingReceipt.sol`), deliberately **not deployed
before the Batches application is submitted.** Deploy whenever after that; it is one
signature and cents of gas.

## Why it exists

The opt-in spike (docs/x402-opt-in-spike.md) proves payer interest with a 1¢ USDC
transfer. This contract turns that into a durable onchain receipt: an ERC-721 where
token ID = position on the opt-in list. "I was here before there was a product" as a
souvenir with a verifiable order. It is a marketing artifact for the protocol, not a
speculative asset: no royalties, no floor price narrative, and the mint is
permissionless claim-by-proof.

It is also the project's first verified Base contract, which feeds builder-attribution
signals independent of the Batches outcome.

## Deploy (Kyle, ~5 min)

1. Remix: open [FoundingReceipt.sol](../contracts/FoundingReceipt.sol), compiler
   0.8.24+, constructor arg = the metadata base URI (e.g.
   `https://rentresilience.org/receipt/`).
2. Connect the deployer wallet on Base mainnet via Injected Provider, deploy, verify on
   Basescan (source + constructor args; OZ v5.4.0 imports as written).
3. Note the address in this file's history section and on the dashboard. From then on,
   every transaction this contract receives is Builder-Code-attributed activity.

## Claim integration (after deploy)

- `/api/confirm` gains a one-line response field: `mintAt` link with the tx hash
  pre-filled (a simple page on the site calling `claim(bytes32(txHash))` through the
  user's connected wallet).
- The claim page checks onchain: the tx hash shows a ≥0.01 USDC transfer to payTo, and
  `_claimed[hash]` is false. The wallet prompts the user's signature; the contract does
  the rest.
- No backend keys are needed for minting; the contract is self-service; the site only
  verifies qualification and deep-links the call.

## Metadata

One `receipt.json` per token at `<baseURI>/<tokenId>` from the Worker. All tokens share
the same art (sprout under roof, gold on charcoal) with the receipt number rendered in
the metadata. If we ever need per-token files they're static; the Worker's ASSETS
binding serves them.

## Integrity notes

- Claim does not move funds. Verification of payment happened off-chain at
  `/api/confirm` time; the mint only records position.
- One claim per tx hash is enforced in-contract (`_claimed`).
- Supply is naturally bounded by the opt-in list; there is no mint deadline, because
  there is no price: claims stay open while the spike runs, and the spike ends when the
  real proof endpoints take over.
