---
name: semi-audit
description: Health check of a project against the Semi Design System (@semi/ui), for periodic checks. Scans every frontend app in the workspace (lint rules, colour / size tokens, structure such as AppShell, SubpageToolbar, local wrappers, tables), prints a short summary, and writes every issue with file:line to semi-audit.md for /semi-fix. Changes no source file. Triggered by /semi-audit.
---

# Semi Design System Health Check (`/semi-audit`)

The Semi flow: `/semi-init` once → `/semi-audit` to check (any time, e.g. before a release) → `/semi-fix` when it finds
issues → `/semi-update` only to move to a newer `@semi/ui` release.

`/semi-audit` changes **no source file** and installs nothing. Its only output file is `semi-audit.md` at the folder it
audits: every issue with `file:line` and what to do. `/semi-fix` works from it. When the audit finds nothing it deletes
an old `semi-audit.md`, so the file never describes problems that are already gone.

## Workflow

1. Run the audit on the workspace root (it finds every Next.js / React app, also in monorepos):
   ```bash
   node "<path-to-this-skill>/scripts/audit.mjs" --cwd "<workspace-or-app-dir>"
   ```
2. Show the summary it prints, as is (Vietnamese, short): a table per app, the issue count, the next command, then the
   issues grouped in a few lines at the bottom. Do not add sections, tables of hex colours or long lists: the details
   are in `semi-audit.md`. Link that file.
3. Next command, exactly as the summary says:
   - issues found → **`/semi-fix`**
   - an app without `@semi/ui` (or no app at all) → **`/semi-init`**
   - nothing found → say so; no next command.

## Issue kinds (in semi-audit.md)

| Kind | Meaning | /semi-fix does |
|---|---|---|
| Cần quyết định (`D…`) | Structure: AppShell, local wrappers, tables, duplicate components, other UI libraries, Tailwind v3 | asks the user: fix, or keep (recorded in `semi-lint.json` `keep`) |
| Sửa tay (`L…`) | A lint rule hit no codemod can fix safely | edits by hand, file by file |
| Tự sửa | Colour / size classes the token codemod maps safely | runs the codemod |

Checks the team chose to keep are listed in `semi-lint.json` (`"keep": { "tables": "reason" }`, or an array of path
prefixes) and only appear as one "Giữ nguyên" line.

Options: `--no-write` (summary only), `--json` (full machine-readable report), `--inventory <file>` (per-module
coverage, used by `/semi-init` planning).
