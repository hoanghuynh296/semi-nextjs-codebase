# Agent tools (`semi` CLI, MCP server, blocks)

Semi is built for agents first: an agent should never guess a component from memory or grep the package. It asks
the docs, which ship inside `@semi/ui` and so always match the installed version.

## The questions an agent asks

| Question | MCP tool | CLI (`npx semi …`, add `--json` for structured output) |
|---|---|---|
| Which component fits this need? | `semi_search { query, limit? }` | `semi search "<need in words>"` |
| How do I use it (when, instead, import, API, a11y)? | `semi_docs { name }` | `semi docs <doc id or Component>` |
| What code do I start from? | `semi_example { name, file? }` | `semi example <id> [file]` |
| What props does an export take? | `semi_props { name }` | `semi props <Component>` |
| What exists, by group? | `semi_list { group? }` | `semi list [--group AI]` |
| A whole page? | `semi_block { id? }` | `semi blocks`, `semi add <id> [--out path] [--force]` |

**Search** takes plain words in Vietnamese or English ("bảng có sắp xếp và chọn dòng", "agent asks before sending
email"). Vietnamese UI terms map to the English docs (bảng → table, sắp xếp → sort, biểu đồ → chart …), filler words
are dropped, rare words weigh more (IDF), names weigh more than descriptions. A hit on another doc's *Use something
else when* row points to the component that row names, with the row as `why` — that is how "pick a date range"
lands on `Calendar` even though `DatePicker` mentions dates more.

## MCP server

`semi mcp` (also `node node_modules/@semi/ui/cli/mcp.mjs`) speaks MCP over stdio (newline-delimited JSON-RPC, no
SDK). The `semi-design` plugin registers it as `semi` (`plugin/.mcp.json` → `plugin/mcp/launch.mjs`): the launcher
finds the project's `node_modules/@semi/ui` (the folder, its parents, `apps/*`, `packages/*`); without it the server
offers one tool, `semi_status`, that says how to add Semi.

## Blocks

Page-level compositions in the docs group **Blocks** (`examples/<id>/`, one `page.tsx`-shaped example each):
`dashboard` (KPIs, charts, latest orders), `list-page` (toolbar, data table, bulk actions), `settings-page` (form,
switch rows, danger zone), `agent-run` (an agent turn with every AI part). `semi add <id>` writes the block to
`app/<id>/page.tsx` (`src/app` when it exists) and refuses to overwrite without `--force`. They are page bodies: the
app's layout gives the `AppShell`.

## For maintainers

- The CLI and the server read `examples/list.generated.json`, `examples/<id>/meta.json`, `docs/components/<id>.md`
  and `components.json` through `cli/core.mjs`; `npm run build:manifest` keeps them fresh. A new doc needs nothing
  else to be searchable — but its `when` and `instead` are what search ranks on, so write them well.
- A block is a doc with `"group": "Blocks"`, `"components": []` and one `"preview": "frame"` example.
- Search vocabulary (Vietnamese → English terms, stop words) lives in `cli/core.mjs`; `lint/test/cli.test.mjs` pins
  the queries agents rely on.
