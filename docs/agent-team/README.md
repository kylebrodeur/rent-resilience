# Rent Resilience agent team

Six OMP sessions in one Zellij layout: four implementation/verification lanes, a
teacher, and an advisor/coordinator. Started with `./scripts/rr-agents.sh`.
Commands and per-tool usage: `RUNBOOK.md` in this directory.

## Roles

| Role | Model | Owns | Never touches |
| --- | --- | --- | --- |
| `schemas` | kimi-k2.7-code | `packages/protocol/schemas/**` | services, simulations, site |
| `ledger` | kimi-k2.7-code | `services/api/**` (event store, API, signing) | schemas, simulations |
| `dataset` | kimi-k2.7-code | `simulations/rent-history/**` | schemas, services |
| `verifier` | deepseek-v4-pro:cloud | `tests/invariants/**` + checklist execution | all implementation (read-only) |
| `teacher` | kimi-k3:cloud | `docs/agent-team/learning/**` (homework guidance, quiz + kata log) | product code, registers |
| `advisor` | glm-5.3:cloud | Team-State, decisions, conflicts, worklog; Pi Link hub (port 9900) | all product source |

### Model roster and alternates

Set in `scripts/rr-agent-terminal.sh` (launch default) and each `.omp/agents/rr-<role>.md`
frontmatter. Upgraded 2026-09-08 from ollama-cloud inventory (`omp models`).

- Coding lanes (schemas/ledger/dataset): `kimi-k2.7-code:cloud`, Kyle's standing
  coding model. Alternates: `gpt-5.6-luna`/`gpt-5.6-terra` (openai-codex provider),
  `claude-sonnet-4-6` (google-antigravity).
- Verification: `deepseek-v4-pro:cloud` (1M context), Kyle's standing review model.
  Alternate: `kimi-k3:cloud`.
- Teaching: `kimi-k3:cloud`. Alternate: `gemini-3.8-flash` via google-antigravity.
- Coordination: `glm-5.3:cloud` (10 days newer than 5.2). Alternate: `glm-5.3-flash:cloud`
  when cost-sensitive.

The gemini, claude, and codex model families come from omp's `google-antigravity`,
`google-gemini-cli`, and `openai-codex` providers (`omp models` to list). The codex
CLI itself is not installed; gpt-5.x models still route through omp's openai-codex
provider.

Every lane's operating contract is its `.omp/agents/rr-<role>.md`; protocol rules live
in `.agents/skills/protocol-dev/SKILL.md` and `docs/protocol.md`.

### Standalone vs. team

Any role runs standalone in any terminal: `./scripts/rr-agent-terminal.sh teacher`.
The Pi Link hub wait is capped at 5 seconds, so a standalone session starts fine
without the team; it just has no Link peers (coordinate via the handoff files
instead). Don't run the same role both ways at once: both share one session dir
(`.omp/rr-agents/<role>/`), and two omp processes appending to the same session
history will corrupt it.

## Documentation flow

- `Team-State.md`: active lanes, ownership, handoff status. **Advisor is the single
  writer.** Specialists report through handoffs; the advisor records.
- `decisions.md` / `conflicts.md`: registers the advisor writes; specialists never
  edit concurrently.
- `handoffs/`: commit-pinned handoff documents (base SHA, files, evidence, approval
  state). A handoff without a pinned commit is not a handoff.
- `handoffs/scratchpads/<role>.md`: each role's persistent environment notes.
- `Worklog.md`: append-only session log. Every session ends with a dated entry
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

## Learnings carried from earlier agent teams

Two agent teams ran before this one. They are past projects, not references:
nothing in this repo points at their code, and no agent should go looking for
them. These notes are everything that carried over.

**enviro-grow-pico**, the agent-team setup this repo's runner scripts were
adapted from:

- omp runs synchronously in the foreground inside the Zellij pane; backgrounding it
  corrupts PTY capability routing and spins the restart loop.
- The "first turn" instruction lives in the generated system prompt, never as a
  positional CLI argument (a startup race once split it word-by-word into turns).
- Advisor starts first and wins the Pi Link hub bind (port 9900); other lanes poll.
- Session history lives on disk (`omp -r` resumable); `--fresh` is the only deleter.

**btc-market-learning-lab**, an earlier team whose stricter governance rules were
adopted here:

- Single-writer control board; concurrent edits to shared registers caused real
  merge pain there. Specialists write handoffs, never the registers.
- Exact base/worktree recorded before each activation; unpinned "latest" is refused.
- Verification honesty: passing synthetic checks are not provider conformance; report
  exactly what ran. Failed streams are evidence, never discarded silently.
- Pi Link was DISABLED there pending runtime verification. Here it starts enabled
  (enviro-grow-pico proved the mechanics); if it misbehaves, fall back to handoff-file
  coordination and note it in the conflict register rather than blocking.

## Quick start

```bash
./scripts/rr-agents.sh              # attach or create (resume all)
./scripts/rr-agents.sh --fresh      # reset all five roles
./scripts/rr-session.sh status      # who's running, session counts
./scripts/rr-session.sh new ledger  # fresh session for one lane
./scripts/rr-session.sh stop dataset
```
