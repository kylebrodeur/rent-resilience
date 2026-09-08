#!/usr/bin/env zsh
set -euo pipefail
zmodload zsh/datetime

repo_root=${0:A:h:h}
cd "$repo_root"

if (( $# != 1 )); then
  print -u2 "usage: $0 {schemas|dataset|ledger|verifier|advisor}"
  exit 64
fi

role=$1
case "$role" in
  schemas)
    model="kimi-k2.7-code:cloud"
    working_dir="$repo_root/packages/protocol"
    first_turn_note="Read your scratchpad at $repo_root/docs/agent-team/handoffs/scratchpads/schemas.md for environment state, and .agents/skills/protocol-dev/SKILL.md plus docs/protocol.md before any schema work, then await Kyle's next request."
    ;;
  dataset)
    model="kimi-k2.7-code:cloud"
    working_dir="$repo_root/simulations/rent-history"
    first_turn_note="Read your scratchpad at $repo_root/docs/agent-team/handoffs/scratchpads/dataset.md for environment state, and .agents/skills/protocol-dev/SKILL.md plus docs/protocol.md before writing the generator, then await Kyle's next request."
    ;;
  ledger)
    model="kimi-k2.7-code:cloud"
    working_dir="$repo_root/services/api"
    first_turn_note="Read your scratchpad at $repo_root/docs/agent-team/handoffs/scratchpads/ledger.md for environment state, and .agents/skills/protocol-dev/SKILL.md plus docs/protocol.md before any code, then await Kyle's next request."
    ;;
  verifier)
    model="gemma4:31b-cloud"
    working_dir="$repo_root"
    first_turn_note="Read your scratchpad at $repo_root/docs/agent-team/handoffs/scratchpads/verifier.md and .agents/skills/protocol-dev/SKILL.md for the invariant checklist, then await a lane handoff to verify."
    ;;
  advisor)
    model="glm-5.2:cloud"
    working_dir="$repo_root"
    first_turn_note="Read docs/agent-team/ for the team structure, workflow, and documentation flow, and .omp/RULES.md. The four lanes (schemas, dataset, ledger, verifier) have persistent scratchpads at docs/agent-team/handoffs/scratchpads/. Await Kyle's question."
    ;;
  *)
    print -u2 "unknown rent-resilience agent role: $role"
    exit 64
    ;;
esac

# Advisor starts immediately so it wins the Pi Link hub race (binds port 9900).
# Other roles poll until the hub port is accepting connections (or 5s timeout).
if [[ "$role" != "advisor" && -z "${RR_SKIP_HUB_WAIT:-}" ]]; then
  for i in {1..50}; do
    nc -z 127.0.0.1 9900 2>/dev/null && break
    sleep 0.1
  done
fi

session_dir="$repo_root/.omp/rr-agents/$role"
mkdir -p "$session_dir"

# Single source of truth for this role's operating contract: .omp/agents/rr-$role.md
# (--system-prompt reads raw file bytes verbatim, so the YAML frontmatter block is
# stripped before injection here.)
agent_file="$repo_root/.omp/agents/rr-$role.md"
prompt_file="$session_dir/system-prompt.md"
awk '
  NR==1 && $0=="---" { infm=1; next }
  infm && $0=="---" { infm=0; next }
  infm { next }
  { print }
' "$agent_file" > "$prompt_file"
{
  print ""
  print "## First turn"
  print ""
  print "On your very first turn in a brand-new session (no prior conversation yet), $first_turn_note Once a real conversation is underway, this note no longer applies — just respond normally."
} >> "$prompt_file"

omp_args=(
  --session-dir "$session_dir"
  --link-name "$role"
  --model "$model"
  --cwd "$working_dir"
  --system-prompt "@$prompt_file"
)
# Per-role config overlays: disable subsystems each role doesn't need.
# Session-scoped via --config — global config.yml is untouched.
if [[ "$role" == "advisor" ]]; then
  omp_args+=(--config "$repo_root/.omp/advisor-session.yml")
else
  omp_args+=(--config "$repo_root/.omp/light-session.yml")
fi

# Disable LSP for roles that don't edit code (advisor reads docs, verifier runs tests).
if [[ "$role" == "advisor" || "$role" == "verifier" ]]; then
  omp_args+=(--no-lsp)
fi

# ── Loop: restart omp after exit unless told to stop ──
# omp runs SYNCHRONOUSLY in the foreground — backgrounding omp inside a Zellij PTY
# pane corrupts terminal-capability query/reply routing (learned in enviro-grow-pico,
# see its Worklog). rr-session.sh signals this process externally via
# `pgrep -f -- "--session-dir <dir>"` since there is no backgrounded PID to record.
# No positional message is ever passed to omp — the "first turn" note lives in the
# generated system prompt, avoiding the split-word delivery race.
flag_fresh=0
crash_count=0
crash_window_start=$EPOCHSECONDS
while true; do
  session_files=("$session_dir"/*.jsonl(N))

  run_start=$EPOCHSECONDS
  if (( ! flag_fresh )) && (( ${#session_files} > 0 )); then
    omp "${omp_args[@]}" --continue || true
  else
    flag_fresh=0
    omp "${omp_args[@]}" || true
  fi

  # ── Check for control flags left by rr-session.sh, after omp exits ──

  # .stop — don't restart, let the pane die
  if [[ -f "$session_dir/.stop" ]]; then
    rm -f "$session_dir/.stop"
    break
  fi

  # .reset — start a fresh session on next loop iteration (old sessions stay on
  # disk, reachable via omp -r picker or omp --resume <path>)
  if [[ -f "$session_dir/.reset" ]]; then
    rm -f "$session_dir/.reset"
    flag_fresh=1
    continue
  fi

  # Crash guard: 5 exits within 3s of launch inside a 60s window stops the loop
  # instead of spinning/spraying terminal output indefinitely.
  run_elapsed=$(( EPOCHSECONDS - run_start ))
  if (( run_elapsed < 3 )); then
    if (( EPOCHSECONDS - crash_window_start > 60 )); then
      crash_count=0
      crash_window_start=$EPOCHSECONDS
    fi
    (( crash_count++ ))
    if (( crash_count >= 5 )); then
      print -u2 "rr-agent-terminal.sh [$role]: omp exited within 3s of launch $crash_count times in the last 60s — stopping restart loop. Check .omp/rr-agents/$role/ and the config overlay for errors."
      break
    fi
  else
    crash_count=0
    crash_window_start=$EPOCHSECONDS
  fi

  # No flag — omp exited on its own. Restart with --continue to resume the
  # most recent session.
done