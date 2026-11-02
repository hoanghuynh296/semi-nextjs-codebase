---
name: semi-sync
description: Bring every app up to date with its brand kit and Semi - upgrade @semi/ui (and the brand kit, when the app has one) to the latest release tag from github:hoanghuynh296/semi-nextjs-codebase - install it, refresh the Semi rules block in AGENTS.md, show the CHANGELOG of the skipped releases, run those releases' migrations (code changes for their breaking changes), and check tsc. No audit, no refactor. Triggered by /semi-sync.
---

# Sync an app with its brand and Semi (`/semi-sync`)

One job: move apps that already use `@semi/ui` to the latest release, including the code changes that release ships
for its own breaking changes (release migrations, like Storybook `upgrade` or `ng update`). It does not audit or
refactor (that is `/semi-check`, which is also how an app without `@semi/ui` adopts it).

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
3. **Brand kit** (`"brand"` in `semi-lint.json`): it is updated first, to its newest tag. A major tag (brand colours /
   fonts changed) is skipped with a message: ask the user, and if they agree run again with `--accept-major`. The kit's
   `"semi"` range caps the `@semi/ui` version; when it holds the app back, the script says so: run `/semi-brand update`
   in the brand repo, release, then `/semi-sync` again.
4. The app keeps its style. If the script says the style is gone from the new release, switch it with `node "<path-to-this-skill>/../semi-new-app/scripts/style.mjs" --cwd <dir> --to <id>` after asking the user which style.
5. Report in a few lines: `old version → new version`, each migration that ran and the files it changed, and the
   CHANGELOG points that matter for this app. New lint rules of the release show up at the next `/semi-check`.
