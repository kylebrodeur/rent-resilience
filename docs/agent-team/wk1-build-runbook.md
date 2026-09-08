# Week 1 build runbook (Sep 9 to 14)

The one-page operating plan for week 1. Day plan mirrors the dashboard
(project-reference.html); this file adds the per-day checklists and handoff
discipline. Append progress to `Worklog.md`, not here.

## Day plan

| Day | Lane | Output |
| --- | --- | --- |
| Wed Sep 9 | Schemas | `provider-capability` + `deterministic-policy` v0.1 schemas; freeze `RentObligation`/`RentEvent` v0.1 unless a build blocker surfaces |
| Thu Sep 10 | Dataset | Synthetic dataset: 100 renters x 24 months, six scenario classes |
| Fri Sep 11 to Sat Sep 12 | Ledger | TS API + append-only event store + event signing + derived obligation state |
| Sun Sep 13 | Reliability | Reliability engine + proof-of-behavior on the synthetic dataset |
| Mon Sep 14 | Ritual | Ship review: reconstruct test, reliability determinism test, wk 2 plan |

## Day-by-day checklists

### Wed: schemas

- [ ] `packages/protocol/schemas/provider-capability.v0.1.schema.json`
- [ ] `packages/protocol/schemas/deterministic-policy.v0.1.schema.json`
- [ ] Policy schema must encode the fixed resolution order: correction, flex,
      assistance, employer benefit, financing. Debt last, always.
- [ ] All four schemas validate with a JSON Schema runner (pick one runner,
      record it in the runbook here)
- [ ] No PII fields anywhere: opaque IDs + integer minor units only
- [ ] Exit check: an external developer could implement from the schemas alone

### Thu: dataset

- [ ] Generator script under `simulations/` (deterministic seed, PEP 723 via uv
      or TS via pnpm; one language, recorded here)
- [ ] 100 renters x 24 months, covering: on-time, approved late, assistance,
      failed payment, correction, multi-source resolution
- [ ] Output is JSONL of `RentEvent` records that pass schema validation
- [ ] Every scenario class tagged so the reliability engine can be checked
      per class on Sunday

### Fri to Sat: ledger

- [ ] `packages/ledger/` TS package scaffold
- [ ] Postgres/Supabase append-only event store (no UPDATE/DELETE grants)
- [ ] Event signing: which key, which envelope; record the decision
- [ ] Derived obligation state reconstructed from events alone (the
      reconstruct test is the acceptance test)
- [ ] Corrections are new events; nothing ever mutates

### Sun: reliability

- [ ] `packages/reliability/` engine (or a function inside the ledger package;
      choose one, record it)
- [ ] Assisted months close the obligation and stay satisfied; independent
      streak ends; both facts derivable from events only
- [ ] Run against the full dataset; per-scenario results recorded
- [ ] Same input, same output, twice: determinism check

### Mon: ship review

- [ ] Reconstruct demo: obligation state rebuilt from event stream, live
- [ ] Reliability claims reproducible on the dataset
- [ ] Write the wk 2 plan; note anything Phase 0 said that reality contradicted

## Working with the agent team

- Build lanes (build-api, build-sim) get one handoff doc per day; the handoff
  names the deliverable, the schema invariants it must respect, and the test
  that proves it.
- Completed day checklists become verifier-lane handoffs (deepseek review
  against this runbook's exit criteria).
- The teacher role stays on the homework lane and does not block build lanes.

## Exit criteria (from the roadmap, unchanged)

1. Any obligation reconstructs entirely from events.
2. Assistance does not destroy historical reliability.
3. No PII is required in protocol events.
4. Reliability claims reproduce deterministically.
