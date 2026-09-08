# Pi Link tool invocation (read this before using `link_send`/`link_list`/`link_prompt`/`link_compact`)

**Root cause, so this doesn't get re-discovered the hard way:** the `pi-link` plugin (`pi-link@0.2.0`, installed at `~/.omp/plugins/node_modules/pi-link`) registers its four tools without an explicit `loadMode`. Under OMP, any registered tool without `loadMode: "essential"` defaults to `"discoverable"` — it is **not** exposed to the model as an ordinary top-level callable function. Instead it is only reachable through OMP's generic `xd://<tool>` device-dispatch convention. This plugin was built for a different, related harness ("Pi") where `registerTool` calls are apparently top-level by default; OMP's stricter default is what makes this project's four dashboard-team terminals unable to call `link_send` etc. directly.

A parallel fix is tracked (fork with `loadMode: "essential"` added, relinked locally, issue/PR filed upstream against `alvivar/pi-link`). Until that fix is confirmed live in **this terminal's own running process** (it only takes effect on the next fresh `omp` start after the plugin is relinked — an already-running process keeps whatever it loaded at its own startup), use the `xd://` invocation below. It always works regardless of the fix's status.

## Do NOT do these things (all observed failing in practice)

- **Do NOT use `hub send`/`hub` operations to reach another dashboard-team terminal.** `hub` is a *different*, OMP-native tool scoped to your own process's own subagent tree (`task`-spawned children only). It cannot see `advisor`, `ui-lab`, `live-ui`, or `artifact-qa` — they are separate top-level OMP processes, not your subagents. `hub send to:"advisor"` will fail with `Unknown agent "advisor"` every time; that is expected, not a bug to retry around.
- **Do NOT try invoking `link_send`/`link_list`/`link_prompt`/`link_compact` as shell commands** (e.g. `link_send to:advisor "..."` in `bash`). None of these are CLI binaries. The `pi-link` npm package does ship a `bin/pi-link.mjs`, but it is an unrelated *session launcher* (`pi-link <name>` to resume/create a linked session) — running it will not send a message.

## How to actually call them

Write the tool's JSON args as `content` to `xd://<tool>` via the `write` tool. This is the same generic mechanism used for every other `xd://` device tool in OMP (`checkpoint`, `lsp`, MCP tools, etc.) — nothing pi-link-specific, just undocumented in this project's custom system prompts until now.

### `link_send` — fire-and-forget message, or trigger async work

```ts
type Args = {
  to: string;            // target terminal name, or "*" for broadcast
  message: string;
  triggerTurn?: boolean; // default false; true queues the message as work for the receiver's next turn
};
```

Write to `xd://link_send`, e.g. content:
```json
{"to": "advisor", "message": "LAB_REVIEW ready: feature X, commit abc123, handoff docs/iot-rig/handoffs/x-lab-review.md", "triggerTurn": true}
```

### `link_list` — see who's actually connected

```ts
type Args = {};
```

Write `{}` to `xd://link_list`. Use this before trusting any claim (yours or another terminal's) about who is reachable — do not assume connectivity.

### `link_prompt` — synchronous request/response

```ts
type Args = {
  to: string;
  prompt: string;
};
```

Write to `xd://link_prompt`. Blocks until the target responds (90s inactivity timeout, 30min hard ceiling). Use only when you need an answer back now; otherwise use `link_send`.

### `link_compact` — ask a terminal to compact its context

```ts
type Args = {
  to: string;
  instructions?: string;
};
```

Write to `xd://link_compact`.

## Verifying you actually reached someone

A `write` to `xd://link_send` succeeding does not by itself prove the message was seen — check `xd://link_list` first to confirm the target is connected, and for anything requiring a reply or confirmation, use `xd://link_prompt` instead of `link_send` + hoping.
