# Semi Design System — Maintainer Guide (`AGENTS.md`)

This repository (`hoanghuynh296/semi-nextjs-codebase`) is the **single source of truth** for the Semi Design System:
- `@semi/ui` npm package (`src/`, `styles/`, `tokens/`, `lint/`, `docs/`)
- `semi-design` agent plugin (`plugin/`, `.claude-plugin/`)

## Hard Rules for Maintaining This Repo

1. **Never edit `tokens/tokens.css` or `tokens/styles.json` by hand:** Edit `tokens/tokens.json` / `tokens/styles/<id>.json` and run `npm run build:tokens`.
2. **Docs and code change in the same commit:** see *Change checklist* below. A change is not done while a doc, an example or its meta still describes the old code.
3. **Keep components generic across Semi brands:** Do not add domain-specific logic (e.g. 3D printer MQTT/slicer APIs or local app stores) to `src/`. Components must only depend on React, Next.js (`next/link`), and `@semi/ui` internals.
4. **Always run `npm run check`** (`check:tokens` + `check:vendor` + `check:version` + `check:manifest` + `typecheck` + `semi-lint` + unit tests) before committing or tagging a release. After editing `lint/semi-lint.mjs` or `tokens/tokens.json`, run `npm run sync:vendor` (the plugin ships its own copies).
5. **Versioning:** Run `npm run bump -- X.Y.Z` (updates `package.json`, `package-lock.json`, `plugin/plugin.json`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and re-stamps `tokens.css`), and document every release in `CHANGELOG.md`.
6. **Generated files:** `components.json`, the component inventory in `docs/QUICK_REF.md`, `public/llms.txt`, `public/llms-full.txt`, `public/components.json` and `public/docs/*` come from `npm run build:manifest`; never edit them by hand. `lint/*.mjs` changes need fixtures in `lint/test` (`npm test`).
7. **Browser checks:** after UI changes run `npm run build:storybook && npm run test:ui` (the docs site: contrast AA on every page and every component doc in both themes, axe, phone width, theme before paint, keyboard flows). New components get a doc in `examples/` (`docs/COMPONENT_DOCS.md`).
8. **Radii and card shadow are style tokens** (`rounded-chip|control|card|panel`, `shadow-card`, `docs/STYLES.md`): never `rounded-lg/xl/2xl` or `rounded-[Npx]` in `src/` or `styles/` (`radius-token`).
9. **Contrast:** Shared UI uses themed tokens (`text-accent-fg`, `text-*-fg`, `text-tone-*`, `bg-accent` + `text-on-accent`), never fixed `-300/-400` shades or `dark:` pairs; every text/background pair must reach 4.5:1 in both themes.

## Change checklist (docs ↔ code)

| You changed | Also update, in the same commit |
|---|---|
| A component's props or behaviour | TSDoc on the props (it becomes the API table), its examples / `meta.json` in `examples/<id>/`, its section in `docs/DESIGN_SYSTEM.md`, `CHANGELOG.md` |
| Added / removed / renamed an export | The above, plus the `src/index.ts` export, the doc that lists it (`"components"` of a `meta.json`; a new component gets its own `examples/<id>/`) and the §16 / §17 tables of `DESIGN_SYSTEM.md` |
| A UI rule | `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` (why), `plugin/rules/AGENTS.md` when consumer agents must follow it, `lint/semi-lint.mjs` when a regex can check it |
| A component doc | `examples/<id>/meta.json` (`when` and `instead` first: they are how agents pick) and its example files, `docs/COMPONENT_DOCS.md` if the format changes |
| A breaking change (renamed / removed component, prop, constant, token) | A release migration `migrations/<version>-<id>.mjs` (`migrations/README.md`) + its test in `lint/test/migrations.test.mjs`, and a CHANGELOG "Migration" note for what it cannot do |
| Tokens or lint | `npm run build:tokens` / `npm run sync:vendor` |
| The brand generator / kit format / kit preview site (`brand/`, `brand/preview`) | `lint/test/brand.test.mjs`, `docs/BRANDS.md` (the user guide: keep its steps true), the Brand preview page if inputs change, a real `semi-brand site` run on a sample kit when the preview template changes, `CHANGELOG.md` (kit format changes need `/semi-brand update` notes) |
| A style (new, or a value of one) | `tokens/styles/<id>.json` → `npm run build:tokens` + `npm run sync:vendor`, its column in `docs/STYLES.md`, Storybook check in both themes, `CHANGELOG.md` (renamed / removed style: a release migration) |

Then run `npm run build:manifest` (regenerates the agent files) and `npm run check`. `check:manifest` fails when:
- a generated file is stale;
- an example imports a name `@semi/ui` does not export, imports a relative path, or has no default export;
- a component has no doc, or a `meta.json` names a component that does not exist;
- a component or hook is not named in `docs/DESIGN_SYSTEM.md`;
- a style in `tokens/styles.json` has no column in `docs/STYLES.md`.

It cannot check that prose still matches behaviour: when you change behaviour, reread the doc section yourself.

