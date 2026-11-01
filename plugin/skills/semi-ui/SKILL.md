---
name: semi-ui
description: Build or change UI in an app that uses the Semi Design System (@semi/ui) - a page, a form, a table, a dashboard, an AI chat or agent view, its texts in the brand's voice, or the app's style (Flat, Soft, Sharp). Finds the right Semi component or page block for each need (semi MCP tools or `npx semi search / docs / example / add`), starts from its example, composes it without local primitives, then checks with semi-lint. Use automatically for any UI work in a project with semi-lint.json or @semi/ui in package.json; the user does not need to type a command (/semi-ui also works).
---

# Build UI with Semi

This skill runs on its own whenever you build or change UI in a Semi app; users are not told to type `/semi-ui`.

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

0. **Brand first:** when `semi-lint.json` has `"brand"`, ask `semi_brand` (or `npx semi brand voice|color|logo`)
   before writing UI text or choosing where colour goes, and write every label, error and empty state in that voice.
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

## Change the app's style (Flat, Soft, Sharp)

When the user asks for another style ("đổi sang Soft"). A style changes neutral colours, fonts, radii, card border /
shadow and control sizes for the whole app; components, layout, the accent and status colours stay. With a brand kit
only the brand's allowed styles can be picked; another one is added in the brand repo with `/semi-brand`.

1. Show the current style and the choices: `node "<path-to-this-skill>/../semi-init/scripts/style.mjs" --cwd "<dir>"`.
   Ask only when the user did not name one.
2. Screenshots of 3–5 key pages in both themes, when the app runs.
3. Switch: the same command with `--to "<id>" [--only "<app-dir>"]`. It sets `"style"` in `semi-lint.json` and
   `data-style` on `<html>`, and prints `next/font` lines when the layout lacks the style's fonts: add them.
4. Screenshots after. A place that did not change uses raw classes (`bg-white`, `rounded-lg`, `h-[34px]`): a lint hit,
   fixed by `/semi-audit` + `/semi-fix`. Report old → new style per app and the files changed.
