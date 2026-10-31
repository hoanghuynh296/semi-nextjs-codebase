---
name: semi-audit
description: Check a project against the Semi Design System (@semi/ui) - the first step for an existing app (with or without @semi/ui) and the periodic check after. Scans every frontend app (foundation setup, lint rules, colour / size tokens, structure such as AppShell, local wrappers, tables), prints a short summary, and writes every issue with file:line, by phase, to semi-audit.md for /semi-fix. Changes no source file. Triggered by /semi-audit.
---

# Semi Design System Health Check (`/semi-audit`)

The Semi commands: new app → `/semi-init`. Existing app (first adoption or periodic check) → `/semi-audit`, then
`/semi-fix` when it finds issues. Newer `@semi/ui` → `/semi-update`.

`/semi-audit` changes **no source file** and installs nothing. Its only output file is `semi-audit.md` at the folder it
audits: every issue with `file:line` and what to do. `/semi-fix` works from it. When the audit finds nothing it deletes
an old `semi-audit.md`, so the file never describes problems that are already gone.

## Workflow

1. Run the audit on the workspace root (it finds every Next.js / React app, also in monorepos):
   ```bash
   node "<path-to-this-skill>/scripts/audit.mjs" --cwd "<workspace-or-app-dir>"
   ```
2. Show the summary it prints, as is (Vietnamese, short): a table per app with its phase, the issue count, the next
   command, then the issues grouped in a few lines at the bottom. Do not add sections or long lists: the details are in
   `semi-audit.md`. Link that file.
3. Next command, exactly as the summary says: issues found → **`/semi-fix`**; no app at all → **`/semi-init`**;
   nothing found → say so, no next command.

## Phases (in semi-audit.md, the order /semi-fix works in)

| Phase | Issues | /semi-fix does |
|---|---|---|
| 1. Nền móng (`F…`) | `@semi/ui` not installed, `transpilePackages`, Semi CSS, `semi-lint.json`, layout providers, Tailwind v3 | `fix.mjs foundation` (installs, keeps Next / Tailwind) + the layout by hand, screenshots before / after |
| 2. Token | colour / size classes the codemod maps safely | `fix.mjs tokens [--only dir]` |
| 3. Sửa tay (`L…`) | lint hits no codemod can fix safely | edits by hand |
| 4. Cấu trúc (`D…`) | AppShell / AppHeader frame, local wrappers, list pages without `SubpageToolbar`, tables, components that duplicate `@semi/ui`, other UI libraries | asks: fix, or keep (`semi-lint.json` `keep`) |

Checks the team chose to keep are listed in `semi-lint.json` (`"keep": { "tables": "reason" }`, or an array of path
prefixes) and only appear as one "Giữ nguyên" line.

Options: `--no-write` (summary only), `--ci` (summary only, exit 1 while issues are left: a periodic check in the
app's CI), `--json` (full machine-readable report), `--inventory <file>` (per-module token coverage).
