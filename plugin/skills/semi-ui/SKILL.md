---
name: semi-ui
description: Build or change UI in an app that uses the Semi Design System (@semi/ui) - a page, a form, a table, a dashboard, an AI chat or agent view, its texts in the brand's voice, or the app's density and type scale. Finds the right Semi component or page block for each need (semi MCP tools or `npx semi search / docs / example / add`), starts from its example, composes it without local primitives, then checks with semi-lint. Use automatically for any UI work in a project with semi-lint.json or @semi/ui in package.json; the user does not need to type a command (/semi-ui also works).
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
`/semi-new-app`, existing app → `/semi-check`, older version → `/semi-sync`.

## Workflow

0. **Brand first:** when `semi-lint.json` has `"brand"`, ask `semi_brand` (or `npx semi brand voice|color|logo`)
   before writing UI text or choosing where colour goes, and write every label, error and empty state in that voice.
   Its brief says who the product is for: sample data, placeholders and empty states come from that product, never
   "Lorem", "John Doe", "Acme" or another domain.
1. **Split the request into needs** in plain words ("filter orders by status", "pick a date range", "agent asks before
   sending"). Search each one; Vietnamese or English both work. Read `why` lines: they come from another component's
   "use something else when" table and usually name the right pick.
2. **Read the page of every component you will use** (`semi_docs`), at least *When to use*, *Use something else when*
   and *Accessibility*. Pick by meaning, not by look: `Pills` filter, `Tabs` switch sections, `ToggleGroup` pick a
   mode; `Menu` for actions, `NavigationMenu` for site links, `Menubar` for tool commands.
3. **A whole page:** start from a block (`semi add dashboard` writes `app/dashboard/page.tsx`; `--out <path>` to
   choose, never `--force` over the user's file without asking). Replace the sample data with the app's data and
   types; keep the Semi components and their order.
   Then make it this product's screen, not the generic AI one (`DESIGN_SYSTEM.md` §19): decide the one block the
   user came for and make it the biggest (`KpiCard featured` for the main number, not four equal cards); keep KPI and
   card icons neutral (colour only for a status); no row of three icon feature cards with vague promises (use a real
   number, a quote, a product shot); icons only where they help scanning; plain sections and white space next to
   cards. Keep the density budgets (`DESIGN_SYSTEM.md` §4c): three frames deep at most, four text sizes and three
   colours per box, one filled button per view, rows a control tall, text 12px from a box's sides.
   Group the actions (`DESIGN_SYSTEM.md` §9, G1–G12; page recipe D2): the title or toolbar row holds search, at most
   one secondary button, a ⋯ `Menu` for the rest and one primary (a `SplitButton` when there are other ways to start
   the same job: "Thêm khách hàng" | ▾ Nhập từ file, Tìm trong Data Hub); rows get one inline action + a row ⋯, cards
   `CardActions`, bulk bars one primary + ⋯, danger last everywhere. A record of a list opens in a `DetailOverlay`
   (`useDetailParam`, `npx semi example detail-overlay`) with its actions in the side panel (D10: one primary + ⋯).
   Build every state of the screen, not only the filled one (`DESIGN_SYSTEM.md` §19b), from `EmptyState` (`first-use`,
   `no-results`), `ErrorState`, `NotFound`, `Forbidden` and `PageSkeleton shape` (`npx semi example states`; each route
   group gets `loading.tsx`, `error.tsx`, `not-found.tsx`): loading (a skeleton of the
   real shape), empty (the action that fills it) and "no result" for a search or filter, error (what failed, a
   retry, the loaded data kept), no permission, and too much data (long names, many rows). A destructive action is
   undoable (`toast.undo(title, restore)`, Hoàn tác) when reversible, or, when irreversible, confirmed with
   `confirmDelete({ name })` (names the object, red Xoá, Huỷ). Feedback is one toast API (`toast.success|error|warning|info`, `toast.promise`),
   shown once and never as a modal, no toast library or local wrapper: `npx semi example toast` (lint warns: `local-toast`).
   Forms are built from `FormActions` (Huỷ ghost then Lưu / Tạo, sticky on a page, `placement="modal"` in a Modal footer),
   `useUnsavedGuard(dirty)`, `Field kind="email|tel|number|money|url|search|password"` and `useFormValidation` +
   `FormErrorSummary` (error on blur then change, under the field, never a toast; `max-w-2xl`): `npx semi example form-actions`
   (lint warns: `form-no-guard`, `action-order`, `toast-for-validation`, `field-input-mode`).
   List pages: loading rows are skeletons, never a `Spinner` in the list; filter chips are one `FilterChipRow`; a record
   opens in a `DetailOverlay` driven by `useDetailParam`; round icon buttons are `<Button iconOnly shape="round">`;
   `text-overline` only on section labels (lint warns: `no-spinner-in-list`, `filter-chip-wrap`, `detail-overlay-url`,
   `raw-pill-button`, `overline-place`; `CardActions` without `label` fails: `card-hover-actions-touch`).
4. **A part:** copy the closest example and adapt it. Examples import from `@semi/ui` only and type-check, so keep
   their props and structure; change data, labels and handlers.
5. **Compose, do not invent.** No local wrappers (`components/ui.tsx`), no raw `<select>` / `<table>` / `<dialog>`,
   no colours, sizes or radii outside the tokens. A real gap goes to `/semi-propose`, with a minimal compliant
   workaround marked `// TODO(semi#<issue>)` meanwhile.
6. **AI and agents:** every AI conversation is `AIChat` (or the chat parts); agent work uses `Reasoning`,
   `TaskList`, `ToolCall`, `Terminal`, `FileTree`, `Sources` + `Citation` and `ContextMeter`. Any outward-facing,
   paid or irreversible agent action waits for `ActionConfirmation`. The *Agent workspace* block shows them together.
7. **Check:** `npx semi-lint` must be clean (the plugin hook also lints each edited file); `npx tsc --noEmit`; open
   the page in both themes and at phone width if the app runs, and measure it: `npx semi density <url>` and
   `npx semi a11y <url>` (Playwright from the app; `a11y` checks contrast, field edges, names, focus rings and target
   size in both themes), or evaluate the output of their `--snippet` on the page with a browser tool. Fix every hit
   before finishing. Report what you used and any gap you filed.

## The app's look: density and type scale

Since 1.0 Semi has one look for every brand (no Flat / Soft / Sharp styles; a leftover `data-style` does nothing). What
a product still chooses: density and type scale (the product's, not the brand's: one brand has a dense dashboard and a roomy store).
"Gọn hơn", "thoáng hơn", "chữ tiêu đề to hơn": `node "<path-to-this-skill>/../semi-new-app/scripts/look.mjs" --cwd "<dir>"` with `--density compact|regular|airy` and / or
`--type-scale even|contrast`; it sets `"density"` / `"typeScale"` in `semi-lint.json` and `data-density` /
`data-type-scale` on `<html>`. Never change paddings or text sizes by hand for this.
