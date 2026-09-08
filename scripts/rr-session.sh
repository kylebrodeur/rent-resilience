#!/usr/bin/env zsh
set -euo pipefail

repo_root=${0:A:h:h}
cd "$repo_root"

session_root="$repo_root/.omp/rr-agents"

usage() {
  print -u2 "usage: $0 <command> [role]"
  print -u2 ""
  print -u2 "commands:"
  print -u2 "  new <role>     Start a fresh session (old session preserved on disk, resumable via omp -r)."
  print -u2 "  stop <role>    Stop one terminal — no restart."
  print -u2 "  new-all        Reset the four build lanes (keeps teacher and advisor)."
  print -u2 "  status         Show all session states."
  print -u2 ""
  print -u2 "roles: schemas, dataset, ledger, verifier, teacher, advisor"
  print -u2 ""
  print -u2 "For fork/branch/restore, use OMP's built-in commands from inside the session:"
  print -u2 "  /fork   — clone session to a new file (original untouched)"
  print -u2 "  /branch — start a new thread from an earlier message in the same file"
  print -u2 "  /tree   — navigate session history, label checkpoints"
  print -u2 "  omp -r  — resume any saved session from the picker"
}

send_exit() {
  local role=$1
  local session_dir="$session_root/$role"
  local pid=$(pgrep -f -- "--session-dir $session_dir " | head -1) || true
  if [[ -n "$pid" ]]; then
    kill "$pid" 2>/dev/null || true
    echo "Sent exit signal to $role (PID $pid)."
  else
    echo "Warning: no running omp process found for $role — terminal may not be running."
  fi
}

case "${1:-}" in
  new)
    (( $# >= 2 )) || { usage; exit 64 }
    role=$2
    session_dir="$session_root/$role"
    mkdir -p "$session_dir"
    touch "$session_dir/.reset"
    send_exit "$role"
    echo "Resetting $role — old session preserved, will start fresh on restart."
    ;;

  stop)
    (( $# >= 2 )) || { usage; exit 64 }
    role=$2
    session_dir="$session_root/$role"
    touch "$session_dir/.stop"
    send_exit "$role"
    echo "Stopping $role — pane will not restart."
    ;;

  new-all)
    for role in schemas dataset ledger verifier; do
      session_dir="$session_root/$role"
      mkdir -p "$session_dir"
      touch "$session_dir/.reset"
      send_exit "$role"
    done
    echo "Reset all four lanes. Advisor unchanged."
    ;;

  status)
    for role in schemas dataset ledger verifier teacher advisor; do
      session_dir="$session_root/$role"
      pid=$(pgrep -f -- "--session-dir $session_dir " | head -1) || true
      session_files=("$session_dir"/*.jsonl(N))
      session_count=${#session_files}
      if [[ -n "$pid" ]]; then
        state="running (PID $pid)"
      else
        state="stopped"
      fi
      printf "%-10s %-20s sessions on disk: %s\n" "$role" "$state" "$session_count"
    done
    ;;

  --help|-h|"")
    usage
    ;;

  *)
    usage
    exit 64
    ;;
esac