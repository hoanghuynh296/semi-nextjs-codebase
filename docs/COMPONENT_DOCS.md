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
- `preview: "none"` marks an example that fills the viewport (AppShell, a root layout, a route file). The Semi docs
  preview it live in a 560px lazy iframe of `/demo/example/<id>/<file>/` (`app/demo/example/`: the example alone,
  without the docs shell; layout examples get a sample page as `children`, route files a sample `error` / `reset`, an
  example that renders its own `<html>` shows its body, `fetch("/api/…")` answers a sample after 800ms, links stay on
  the page, the theme follows the docs page), with "Mở toàn màn hình" and the Preview / Code switch. The route is
  generated from every meta's `preview: "none"`, so a new one needs nothing else. `ComponentPage` `framesBase` turns
  this on; without it (brand previews) such an example is shown as code only.
- An example preview never changes the docs page's route header: `ExampleBlock` gives it a no-op record-crumb store,
  so `ListReaderLayout recordTitle` / `useRecordCrumb` in an example add no crumb (an example with its own AppShell
  keeps that shell's store).
- The docs nav rail (72px, e.g. at 1024px) shows each component item with its group's icon and a tooltip; the expanded
  nav hides those item icons (CSS on the nav container in `DocsShell`) and the phone drawer leaves them out.
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

### Component inspector (docs site only, #194)

On the Semi docs site, a piece of an example preview (`[data-example-preview]`, set by `site/ExampleBlock.tsx`), a floating layer an example opened (`[data-semi-floating]` whose trigger, found by `aria-controls` / `aria-describedby` / `aria-owns`, sits in a preview; without a linked trigger, when the last press, key or focus was in a preview) and anything on a `/demo/*` page can be inspected. The docs site's own menus and tooltips (header theme menu, nav tooltips) never are. It reads the `data-semi` names every component puts on its root (DESIGN_SYSTEM.md §17b). Code: `app/inspector/` (`Inspector.tsx`, `InspectorToggle.tsx`, `store.ts`, `names.ts`), mounted by `app/SiteShell.tsx` outside `<main>`; it is not part of `@semi/ui` or `@semi/ui/site`, so apps and brand previews never get it.

- **Pointer:** resting 300ms on a piece outlines the innermost marked element and shows a card under it (at most 48px below the pointer for a tall element; above it when there is no room): the name, the first sentence of its `components.json` summary, and the chain of marked ancestors (`ButtonGroup › Button`). Every name links to `/components/<id>/` (the `doc` of its `components.json` entry; a part such as `ToastHost.Toast` links to its parent's page); ⌘ / Ctrl-click opens a new tab.
- **The card never catches a press meant for the page:** it is `pointer-events: none` until the pointer has rested on it for 250ms (`data-armed`, then its links take clicks). A press anywhere else, including on a control under a card that is not armed yet, reaches the page and hides the card. The outline is always `pointer-events: none`. Typing, scrolling, leaving the window and a page change hide the card too. Touch input is ignored.
- **Keyboard:** with focus inside an example, `Alt`+`↓` shows the focused element's innermost marked piece, `Alt`+`↑` / `Alt`+`↓` walk up and down the chain, `Enter` opens the shown page (it does not press the focused control while the card shows; a piece without a page leaves `Enter` to the control), `Escape` closes. A widget's own `Alt`+`↓` (one that calls `preventDefault`, such as a combobox) wins.
- **Screen readers:** the card is decorative (`aria-hidden`, links out of the tab order); a visually hidden `role="status"` region says what the keyboard card shows (name, description, chain, keys) and when the I key turns the inspector on or off.
- **On / off:** the "Soi component" switch in the header (from `md`) and the `I` key turn it off and on; on by default, remembered in `localStorage["semi-docs-inspector"]`, read after mount. `I` is left to the page when focus or the key's target is in a field or contenteditable, a `menu` / `listbox` / `tree` / `grid` (type-ahead), an example preview or a floating layer, with a modifier, during IME composition, or when a widget already handled it.
- **Tests:** `tests/inspector.spec.ts`. Other browser tests that hover an example can see the card appear after 300ms: it is `aria-hidden` (no extra `tooltip` / `link` role for `getByRole`) and lets their clicks through.
