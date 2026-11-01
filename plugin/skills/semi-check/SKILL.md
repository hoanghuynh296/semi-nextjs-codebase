---
name: semi-check
description: Check an existing app against its brand and the Semi Design System (@semi/ui), then fix it after the user agrees - the first adoption of Semi in an app (with or without @semi/ui) and the periodic check after. Audits every frontend app (foundation, brand kit, style, lint rules, colour / size tokens, structure), writes every issue with file:line by phase to semi-check.md, shows a short summary, asks, then fixes phase by phase (foundation, token codemod, hand fixes, structure) and verifies until clean. Triggered by /semi-check (formerly /semi-audit and /semi-fix).
---

# Check and fix an app (`/semi-check`)

The Semi commands, one per place:

| Where you are | Command |
|---|---|
| Brand repo (`brand.json`): create or change the brand | **`/semi-brand`** |
| Empty folder: a new product | **`/semi-new-app`** (with `--brand <kit>` for a product of a brand) |
| Existing app: check it against the brand and Semi, then fix | **`/semi-check`** |
| Existing app: the brand kit or Semi has a new release | **`/semi-sync`** |

Building screens needs no command (the `semi-ui` skill runs on its own); a style switch is asked in words.

The check part changes **no source file**. Its only output is `semi-check.md` at the folder it checks: every issue with
`file:line` and what to do. Nothing is fixed until the user says so. When nothing is left, `semi-check.md` is deleted.

## Workflow

1. **Check** the workspace root (it finds every Next.js / React app, also in monorepos):
   ```bash
   node "<path-to-this-skill>/scripts/audit.mjs" --cwd "<workspace-or-app-dir>"
   ```
   No app at all → stop and point to `/semi-new-app`. Nothing found → say so and stop.
2. **Show** the summary it prints, as is (Vietnamese, short): a table per app with its phase and issue count, then the
   issues grouped in a few lines. Link `semi-check.md` for the details; do not add long lists.
3. **Ask** (`AskUserQuestion`) whether to fix now: "Sửa hết theo thứ tự (Recommended)", "Chỉ phase 1–2 (nền móng,
   token)", "Chưa sửa". A periodic check in CI uses `--ci` and stops here.
4. **Ask the decisions now**, so the answers are known before you start (`AskUserQuestion`, up to 4 per call):
   - **Style**, when phase 1 has a `style` item: one option per style (`fix.mjs foundation` without `--style` lists
     them with descriptions). `(Recommended)` on the default, Flat: it is the closest to an existing app's look.
   - **Structure** (phase 4, ids `D…`): "fix as proposed (Recommended)" or "keep". For "keep", add the check to
     `semi-lint.json`: `"keep": { "<check>": "<the user's reason>" }` (or an array of path prefixes). Never keep
     something the user did not choose to keep.
5. **Phase 1 — Foundation** (`F…`). It changes how the app looks, so first take screenshots of 3–5 key pages in the
   app's current theme (dev server + browser, when available). Then:
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" foundation --style "<id>" [--brand "<github:owner/repo>"]
   ```
   With a brand (`--brand` to adopt one, or `"brand"` already in `semi-lint.json`) it installs and wires the kit, uses
   the brand's default style unless you pass an allowed one, colours and fonts are the brand's.
   It installs `@semi/ui` (Next.js and Tailwind stay as they are), adds `transpilePackages`, the Semi CSS block,
   `semi-lint.json` + a baseline of today's lint debt, the chosen style (`"style"` in `semi-lint.json`,
   `data-style` on `<html>`), and the Semi block in `AGENTS.md`. It prints the `next/font` lines for the style's fonts:
   add them to the layout with the providers. Then do the `tay` items:
   - **providers:** edit the root layout exactly as the script prints (`ThemeScript` / `ThemeProvider` with the
     `defaultTheme` it detected, so a light app stays light; `ToastHost`, `ConfirmHost`); keep everything else.
   - **tailwind-v4:** run `npx @tailwindcss/upgrade` in the app (the official tool), check the pages, run foundation again.

   Take the same screenshots again and compare. Expected: fonts, greys, radius and borders move slightly towards Semi.
   Not acceptable: a light app turning dark, unreadable text, broken layout. Fix those before going on.
6. **Phase 2 — Tokens** (codemod), one module at a time for a big app:
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" tokens --only "<app>/<module-dir>"
   ```
   Read the diff: it only rewrites class strings to tokens (colours, sizes, `rounded-*` → `rounded-chip|control|card|panel`,
   `shadow-sm` → `shadow-card`), so the page then follows the app's style.
7. **Phase 3 — Hand fixes** (`L…`), file by file, using the rule texts in the `Luật` section and
   `node_modules/@semi/ui/docs/QUICK_REF.md`. Pick an `@semi/ui` component or a semantic token; never re-add a physical
   colour, a local wrapper, a `skip` for a whole folder or a higher baseline.
8. **Phase 4 — Structure**, per the decisions: `AppShell` + `MobileTabBar` (or `AppHeader` for a tool app),
   `PageTitle` + `SubpageToolbar`, `Table` / Bento `Card` grids, `KpiCard`, `Modal`, `Field` + `Input`, …
   (`node_modules/@semi/ui/components.json` lists every export with props). A need `@semi/ui` cannot express →
   `/semi-propose` and a `// TODO(semi#<issue>)` workaround, not a new primitive.
9. **Verify** after each phase (and each module):
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" --verify
   ```
   It audits again, rewrites `semi-check.md` with what is left (deletes it when nothing is), and runs the app's own
   `semi-lint` and `tsc`; exit 1 while anything is left. Then run the build, and `npx semi-lint --update-baseline` so
   the baseline shrinks (never let it grow). Check changed screens in both themes when a browser is available.
10. **Report** in a few lines: issues before → after per phase, what was kept (and why), what is left, and whether
   `semi-check.md` was deleted. Do not commit unless the user asks.


## Phases (in semi-check.md, fixed in this order)

| Phase | Issues | How it is fixed |
|---|---|---|
| 1. Nền móng (`F…`) | `@semi/ui` not installed, `transpilePackages`, Semi CSS, `semi-lint.json`, layout providers, brand kit not installed / not wired (`brand`), no style chosen (or one the brand does not allow, or `<html data-style>` not matching it, or its fonts not loaded), Tailwind v3 | `fix.mjs foundation --style <id>` (installs, keeps Next / Tailwind) + the layout by hand, screenshots before / after |
| 2. Token | colour / size / radius classes the codemod maps safely (`rounded-lg` → `rounded-control`, `shadow-sm` → `shadow-card`) | `fix.mjs tokens [--only dir]` |
| 3. Sửa tay (`L…`) | lint hits no codemod can fix safely | edits by hand |
| 4. Cấu trúc (`D…`) | AppShell / AppHeader frame, local wrappers, list pages without `SubpageToolbar`, tables, components that duplicate `@semi/ui`, other UI libraries | asks: fix, or keep (`semi-lint.json` `keep`) |

Checks the team chose to keep are listed in `semi-lint.json` (`"keep": { "tables": "reason" }`, or an array of path
prefixes) and only appear as one "Giữ nguyên" line.

Options: `--no-write` (summary only), `--ci` (summary only, exit 1 while issues are left: a periodic check in the
app's CI), `--json` (full machine-readable report), `--inventory <file>` (per-module token coverage).

## Why the file is deleted when clean

`semi-check.md` always mirrors the latest audit: `--verify` rewrites it with the remaining issues and deletes it when
there are none, so an old file never sends the next run after problems that are already fixed.
