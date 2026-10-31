---
name: semi-fix
description: Fix what /semi-audit found in an existing app, phase by phase - foundation (install and wire @semi/ui, keeping Next / Tailwind), token codemod, hand fixes, structure decisions - working from semi-audit.md and verifying until the audit is clean, then deleting semi-audit.md. Also how an existing app adopts Semi for the first time. Triggered by /semi-fix.
---

# Fix Semi audit issues (`/semi-fix`)

Run after `/semi-audit` reported issues: the first adoption of Semi in an existing app, or after a periodic check.
The work list is `semi-audit.md` at the audited folder: every issue with `file:line`, grouped in four phases. Work the
phases in order; each one leaves the app building, so you can stop (or open a PR) after any of them.

## Workflow

1. **Plan.** Refresh the report (it audits again when `semi-audit.md` is missing or older than the code):
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>"
   ```
   Read `semi-audit.md`. Tell the user in two lines which phase each app is in and what you will do.
2. **Ask the structure decisions now** (phase 4, ids `D…`), so the answers are known before you start
   (`AskUserQuestion`, up to 4 per call): "fix as proposed (Recommended)" or "keep". For "keep", add the check to
   `semi-lint.json`: `"keep": { "<check>": "<the user's reason>" }` (or an array of path prefixes). Never keep
   something the user did not choose to keep.
3. **Phase 1 — Foundation** (`F…`). It changes how the app looks, so first take screenshots of 3–5 key pages in the
   app's current theme (dev server + browser, when available). Then:
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" foundation
   ```
   It installs `@semi/ui` (Next.js and Tailwind stay as they are), adds `transpilePackages`, the Semi CSS block,
   `semi-lint.json` + a baseline of today's lint debt, and the Semi block in `AGENTS.md`. Then do the `tay` items:
   - **providers:** edit the root layout exactly as the script prints (`ThemeScript` / `ThemeProvider` with the
     `defaultTheme` it detected, so a light app stays light; `ToastHost`, `ConfirmHost`); keep everything else.
   - **tailwind-v4:** run `npx @tailwindcss/upgrade` in the app (the official tool), check the pages, run foundation again.

   Take the same screenshots again and compare. Expected: fonts, greys, radius and borders move slightly towards Semi.
   Not acceptable: a light app turning dark, unreadable text, broken layout. Fix those before going on.
4. **Phase 2 — Tokens** (codemod), one module at a time for a big app:
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" tokens --only "<app>/<module-dir>"
   ```
   Read the diff: it only rewrites class strings to tokens.
5. **Phase 3 — Hand fixes** (`L…`), file by file, using the rule texts in the `Luật` section and
   `node_modules/@semi/ui/docs/QUICK_REF.md`. Pick an `@semi/ui` component or a semantic token; never re-add a physical
   colour, a local wrapper, a `skip` for a whole folder or a higher baseline.
6. **Phase 4 — Structure**, per the decisions: `AppShell` + `MobileTabBar` (or `AppHeader` for a tool app),
   `PageTitle` + `SubpageToolbar`, `Table` / Bento `Card` grids, `KpiCard`, `Modal`, `Field` + `Input`, …
   (`node_modules/@semi/ui/components.json` lists every export with props). A need `@semi/ui` cannot express →
   `/semi-propose` and a `// TODO(semi#<issue>)` workaround, not a new primitive.
7. **Verify** after each phase (and each module):
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" --verify
   ```
   It audits again, rewrites `semi-audit.md` with what is left (deletes it when nothing is), and runs the app's own
   `semi-lint` and `tsc`; exit 1 while anything is left. Then run the build, and `npx semi-lint --update-baseline` so
   the baseline shrinks (never let it grow). Check changed screens in both themes when a browser is available.
8. **Report** in a few lines: issues before → after per phase, what was kept (and why), what is left, and whether
   `semi-audit.md` was deleted. Do not commit unless the user asks.

## Why the file is deleted when clean

`semi-audit.md` always mirrors the latest audit: `--verify` rewrites it with the remaining issues and deletes it when
there are none, so an old file never sends the next run after problems that are already fixed.
