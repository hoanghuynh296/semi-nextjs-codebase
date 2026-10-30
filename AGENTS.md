# Semi Design System — Maintainer Guide (`AGENTS.md`)

This repository (`hoanghuynh296/semi-nextjs-codebase`) is the **single source of truth** for the Semi Design System:
- `@semi/ui` npm package (`src/`, `styles/`, `tokens/`, `lint/`, `docs/`)
- `semi-design` agent plugin (`plugin/`, `.claude-plugin/`)

## Hard Rules for Maintaining This Repo

1. **Never edit `tokens/tokens.css` by hand:** Edit `tokens/tokens.json` and run `npm run build:tokens`.
2. **Keep docs, lint, and decision log in sync:** Any change to a UI rule must update `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md`, and (when checkable by regex) `lint/semi-lint.mjs` in the same commit.
3. **Keep components generic across Semi brands:** Do not add domain-specific logic (e.g. 3D printer MQTT/slicer APIs or local app stores) to `src/`. Components must only depend on React, Next.js (`next/link`), and `@semi/ui` internals.
4. **Always run `npm run check`** (`check:tokens` + `typecheck` + `semi-lint`) before committing or tagging a release.
5. **Versioning:** Bump `version` in `package.json`, `plugin/plugin.json`, `plugin/.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` together, and document every release in `CHANGELOG.md`.
