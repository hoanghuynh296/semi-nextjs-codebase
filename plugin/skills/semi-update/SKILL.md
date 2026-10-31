---
name: semi-update
description: Upgrade every app that uses @semi/ui to the latest release tag from github:hoanghuynh296/semi-nextjs-codebase - install it, refresh the Semi rules block in AGENTS.md, show the CHANGELOG of the skipped releases, run those releases' migrations (code changes for their breaking changes), and check tsc. No audit, no refactor. Triggered by /semi-update.
---

# Upgrade Semi Design System (`/semi-update`)

One job: move apps that already use `@semi/ui` to the latest release, including the code changes that release ships
for its own breaking changes (release migrations, like Storybook `upgrade` or `ng update`). It does not audit or
refactor (that is `/semi-audit` + `/semi-fix`); an app without `@semi/ui` adopts it with `/semi-audit` + `/semi-fix`.

## Workflow

1. Run the update on the workspace root:
   ```bash
   node "<path-to-this-skill>/scripts/update.mjs" --cwd "<workspace-or-app-dir>"
   ```
   Per app it installs the latest tag, refreshes the managed Semi block in `AGENTS.md`, prints the CHANGELOG sections
   between the old and the new version, runs the migrations of those releases
   (`node_modules/@semi/ui/migrations/<version>-<id>.mjs`, in version order) and runs `tsc`.
2. Read the diff of the migrations. If `tsc` still fails, the CHANGELOG "Migration" notes say what the migrations
   could not do by themselves: fix those call sites. That is part of finishing the upgrade; nothing else is changed.
3. Report in a few lines: `old version → new version`, each migration that ran and the files it changed, and the
   CHANGELOG points that matter for this app. New lint rules of the release show up at the next `/semi-audit`.
