---
name: semi-update
description: Upgrade an existing project's @semi/ui package to the latest release tag from github:hoanghuynh296/semi-nextjs-codebase, inspect CHANGELOG and structural changes, and refactor any newly flagged semi-lint or structural gaps (such as adopting AppShell, SubpageToolbar, KpiCard, Modal, FIELD_INPUT). Triggered by /semi-update.
---

# Upgrade Semi Design System (`/semi-update`)

Use this skill when a project **already uses `@semi/ui`** (or has partially adopted it) and the user invokes `/semi-update` to pull the latest release tag of `@semi/ui` and align the codebase with new components/rules in that release.

## Step-by-Step Workflow

1. **Run the update script** on the workspace root (automatically updates all frontend apps in a monorepo that have `@semi/ui`, or the target directory):
   ```bash
   node "<path-to-this-skill>/scripts/update.mjs" --cwd "<workspace-or-app-dir>"
   ```
   - The script resolves the latest git tag from `https://github.com/hoanghuynh296/semi-nextjs-codebase`, updates `package.json`, installs the new `@semi/ui`, updates the version stamp in `AGENTS.md`, prints `CHANGELOG.md`, and runs `semi-lint` + `audit.mjs` structural checks.
2. **If new structural components or lint violations are reported** (for example, upgrading from `v0.1.0` to `v0.2.0` flags `legacy-shell-aside`, `legacy-ui-wrapper`, `input-bg-field`, or missing `AppShell` / `SubpageToolbar` / `KpiCard`):
   - Summarize what changed in the new `@semi/ui` version (`CHANGELOG.md`) and list the newly flagged structural gaps.
   - Ask the user (via `ask_question` if there are choices, or a brief confirmation) if they want to refactor the flagged files now (`AppShell`, removing `ui.tsx` wrappers, adding `SubpageToolbar` / `KpiCard` / `Modal` / `FIELD_INPUT`).
   - Refactor the files so `npx semi-lint`, `npx tsc --noEmit`, and `npm run build` pass with **0 hard violations**.
3. **New lint rules after an upgrade** (e.g. v0.5.0 adds `no-fixed-tone-text`, `arbitrary-text-size`, `literal-colour-value`,
   `hex-colour-class` on every colour prefix): preview fixes with `init.mjs --cwd <app> --dry-run`, apply the safe ones,
   resolve the reported tokens by hand, then shrink the baseline. Treat the result as a migration with the same
   Definition of Done as `/semi-init` Case B (0 findings per touched module, both themes checked).
4. **Report to the user:** State `old version → new version`, summarize the updated components/files, and confirm `semi-lint`, `tsc`, and `build` are green.
