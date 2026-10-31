---
name: semi-fix
description: Fix the issues /semi-audit found in a project that already uses the Semi Design System (@semi/ui). Works from semi-audit.md (refreshing it when the code changed), asks the structural decisions, runs the token codemod, fixes the remaining lint hits by hand, and verifies until the audit is clean, then deletes semi-audit.md. Triggered by /semi-fix.
---

# Fix Semi audit issues (`/semi-fix`)

Run after `/semi-audit` reported issues. The source of the work is `semi-audit.md` at the audited folder: every issue
with `file:line`. If `@semi/ui` is not installed in an app, stop and suggest `/semi-init` for it.

## Workflow

1. **Plan.** Refresh the report (the script audits again when `semi-audit.md` is missing or older than the code):
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>"
   ```
   Read `semi-audit.md`. Tell the user in two lines what you will fix (counts per kind, biggest files).
2. **Decisions first** (`Cần quyết định`, ids `D…`). Ask them together (`AskUserQuestion`, up to 4 per call): for each
   check, "fix as proposed (Recommended)" or "keep". For "keep", add the check to `semi-lint.json`:
   `"keep": { "<check>": "<the user's reason>" }` (or an array of path prefixes when only some files stay). Never keep
   something the user did not choose to keep.
3. **Codemod** (`Tự sửa`):
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" --codemod
   ```
   Read the diff: the codemod only rewrites class strings to tokens; check that nothing else changed.
4. **By hand** (`Sửa tay`, then the decisions to fix), one module at a time, using the rule text in the `Luật`
   section of the file and `node_modules/@semi/ui/docs/QUICK_REF.md`:
   - pick an `@semi/ui` component or a semantic token; never re-add a physical colour, a local wrapper, a `skip` for a
     whole folder or a higher baseline;
   - structure: `AppShell` + `MobileTabBar`, `PageTitle` + `SubpageToolbar`, `Table` / Bento `Card` grids, `KpiCard`,
     `Modal`, `Field` + `Input`, … (`node_modules/@semi/ui/components.json` lists every export with props);
   - a need `@semi/ui` cannot express → `/semi-propose`, with a `// TODO(semi#<issue>)` workaround, not a new primitive.
5. **Verify** after each module and at the end:
   ```bash
   node "<path-to-this-skill>/scripts/fix.mjs" --cwd "<audited-dir>" --verify
   ```
   It audits again, rewrites `semi-audit.md` with what is left (or deletes it when nothing is), and runs `semi-lint`
   and `tsc` in each app; exit 1 while anything is left. Then run the app's build. If the app has
   `semi-lint-baseline.json`, run `npx semi-lint --update-baseline` so the baseline shrinks (never let it grow). Check
   the changed screens in both themes (`data-theme="light"` / `"dark"`) when a browser is available.
6. **Report** in a few lines: issues before → after, what was kept (and why), what is left and why, and whether
   `semi-audit.md` was deleted. Do not commit unless the user asks.

## Why the file is deleted when clean

`semi-audit.md` always mirrors the latest audit: `/semi-fix --verify` rewrites it with the remaining issues, and deletes it
when there are none, so an old file never sends the next run after problems that are already fixed. To keep a record,
the git history and the `/semi-fix` report are enough.
