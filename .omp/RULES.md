# OMP Rules — rent-resilience agent team

## Skills

- Read `.agents/skills/protocol-dev/SKILL.md` before ANY protocol, schema, event-store,
  signing, or reliability work. It encodes the seven protocol invariants and the
  validation checklist. Source of truth for the spec: `docs/protocol.md` (read fully
  at session start).
- Load `skill://context-management` for checkpoint/compact discipline on long sessions.

## The team

Durable state lives in the repo, not in Pi Link messages:
- `docs/agent-team/Team-State.md` — active lanes, ownership, handoff status (advisor is the single writer)
- `docs/agent-team/handoffs/` — commit-pinned handoff documents
- `docs/agent-team/Worklog.md` — session log (append, never rewrite)
- Scratchpads per role: `docs/agent-team/handoffs/scratchpads/<role>.md`

Private project context (dashboard, costs, applications) lives in `../rent-resilience-dev/`
— read-only for all lanes. Never copy private material into this public repo.

## Protocol invariants (short form — full list in .agents/skills/protocol-dev/SKILL.md)

- Append-only events; corrections are new CorrectionIssued events. Never UPDATE/DELETE.
- Integer money in minor units. No floats in resolution math.
- No PII in protocol objects. Opaque ids only (`pty_`, `prp_`, `pol_`, `prv_`, `pd_`).
- Signatures and hashes over JCS (RFC 8785) canonical bytes (`canonicalize` npm), never
  `JSON.stringify`.
- Deterministic policy: same input + same policy version → same decision. Agents never
  approve; policy_decision_id required.
- Assisted months end the independent streak, never the satisfied record.

## Secrets & privacy

- Use the `op` CLI: `op read 'op://<vault>/<item>/<field>'`. Never echo secret values,
  vault paths, or `op read` output into any file, log, or worklog.
- Wrangler/Cloudflare auth is kyle@brodeur.me; **deploys happen only on Kyle's explicit
  word** — an agent never runs `npx wrangler deploy` unprompted.
- KV export data (emails) is fully private. Never echo emails, KV keys, or PostHog
  distinct_ids into any file, handoff, or worklog.
- Commits: no AI attribution lines, ever.
- GitHub: use `gh` CLI (authenticated). No tokens in the repo.

## Session management

- OMP sessions are append-only trees: `/fork`, `/branch`, `/tree`, `omp -r`. Nothing destroyed.
- `./scripts/rr-agents.sh` — attach or create the five-pane team (advisor first, wins the
  Pi Link hub on port 9900).
- `./scripts/rr-agents.sh --fresh [role ...]` — hard reset named roles (or all).
- `./scripts/rr-session.sh new <role>` — fresh session, old history preserved on disk.
- `./scripts/rr-session.sh stop <role>` — stop one pane.
- `./scripts/rr-session.sh status` — show all role sessions.

## Handoff discipline (learned in btc-market-learning-lab — keep it)

- Handoffs are commit-pinned: name the exact commit SHA you built on. "Latest" is not a pin.
- The advisor is the SINGLE writer of Team-State.md, the decision register, and the
  conflict register. Specialists write only their scratchpad and their handoffs.
- Shared registers are never edited concurrently. Report through your handoff; the
  advisor records.
- A `link_send` succeeding does not prove the message was seen. Check `link_list`
  first; use `link_prompt` when you need an answer.