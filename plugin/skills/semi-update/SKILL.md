---
name: semi-update
description: Upgrade a project's @semi/ui to the latest release tag from github:hoanghuynh296/semi-nextjs-codebase, refresh the Semi rules block in AGENTS.md, check the build still compiles, and audit what the new release flags (semi-audit.md). Only for moving to a new version; fixing issues is /semi-fix. Triggered by /semi-update.
---

# Upgrade Semi Design System (`/semi-update`)

Use only when the user wants a newer `@semi/ui` release. Fixing what the audit reports is `/semi-fix`, not this skill.
For an app without `@semi/ui`, use `/semi-init`.

## Workflow

1. Run the update script on the workspace root (every app that has `@semi/ui`):
   ```bash
   node "<path-to-this-skill>/scripts/update.mjs" --cwd "<workspace-or-app-dir>"
   ```
   It installs the latest tag, refreshes the managed Semi block in `AGENTS.md`, prints the `CHANGELOG.md`, runs `tsc`,
   then audits and writes `semi-audit.md` (new lint rules of the release show up there).
2. If `tsc` fails, the release changed an API the app uses: fix those call sites now, using the CHANGELOG
   ("Changed" / "Migration" notes). That is part of the upgrade.
3. Report in a few lines: `old version → new version`, the CHANGELOG points that matter for this app, and the audit
   summary the script printed. If it found issues, the next command is **`/semi-fix`**.
