---
name: semi-ui
description: Build or change UI in an app that uses the Semi Design System (@semi/ui) - a page, a form, a table, a dashboard, an AI chat or agent view. Finds the right Semi component or page block for each need (semi MCP tools or `npx semi search / docs / example / add`), starts from its example, composes it without local primitives, then checks with semi-lint. Use for any UI work in a project with semi-lint.json or @semi/ui in package.json. Triggered by /semi-ui.
---

# Build UI with Semi (`/semi-ui`)

The docs answer from the installed `@semi/ui`, so they match the version the app uses. Two equal ways in:

| Step | MCP tool (preferred) | Terminal |
|---|---|---|
| Which component fits a need | `semi_search { query }` | `npx semi search "<need in words>"` |
| Its page: when / instead / API / a11y | `semi_docs { name }` | `npx semi docs <id or Component>` |
| Code to start from | `semi_example { name, file? }` | `npx semi example <id> [file]` |
| Prop names of an export | `semi_props { name }` | `npx semi props <Component>` |
| Whole pages (dashboard, list, settings, agent) | `semi_block { id? }` | `npx semi blocks`, `npx semi add <id>` |

If neither works (`semi_status` answers, or `npx semi` is missing), the app has no `@semi/ui` 0.13+: new app →
`/semi-init`, existing app → `/semi-audit` + `/semi-fix`, older version → `/semi-update`.

## Workflow

1. **Split the request into needs** in plain words ("filter orders by status", "pick a date range", "agent asks before
   sending"). Search each one; Vietnamese or English both work. Read `why` lines: they come from another component's
   "use something else when" table and usually name the right pick.
2. **Read the page of every component you will use** (`semi_docs`), at least *When to use*, *Use something else when*
   and *Accessibility*. Pick by meaning, not by look: `Pills` filter, `Tabs` switch sections, `ToggleGroup` pick a
   mode; `Menu` for actions, `NavigationMenu` for site links, `Menubar` for tool commands.
3. **A whole page:** start from a block (`semi add dashboard` writes `app/dashboard/page.tsx`; `--out <path>` to
   choose, never `--force` over the user's file without asking). Replace the sample data with the app's data and
   types; keep the Semi components and their order.
4. **A part:** copy the closest example and adapt it. Examples import from `@semi/ui` only and type-check, so keep
   their props and structure; change data, labels and handlers.
5. **Compose, do not invent.** No local wrappers (`components/ui.tsx`), no raw `<select>` / `<table>` / `<dialog>`,
   no colours, sizes or radii outside the tokens. A real gap goes to `/semi-propose`, with a minimal compliant
   workaround marked `// TODO(semi#<issue>)` meanwhile.
6. **AI and agents:** every AI conversation is `AIChat` (or the chat parts); agent work uses `Reasoning`,
   `TaskList`, `ToolCall`, `Terminal`, `FileTree`, `Sources` + `Citation` and `ContextMeter`. Any outward-facing,
   paid or irreversible agent action waits for `ActionConfirmation`. The *Agent workspace* block shows them together.
7. **Check:** `npx semi-lint` must be clean (the plugin hook also lints each edited file); `npx tsc --noEmit`; open
   the page in both themes and at phone width if the app runs. Report what you used and any gap you filed.
