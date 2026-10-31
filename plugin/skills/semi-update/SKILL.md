---
name: semi-update
description: Upgrade a project's @semi/ui to the latest release tag from github:hoanghuynh296/semi-nextjs-codebase and refresh the Semi rules block in AGENTS.md. Does only the version upgrade: no audit, no refactor. Triggered by /semi-update.
---

# Upgrade Semi Design System (`/semi-update`)

One job: move an app that already has `@semi/ui` to the latest release. It does not audit or refactor (that is
`/semi-audit` + `/semi-fix`); for an app without `@semi/ui`, use `/semi-init`.

## Workflow

1. Run the update script on the workspace root (every app that has `@semi/ui`):
   ```bash
   node "<path-to-this-skill>/scripts/update.mjs" --cwd "<workspace-or-app-dir>"
   ```
   It installs the latest tag, refreshes the managed Semi block in `AGENTS.md`, prints the `CHANGELOG.md` and runs
   `tsc` to confirm the upgrade compiles.
2. If `tsc` fails, the release changed an API the app uses: fix those call sites, using the CHANGELOG ("Changed" /
   "Migration" notes). That is part of finishing the upgrade; nothing else is changed.
3. Report in a few lines: `old version → new version` and the CHANGELOG points that matter for this app. A release
   may add lint rules; they show up the next time the user runs `/semi-audit`.
