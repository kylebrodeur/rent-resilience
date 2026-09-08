#!/usr/bin/env zsh
set -euo pipefail

repo_root=${0:A:h:h}
cd "$repo_root"

session_name="rent-resilience-agents"
session_root="$repo_root/.omp/rr-agents"

usage() {
  print -u2 "usage: $0 [--fresh [role ...]]"
  print -u2 "  (default)  attach or create, resuming all role sessions"
  print -u2 "  --fresh    reset all five roles, then start clean"
  print -u2 "  --fresh ledger verifier  reset only named roles, resume the rest"
}

all_roles=(schemas dataset ledger verifier teacher advisor)

case "${1-}" in
  "")
    ;;
  --fresh)
    shift
    if (( $# == 0 )); then
      reset_roles=($all_roles)
    else
      reset_roles=("$@")
      for r in $reset_roles; do
        if (( ! ${all_roles[(Ie)$r]} )); then
          print -u2 "error: unknown role '$r'. Valid: $all_roles"
          exit 64
        fi
      done
    fi
    if zellij list-sessions --no-formatting 2>/dev/null | grep -Fq -- "$session_name ["; then
      zellij delete-session --force "$session_name"
    fi
    for role in $reset_roles; do
      rm -rf -- "$session_root/$role"
    done
    ;;
  --help|-h)
    usage
    exit 0
    ;;
  *)
    usage
    exit 64
    ;;
esac

# Attaching to an EXITED session resurrects it rather than re-running the
# KDL layout's launch command cleanly, which can leave panes suspended.
# Role history is untouched — it lives in .omp/rr-agents/<role>/*.jsonl and gets
# picked up by --continue regardless of which zellij session hosts the pane.
if zellij list-sessions --no-formatting 2>/dev/null | grep -F -- "$session_name [" | grep -q "EXITED"; then
  zellij delete-session --force "$session_name"
fi

exec zellij --layout .zellij/rr-agents.kdl attach --create "$session_name"