# Semi styles

A **style** is the shape of the whole UI: the radii and the resting card shadow. An app picks one style, once; every
`@semi/ui` component and class constant follows it. Everything else is shared by all styles: components and their API,
colours and both themes (light / dark), type scale, spacing, layout (AppShell, PageTitle, SubpageToolbar …), icons,
accessibility and lint rules.

| | Flat (default) | Soft |
|---|---|---|
| For | Dense, information-first screens: dashboards, tools, admin | Calmer, friendlier screens: consumer apps, storefronts, onboarding |
| `rounded-chip` | 4px | 6px |
| `rounded-control` | 8px | 12px |
| `rounded-card` | 12px | 20px |
| `rounded-panel` | 16px | 24px |
| `shadow-card` | none (the border separates cards) | soft neutral shadow, tinted for the theme |

Source: `tokens/styles/<id>.json` → `npm run build:tokens` → `[data-style="<id>"]` blocks in `tokens.css` and the list
in `tokens/styles.json` (`@semi/ui/styles.json`). Preview: the Flat / Soft switch at the bottom of the Storybook sidebar.

## Picking a style in an app

```tsx
// app/layout.tsx: data-style on <html>; leave it off for the default (Flat)
<html lang="vi" data-style="soft" suppressHydrationWarning>
```

and the same id in `semi-lint.json` (`"style": "soft"`), which `/semi-audit` checks against the layout. `/semi-init`
asks for the style of a new app, `/semi-fix` foundation for an existing one, `/semi-style` switches it later. A wrapper
with `data-style` re-styles only its subtree (used by Storybook previews), not something an app needs.

## Rules

- Use the style tokens only: `rounded-chip` (marks, checkboxes, inline code) · `rounded-control` (buttons, inputs,
  selects, tiles, list rows) · `rounded-card` (cards, popovers, menus, toasts) · `rounded-panel` (hero, modal, drawer,
  sheet, sidebar) · `rounded-full` / `rounded-none` (the same in every style) · `shadow-card` (resting cards, in `CARD`).
  `semi-lint` (`radius-token`) flags `rounded`, `rounded-sm/md/lg/xl/2xl` and `rounded-[Npx]`; the `/semi-fix` token
  codemod maps them (`lg` → `control`, `xl` → `card`, `2xl` → `panel`, `sm` / `md` / bare → `chip`; `shadow-sm` → `shadow-card`).
- An app never writes per-style CSS or `[data-style=…]` selectors: when one screen needs another shape, the style is
  missing a token, so propose it upstream (`/semi-propose`).
- Floating layers keep `shadow-overlay` / `shadow-float` in every style.

## Adding a style (maintainers)

1. Copy `tokens/styles/flat.json` to `tokens/styles/<id>.json`; set `name`, `description` and every token (the build
   fails when a key is missing or extra). Exactly one file has `"default": true`.
2. `npm run build:tokens`, then add its column above. `check:manifest` fails while a style has no column here.
3. `npm run build:storybook && npm run test:ui` (the switch lists the new style; check both themes).
4. CHANGELOG (a new style is a minor release). Changing a value of an existing style changes every app on it: note it
   under "Changed". Renaming or removing a style needs a release migration (`migrations/`) that rewrites
   `semi-lint.json` and the `<html data-style>` of apps that used it.
