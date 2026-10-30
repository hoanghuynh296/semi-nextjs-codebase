---
name: semi-update
description: Upgrade @semi/ui to the latest version tag from github:hoanghuynh296/semi-nextjs-codebase, inspect CHANGELOG and DECISIONS between versions, run semi-lint + tsc + build, and fix any breaking changes. Triggered by /semi-update or when the user asks to update the design system.
---

# Upgrade Semi Design System (`/semi-update`)

Use this skill when the user invokes `/semi-update` or asks to update `@semi/ui` to the newest release.

## Step-by-Step Instructions

1. **Run the update script** from this skill folder against the project directory (or `web/` subfolder if the frontend lives in `web/`):
   ```bash
   node "<path-to-this-skill>/scripts/update.mjs" --cwd "<project-or-web-dir>"
   ```
   - Supports `SEMI_UI_SOURCE` env var (e.g., `file:/path/to/semi-nextjs-codebase`) for local testing before tags are pushed.
   - The script checks git access to `https://github.com/hoanghuynh296/semi-nextjs-codebase`, resolves the latest semver tag, updates `package.json`, installs `@semi/ui`, updates the recorded version in `AGENTS.md`, and prints the diff in `CHANGELOG.md` and `docs/DECISIONS.md` plus `semi-lint` results.
2. **If authentication fails:** Tell the user the exact single command shown by the script (`gh auth login` or SSH key setup) and stop.
3. **Review breaking changes & lint output:**
   - Read the printed `CHANGELOG.md` / `DECISIONS.md` entries for the new version.
   - If `npx semi-lint`, `npx tsc --noEmit`, or `npm run build` reports violations caused by new rules or renamed props, fix them automatically.
4. **Report to the user:** State the old version → new version, summarize new rules/components, and confirm `semi-lint`, `tsc`, and `build` are green.
