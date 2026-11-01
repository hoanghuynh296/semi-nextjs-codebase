# Component docs (agent first)

Every Semi component is documented the same way, for people and agents at once, from one source that cannot drift.

## For agents: how to use them

1. Find the component: `semi_search` (MCP) or `npx semi search "<need>"` ranks docs for a need in words
   (`docs/AGENT_TOOLS.md`); or browse `node_modules/@semi/ui/docs/components/README.md` (by group, with "when to use").
   Whole pages start from a **Blocks** doc (`npx semi add <block>`).
2. Read its page `node_modules/@semi/ui/docs/components/<id>.md`: what it is, when to use it and **what to use
   instead**, the import line, examples, the API table (types, defaults, required props), accessibility.
3. Copy the closest example: every example is a real file (`node_modules/@semi/ui/examples/<id>/<example>.tsx`) that
   type-checks against the release you have, with imports from `@semi/ui` only.
4. Check with `npx semi-lint`.

The same pages are on the docs site (`/components/<id>/`, with live previews and a "Copy page" button that copies the
markdown) and in `llms.txt` / `llms-full.txt`. `components.json` links each component to its page (`doc`).

## For maintainers: how they are built

```
examples/<id>/meta.json        hand-written: title, group, description, components, when, instead, a11y, notes,
                               imports (extra names for the import line), examples [{ file, title, description, preview }]
examples/<id>/<file>.tsx       one example per file: `export default function Name()`, imports from "@semi/ui" only
        │  npm run build:manifest (scripts/build-docs.mjs)
        ▼
examples/registry.generated.ts what the docs site renders (site/): meta + example code + the component itself + API
docs/components/<id>.md        the agent page (also public/docs/components/<id>.md)
docs/components/README.md      the index
```

- **API tables come from the TypeScript types** of `src/` (props this library declares, their types, defaults from
  the destructuring, TSDoc comments, required flags across union props). Write TSDoc on props: it is the description.
- `check:manifest` fails when a generated file is stale, an example imports something `@semi/ui` does not export or a
  relative path, an example has no default export, a meta names a component that does not exist, or **a component
  has no doc**. `npm run typecheck` type-checks every example.
- `preview: "none"` shows an example as code only (it fills the viewport: AppShell, a root layout).
- Groups: Actions, Forms, Overlays, Navigation & layout, Data display, Feedback, AI, Setup.
- `site/` (`@semi/ui/site`) is the docs UI: `DocsShell` (AppShell with the component menu), `ComponentPage`,
  `ComponentIndex`, `ExampleBlock`, `CodeBlock`. The Semi docs (`app/`) and every brand kit's preview site
  (`brand/preview`) render it, so a brand sees every component in its colours.

### Adding a component

1. The component in `src/` with typed props and TSDoc, exported from `src/index.ts`.
2. `examples/<id>/meta.json` + at least one example (usually 2–4: the default, variants, states, a real composition).
   `when` and `instead` matter most: they are how an agent picks the right component.
3. Mention it in `docs/DESIGN_SYSTEM.md` (§16 / §17), `CHANGELOG.md`.
4. `npm run build:manifest && npm run check`, then `npm run build:storybook && npm run test:ui` (every doc page is
   checked for contrast in both themes, axe and phone width).
