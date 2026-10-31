# Semi Design System — Maintainer Guide (`AGENTS.md`)

This repository (`hoanghuynh296/semi-nextjs-codebase`) is the **single source of truth** for the Semi Design System:
- `@semi/ui` npm package (`src/`, `styles/`, `tokens/`, `lint/`, `docs/`)
- `semi-design` agent plugin (`plugin/`, `.claude-plugin/`)

## Hard Rules for Maintaining This Repo

1. **Never edit `tokens/tokens.css` by hand:** Edit `tokens/tokens.json` and run `npm run build:tokens`.
2. **Keep docs, lint, and decision log in sync:** Any change to a UI rule must update `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md`, and (when checkable by regex) `lint/semi-lint.mjs` in the same commit.
3. **Keep components generic across Semi brands:** Do not add domain-specific logic (e.g. 3D printer MQTT/slicer APIs or local app stores) to `src/`. Components must only depend on React, Next.js (`next/link`), and `@semi/ui` internals.
4. **Always run `npm run check`** (`check:tokens` + `check:vendor` + `check:version` + `typecheck` + `semi-lint`) before committing or tagging a release. After editing `lint/semi-lint.mjs` or `tokens/tokens.json`, run `npm run sync:vendor` (the plugin ships its own copies).
5. **Versioning:** Run `npm run bump -- X.Y.Z` (updates `package.json`, `package-lock.json`, `plugin/plugin.json`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and re-stamps `tokens.css`), and document every release in `CHANGELOG.md`.
6. **Generated files:** `components.json` and the component inventory in `docs/QUICK_REF.md` come from `npm run build:manifest`; never edit them by hand. `lint/*.mjs` changes need fixtures in `lint/test` (`npm test`).
7. **Browser checks:** after UI changes run `npm run build:storybook && npm run test:ui` (contrast AA on every Storybook page in both themes, axe, theme before paint, keyboard flows). New components get a Storybook demo.
8. **Contrast:** Shared UI uses themed tokens (`text-accent-fg`, `text-*-fg`, `text-tone-*`, `bg-accent` + `text-on-accent`), never fixed `-300/-400` shades or `dark:` pairs; every text/background pair must reach 4.5:1 in both themes.
