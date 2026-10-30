---
name: semi-init
description: Initialize or adopt the Semi Design System (@semi/ui) in a web project with zero manual terminal steps for the user. Automatically detects whether the workspace is a brand-new project (scaffolds Next.js + Tailwind 4 + @semi/ui + starter layout) or an existing codebase (runs /semi-audit, asks user decision questions, gets approval, then installs and refactors in phases). Triggered by /semi-init.
---

# Initialize Semi Design System (`/semi-init`)

Use this skill when the user invokes `/semi-init` or asks to set up the Semi Design System in a project.
The user should **never** have to run manual `npm install` or config commands — you run the scripts and only ask the user when refactoring decisions are needed.

## Workflow

### Step 1: Detect project mode (New vs Existing) & Ask Version Preference
Check whether the target directory (or `./web`) already has a `package.json`:

- **Case A — Brand-new / empty directory:**
  1. Ask the user (via `ask_question`) for:
     - **Next.js & Tailwind CSS version:**
       - `(Recommended) Latest (next@latest + tailwindcss@latest)` (default)
       - Or a specific version string chosen by the user.
     - **App title & export mode:** (e.g. standard Next.js server vs static export `output: "export"`).
  2. Run `init.mjs`:
     ```bash
     node "<path-to-this-skill>/scripts/init.mjs" --cwd "<target-dir>" --app-name "<App Title>" --next-version "<latest|ver>" --tailwind-version "<latest|ver>" [--static-export]
     ```
     (Defaults for `--next-version` and `--tailwind-version` are `latest`. Supports `SEMI_UI_SOURCE=file:/path/to/semi-nextjs-codebase` when testing against a local checkout before pushing tags.)
  3. The script scaffolds Next.js + Tailwind (`create-next-app@<next-version>`), ensures `next` and `tailwindcss` match the requested versions (default `latest`), installs `@semi/ui`, configures `transpilePackages`, wires `@semi/ui/tokens.css` + `@semi/ui/base.css` + `@source` into `app/globals.css`, sets up Geist + Montserrat Alternates fonts and `<ConfirmHost />` in `app/layout.tsx`, creates a starter page using `AppHeader`, `CARD`, `BTN_PRIMARY`, `Pills`, `Chip`, `IconTile`, creates `semi-lint.json` and `AGENTS.md`, and verifies `semi-lint` + `tsc` + `npm run build`.

- **Case B — Existing codebase (`package.json` exists):**
  1. Run `init.mjs --cwd "<target-dir>"` (without `--apply`), or directly run `semi-audit/scripts/audit.mjs --cwd "<target-dir>"`.
  2. Present the audit report summary and ask the user the multiple-choice questions listed in **Questions Requiring User Decision** (use `ask_question` tool). This always includes asking which version of Next.js and Tailwind CSS to install (defaulting to `(Recommended) Latest (next@latest + tailwindcss@latest)`).
  3. Present the 4-phase refactor plan (see `semi-audit` skill) and wait for user approval.
  4. Once approved, execute **Phase 1** by running:
     ```bash
     node "<path-to-this-skill>/scripts/init.mjs" --cwd "<target-dir>" --apply --write-baseline --next-version "<latest|keep|ver>" --tailwind-version "<latest|keep|ver>"
     ```
  5. Then execute **Phases 2–4** according to the user's selected scope, keeping `npx semi-lint`, `npx tsc --noEmit`, and `npm run build` green at the end of every phase.

### Private Repository Authentication
`@semi/ui` is hosted in the private repository `https://github.com/hoanghuynh296/semi-nextjs-codebase`.
If `init.mjs` exits with code `2` (git access denied), tell the user the single command to authenticate (`gh auth login && gh auth setup-git` or adding an SSH key) and stop until they confirm.
