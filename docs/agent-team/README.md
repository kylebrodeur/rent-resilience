# Rent Resilience agent team

Five OMP sessions in one Zellij layout: four implementation/verification lanes plus
an advisor/coordinator. Started with `./scripts/rr-agents.sh`.

## Roles

| Role | Model | Owns | Never touches |
|---|---|---|---|
| `schemas` | kimi-k2.7-code | `packages/protocol/schemas/**` | services, simulations, site |
| `ledger` | kimi-k2.7-code | `services/api/**` (event store, API, signing) | schemas, simulations |
| `dataset` | kimi-k2.7-code | `simulations/rent-history/**` | schemas, services |
| `verifier` | gemma4:31b-cloud | `tests/invariants/**` + checklist execution | all implementation (read-only) |
| `advisor` | glm-5.2:cloud | Team-State, decisions, conflicts, worklog; Pi Link hub (port 9900) | all product source |

Every lane's operating contract is its `.omp/agents/rr-<role>.md`; protocol rules live
in `.agents/skills/protocol-dev/SKILL.md` and `docs/protocol.md`.

## Documentation flow

- `Team-State.md` — active lanes, ownership, handoff status. **Advisor is the single
  writer.** Specialists report through handoffs; the advisor records.
- `decisions.md` / `conflicts.md` — registers the advisor writes; specialists never
  edit concurrently.
- `handoffs/` — commit-pinned handoff documents (base SHA, files, evidence, approval
  state). A handoff without a pinned commit is not a handoff.
- `handoffs/scratchpads/<role>.md` — each role's persistent environment notes.
- `Worklog.md` — append-only session log. Every session ends with a dated entry
  (done / decided / next).

## Handoff lifecycle

1. Lane completes its assignment, writes a commit-pinned handoff, stops at
   `<LANE>_REVIEW` (schemas: `SCHEMA_REVIEW`, ledger: `LEDGER_REVIEW`,
   dataset: `DATASET_REVIEW`).
2. Verifier checks out the pinned SHA, executes the invariant checklist
   (tamper / replay / gap / round-trip / determinism / no-PII / append-only),
   writes `VERIFY_<LANE>_<RESULT>`.
3. Kyle approves; advisor records in Team-State and the decision register; the
   integrating change lands.
4. Nothing merges without Kyle's explicit approval. Agents never deploy
   (`wrangler deploy` is Kyle's word only).

## Learnings carried from the other two agent teams

From **enviro-grow-pico** (the template):
- omp runs synchronously in the foreground inside the Zellij pane — backgrounding it
  corrupts PTY capability routing and spins the restart loop.
- The "first turn" instruction lives in the generated system prompt, never as a
  positional CLI argument (a startup race once split it word-by-word into turns).
- Advisor starts first and wins the Pi Link hub bind (port 9900); other lanes poll.
- Session history lives on disk (`omp -r` resumable); `--fresh` is the only deleter.

From **btc-market-learning-lab** (the stricter governance):
- Single-writer control board; concurrent edits to shared registers caused real
  merge pain there. Specialists write handoffs, never the registers.
- Exact base/worktree recorded before each activation; unpinned "latest" is refused.
- Verification honesty: passing synthetic checks are not provider conformance; report
  exactly what ran. Failed streams are evidence — never discarded silently.
- Pi Link was DISABLED there pending runtime verification. Here it starts enabled
  (enviro proved the mechanics) — if it misbehaves, fall back to handoff-file
  coordination and note it in the conflict register rather than blocking.

## Quick start

```bash
./scripts/rr-agents.sh              # attach or create (resume all)
./scripts/rr-agents.sh --fresh      # reset all five roles
./scripts/rr-session.sh status      # who's running, session counts
./scripts/rr-session.sh new ledger  # fresh session for one lane
./scripts/rr-session.sh stop dataset
```