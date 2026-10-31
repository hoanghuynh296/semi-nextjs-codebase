# Semi Design System — Maintainer Guide (`AGENTS.md`)

This repository (`hoanghuynh296/semi-nextjs-codebase`) is the **single source of truth** for the Semi Design System:
- `@semi/ui` npm package (`src/`, `styles/`, `tokens/`, `lint/`, `docs/`)
- `semi-design` agent plugin (`plugin/`, `.claude-plugin/`)

## Hard Rules for Maintaining This Repo

1. **Never edit `tokens/tokens.css` by hand:** Edit `tokens/tokens.json` and run `npm run build:tokens`.
2. **Docs and code change in the same commit:** see *Change checklist* below. A change is not done while a doc, a usage snippet or a Storybook demo still describes the old code.
3. **Keep components generic across Semi brands:** Do not add domain-specific logic (e.g. 3D printer MQTT/slicer APIs or local app stores) to `src/`. Components must only depend on React, Next.js (`next/link`), and `@semi/ui` internals.
4. **Always run `npm run check`** (`check:tokens` + `check:vendor` + `check:version` + `check:manifest` + `typecheck` + `semi-lint` + unit tests) before committing or tagging a release. After editing `lint/semi-lint.mjs` or `tokens/tokens.json`, run `npm run sync:vendor` (the plugin ships its own copies).
5. **Versioning:** Run `npm run bump -- X.Y.Z` (updates `package.json`, `package-lock.json`, `plugin/plugin.json`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and re-stamps `tokens.css`), and document every release in `CHANGELOG.md`.
6. **Generated files:** `components.json`, the component inventory in `docs/QUICK_REF.md`, `public/llms.txt`, `public/llms-full.txt`, `public/components.json` and `public/docs/*` come from `npm run build:manifest`; never edit them by hand. `lint/*.mjs` changes need fixtures in `lint/test` (`npm test`).
7. **Browser checks:** after UI changes run `npm run build:storybook && npm run test:ui` (contrast AA on every Storybook page in both themes, axe, theme before paint, keyboard flows). New components get a Storybook demo.
8. **Contrast:** Shared UI uses themed tokens (`text-accent-fg`, `text-*-fg`, `text-tone-*`, `bg-accent` + `text-on-accent`), never fixed `-300/-400` shades or `dark:` pairs; every text/background pair must reach 4.5:1 in both themes.

## Change checklist (docs ↔ code)

| You changed | Also update, in the same commit |
|---|---|
| A component's props or behaviour | Its section in `docs/DESIGN_SYSTEM.md`, its usage code in `app/usage.ts`, its Storybook demo, `CHANGELOG.md` |
| Added / removed / renamed an export | The above, plus the `src/index.ts` export and the §16 / §17 tables of `DESIGN_SYSTEM.md` |
| A UI rule | `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` (why), `plugin/rules/AGENTS.md` when consumer agents must follow it, `lint/semi-lint.mjs` when a regex can check it |
| A Storybook section | Its `app/usage.ts` entry (same id, `title`, `when`, `code`), and `<StoryUsage id>` / `ShowcaseSection id` on the page |
| Tokens or lint | `npm run build:tokens` / `npm run sync:vendor` |

Then run `npm run build:manifest` (regenerates the agent files) and `npm run check`. `check:manifest` fails when:
- a generated file is stale;
- a usage snippet imports a name `@semi/ui` does not export;
- a Storybook section has no usage entry, or a usage entry has no section;
- a component or hook is not named in `docs/DESIGN_SYSTEM.md`.

It cannot check that prose still matches behaviour: when you change behaviour, reread the doc section yourself.

