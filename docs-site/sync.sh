#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"

title_for() {
  case "$1" in
    protocol) echo "Protocol specification";;
    research) echo "Product research";;
    roadmap-architecture) echo "Roadmap & architecture";;
    base-x402-monetization) echo "Base / x402 monetization";;
    x402-opt-in-spike) echo "x402 opt-in spike";;
    founding-receipt-nft) echo "Founding receipt NFT";;
    *) echo "$1";;
  esac
}

for f in ../docs/*.md; do
  name="$(basename "$f" .md)"
  [ "$name" = "index" ] && continue
  title="$(title_for "$name")"
  # Rewrite repo-relative links to absolute GitHub URLs so they resolve off the
  # docs build. Pattern: ](../path) -> ](https://github.com/kylebrodeur/rent-resilience/blob/main/path)
  python3 - "$f" "$name" "$title" <<'PY2'
import re, sys
src, name, title = sys.argv[1], sys.argv[2], sys.argv[3]
body = open(src).read()
body = re.sub(r"\]\(\.\./([^\)]+)\)", "](https://github.com/kylebrodeur/rent-resilience/blob/main/\1)", body)
out = open(f"content/docs/{name}.mdx", "w")
out.write(f"---\ntitle: {title}\n---\n\n" + body)
PY2
  echo "synced $name"
  echo "synced $name"
done
