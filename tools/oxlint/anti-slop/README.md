# anti-slop (vendored Oxlint plugin) — canonical copy

This is the **canonical** copy of the [`anti-slop`](https://github.com/dmmulroy/anti-slop)
Oxlint plugin for the UofD ecosystem. Every UofD repo vendors these files into its
own `tools/oxlint/anti-slop/` (see `setup/install-oxlint.sh` and
`docs/HANDOFF-anti-slop-oxlint.md`).

anti-slop is designed to be **vendored, not consumed as an npm dependency** — the
files are ours to read and adapt to UofD standards.

## Provenance

| | |
|---|---|
| Upstream | https://github.com/dmmulroy/anti-slop |
| Source path | `src/` (generic rules only) |
| Pinned commit | `6d538555cb151d4121ed51a27db81890eacf8ae9` (2026-08-18, `main`) |
| Vendored on | 2026-08-26 |
| Oxlint baseline | `oxlint@1.80.0`, `@oxlint/plugins@1.80.0` |

## What is included / omitted

- **Included:** all 15 generic rules (`src/rules/**`) + shared helpers (`src/shared/**`)
  and the plugin entry (`src/index.ts`).
- **Omitted:** the opt-in **Effect** rule group (`src/effect/**`). No UofD repo
  depends on `effect` today. If one adopts Effect, re-vendor `src/effect/` into
  `effect/` here and register `anti-slop-effect` in that repo's config (the
  upstream README documents the block).
- **Not included:** upstream tests, skill assets, tsconfig, CI — we only vendor the
  runtime plugin.

## UofD-owned rules (`uofd/`)

The `uofd/` subdirectory is a **separate plugin group** (`anti-slop-uofd`) holding
rules UofD adds on top of the upstream set — kept apart so re-vendoring upstream
never touches them (mirrors upstream's own `anti-slop-effect` split). It is NOT
from upstream; never overwrite or re-fetch it when updating.

- `no-oversized-comments` — flags comment blocks over `maxLines` (default 4).
  Exempt: `/** */` JSDoc (documentation), a `WHY:`/`SAFETY:` marker (the
  sanctioned escape hatch for genuinely hard logic), license/banner, and tooling
  directives. Encodes: narrate the hard *why*, not the obvious *what*.

## Updating from upstream

1. Re-fetch the generic tree from a newer upstream commit:
   `src/index.ts`, `src/rules/*.ts` (skip `*.test.ts`), `src/shared/*.ts`.
2. Bump the **Pinned commit** and **Vendored on** rows above.
3. Bump the Oxlint baseline in `setup/install-oxlint.sh` and the handoff doc if the
   upstream `package.json` pins newer `oxlint` / `@oxlint/plugins`.
4. `pnpm lint` here (dogfood) and re-run each consumer's lint.

If you intentionally diverge from upstream (a UofD-specific tweak to a rule),
record it here so a future re-vendor does not silently revert it.
