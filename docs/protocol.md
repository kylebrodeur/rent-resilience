# Rent Resilience Protocol v0.1

> **Private facts. Public proofs. Portable trust.**

This document specifies the v0.1 protocol objects and their semantics. Schemas live in
[`packages/protocol/schemas/`](../packages/protocol/schemas/). Everything else in the
system (obligation status, reliability claims, proofs) is **derived from events**.

## Objects

| Object | Schema | Purpose |
| --- | --- | --- |
| `RentObligation` | [`rent-obligation.v0.1.schema.json`](../packages/protocol/schemas/rent-obligation.v0.1.schema.json) | A verifiable housing obligation (what is owed, by whom, when). |
| `RentEvent` | [`rent-event.v0.1.schema.json`](../packages/protocol/schemas/rent-event.v0.1.schema.json) | An append-only, signed fact about an obligation. |

## Invariants

1. **Append-only.** Events are never edited or deleted. Corrections are `CorrectionIssued`
   events that reference the corrected event; derivation applies them.
2. **No PII in protocol objects.** Party, property, policy, provider, and document
   references are opaque identifiers resolved only inside the private data plane.
3. **Derived state.** An obligation's `status` is a cached projection. Any obligation must
   reconstruct entirely from its event stream.
4. **Signed facts.** Every event carries a detached issuer signature over the JCS
   (RFC 8785) canonical serialization of the event with `signature` removed.
5. **Assistance does not erase reliability.** Reliability derivation counts satisfied
   obligations and separately counts independently funded ones. An assisted month ends an
   *independent* streak, never the *satisfied* record.
6. **Integer money.** All amounts are integers in minor units of the obligation currency.
7. **Agents orchestrate; policy decides.** `ModificationAccepted` must reference a
   `policy_decision_id` produced by the deterministic policy engine.

## Event state-transition table

Derived obligation status per event type. A cell reading `none` means the event does
not change status by itself (it contributes to derivation inputs).

| Event | Allowed prior status | Status after |
| --- | --- | --- |
| `ObligationCreated` | (none) | `pending` → `due` at `due_at` |
| `PaymentScheduled` | `due`, `in_resolution` | none |
| `PaymentSubmitted` | `due`, `in_resolution` | none |
| `PaymentSettled` | `due`, `in_resolution` | `satisfied` if settled sources cover `amount_due`, else none |
| `PaymentFailed` | `due`, `in_resolution` | none (may trigger resolution) |
| `ModificationRequested` | `due` | `in_resolution` |
| `ModificationAccepted` | `in_resolution` | none (new schedule active) |
| `ModificationDeclined` | `in_resolution` | `due` if no other active flow |
| `AssistanceRequested` | `due`, `in_resolution` | `in_resolution` |
| `AssistanceCommitted` | `in_resolution` | none |
| `AssistanceSettled` | `in_resolution` | `satisfied` if sources now cover, else none |
| `FinancingCommitted` | `in_resolution` | none |
| `LandlordConcessionAccepted` | `due`, `in_resolution` | reduces effective amount due |
| `CorrectionIssued` | any | recomputed from corrected stream |
| `DisputeOpened` | any non-terminal | `in_resolution` |
| `DisputeResolved` | `in_resolution` | recomputed |
| `ObligationSatisfied` | `due`, `in_resolution` | `satisfied` (terminal) |

`ObligationSatisfied` is only valid when settled funding sources plus accepted concessions
sum to `amount_due`. `unresolved` is a terminal derivation outcome (deadline passed,
resolution paths exhausted/expired), not an event.

## Reliability claims (v0.1)

Derived deterministically per renter party from satisfied obligations:

```text
lifetime_obligations       count of obligations reaching a terminal state
satisfied                  count with status satisfied
independently_funded       satisfied obligations whose settled sources are 100% funding_source_type = renter
assistance_events          satisfied obligations that include assistance/financing/employer sources
unresolved_defaults        count with status unresolved
current_independent_streak consecutive most-recent independently funded satisfactions
longest_independent_streak max historical run
```

Claims are facts, not scores. Consumers apply their own policies to facts the renter
authorizes them to see.

## Canonicalization & anchoring

- Canonical bytes: JCS (RFC 8785) over the event object with `signature` removed.
- Event hash: SHA-256 of canonical bytes.
- Merkle batches of event hashes are anchored to Base. The public chain sees roots only:
  no identifiers, no amounts, no PII.
- Inclusion proofs let an authorized verifier confirm an event's existence and integrity
  without the ledger operator being trusted for history.

## Versioning

Schemas are additive within a minor version. Breaking changes bump the version in `$id`
and `schema_version`. Events are immutable; a stream may contain mixed schema versions,
and derivation must handle every version ever written.
