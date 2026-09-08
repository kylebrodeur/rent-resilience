# Protocol dev — Rent Resilience packages

Skills and rules for any code session touching `packages/protocol`, the event store,
signing, or reliability derivation in this project. Invoke before writing protocol code.

## Non-negotiable invariants (from docs — read them, don't re-derive)

Source of truth: public repo `docs/protocol.md` (92 lines — read it fully at session
start). The invariants that break code most often:

1. **Append-only** — never generate code that UPDATEs or DELETEs events. Corrections are
   new `CorrectionIssued` events. If a diff mutates stored events, reject the design.
2. **Integer money** — all amounts are integers in minor units. Never `Number.parseFloat`,
   never floats in resolution math.
3. **No PII in protocol objects** — party/property/policy references are opaque ids
   (`pty_`, `prp_`, `pol_`, `prv_`, `pd_`). Free-text payload fields are forbidden in v0.1.
4. **Derived state** — obligation status is a fold over the event stream. Any code that
   stores computed status as authoritative (rather than cached projection) is wrong.
5. **Canonical bytes** — signatures and hashes are over JCS (RFC 8785) of the event with
   `signature` removed, via the `canonicalize` npm package. Never `JSON.stringify`.
6. **Deterministic policy** — `ModificationAccepted` requires `policy_decision_id`;
   agents never approve. Policy evaluation: same input + same policy version → same output.
7. **Assistance does not erase reliability** — assisted month ends `current_independent_streak`,
   never reduces `satisfied` or `lifetime_obligations`.

## Stack (fixed by roadmap-architecture.md — don't relitigate in code sessions)

- TypeScript, Fastify or Hono, Postgres (plain SQL, no ORM needed at wk 1 scale)
- Validation: JSON Schema draft 2020-12 (schemas in public repo `packages/protocol/schemas/`)
- Canonicalization: `canonicalize` npm · Signing: `@noble/curves`, Ed25519 (`EdDSA`), `did:key:z6Mk…` key ids
- Event store: `UNIQUE (obligation_id, sequence)` is the concurrency control; 409 on gaps/dupes
- Synthetic data: seeded PRNG, byte-identical re-runs; rent levels from HUD FY 2026 FMRs

## Validation checklist (run before declaring protocol code done)

```bash
# schemas validate (ajv or similar against the two v0.1 schemas)
# tamper test: flip one payload byte → verify must fail
# replay test: derivation from events == derivation from reseeded regenerate
# gap test: inserting sequence 1,3 must be rejected at the store
# round trip: sign → canonicalize → verify passes; JSON.stringify instead of JCS fails
```

## Delegate per house style

Implementation goes to omp-rpc (`kimi-k2.7-code`); review to `k3/deepseek-pro`.
Claude orchestrates, verifies against the invariants above, and writes the tests.
See the `delegating-to-omp-rpc` / `using-omp-rpc` skills for the invocation pattern.

## Reference paths

- Protocol spec: `~/workspace/rent-resilience/docs/protocol.md`
- Schemas: `~/workspace/rent-resilience/packages/protocol/schemas/*.v0.1.schema.json`
- Architecture + phase exits: `docs/roadmap-architecture.md` (dev repo)
- Day plan + homework: `docs/wk1-prep-homework.md` (dev repo)
- Dashboard (canonical status): `docs/project-reference.html` (dev repo)