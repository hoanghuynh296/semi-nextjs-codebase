# Migrating an app to Semi 1.0

Semi 1.0 is one breaking release: one look for every brand, pure neutral surfaces, the brand colour only for main
buttons and attention marks, a new type scale, a new shell, new tabs, quieter fields, new page layouts, a pinned search
bar and motion. This page is everything an app does to move from 0.x to 1.0, in order. Rules: `DESIGN_SYSTEM.md`.
Token names and values: `TOKENS.md`.

An agent with only this repo and `/semi-sync` must reach the same result as the owner's review: nothing here depends
on a conversation, private notes or access to a reference product. If a step is unclear, the docs are wrong: file it
with `/semi-propose`.

## How to migrate

1. **Rebuild the brand kit first** (an app with `"brand"` in `semi-lint.json`): in the brand repo, `/semi-brand update`
   strips the fields 1.0 no longer reads and rates the rebuild **major** (§ T1 below). Release the kit.
2. **Run `/semi-sync`** in the app (`--accept-major` for the kit, with the user's OK). It installs 1.0, rewrites the
   Semi block of `AGENTS.md`, prints the CHANGELOG of every skipped release and runs each release migration in version
   order (`node_modules/@semi/ui/migrations/1.0.0-*.mjs`). Each migration rewrites what it can and prints the rest as
   hand fixes (`file: message`).
3. **Do the hand fixes** the migrations printed (each ticket section below lists them and how to decide).
4. **Delete the app's stand-ins** that 1.0 replaces: the table at the end says which file or CSS rule goes and what
   replaces it. All T1–T9 replacements ship together in 1.0.0.
5. **Check:** `npx semi-lint`, `npx tsc --noEmit`, the build, then each key screen at 375px and 1280px in both themes:
   the first record visible without scrolling, one `h1`, at most one filled brand button per page or modal
   (`DESIGN_SYSTEM.md` §0 "Brand colour rule"). `npx semi density <url>` and `npx semi a11y <url>` clean.

## Status of the 1.0 tickets

| Ticket | What | Status | Migration script |
|---|---|---|---|
| T1 #141 | Foundation: tokens, one look, brand schema | merged on `main` (#154), unreleased: ships in 1.0.0 | `1.0.0-foundation` |
| T1b #155 | Two UI text sizes: `text-ui` 14 content, `text-chrome` 12 chrome | merged on `main` (#156), unreleased: ships in 1.0.0 | part of `1.0.0-foundation` |
| T2 #144 | Shell: frame, RouteHeader, nav, account avatar menu, shortcuts | merged on `main` (#159), unreleased: ships in 1.0.0 | `1.0.0-app-shell` |
| T3 #145 | Lint and checks for the 1.0 rules | merged on `main` (#169), unreleased: ships in 1.0.0 | — |
| T4 #146 | Buttons and attention marks | merged on `main` (#157), unreleased: ships in 1.0.0 | `1.0.0-buttons` |
| T5 #147 | Tabs: PillTabs, SegmentedControl, big TextTabs | merged on `main` (#164), unreleased: ships in 1.0.0 | `1.0.0-tabs` |
| T6 #148 | Fields and forms | merged on `main` (#165), unreleased: ships in 1.0.0 | — |
| T7 #149 | Page layouts and lists | merged on `main` (#166), unreleased: ships in 1.0.0 | — |
| T8 #150 | StickyContextBar pinning and actions | merged on `main` (#168), unreleased: ships in 1.0.0 | — |
| T9 #151 | Motion wiring | merged on `main` (#167), unreleased: ships in 1.0.0 | — |

All T1–T9 tickets are merged on `main` and ship together in `1.0.0`. Each section below lists what changed, what its
migration rewrites, the hand fixes, and the stand-ins it replaces.

## T1: foundation tokens (merged, ships in 1.0.0)

**What changed.** One look: the Flat / Sharp / Soft styles and `data-style` are gone. Surfaces, text, lines and focus
are pure neutral greys, the same for every brand. No colour is derived from the brand: the brand fills are only
`bg-primary` / `bg-secondary` (+ `text-on-*`), for the main button of a page, a modal or the nav, attention count
badges, "Mới" tags and the active big-tab underline. Headings are not bold (`font-title` 500). New type scale and
motion tokens. Full list: CHANGELOG "Unreleased" → "1.0 foundation".

**The migration (`1.0.0-foundation`) renames** these, in classes (any variant prefix, any `/opacity`) and in CSS
variable reads (`var(--semi-…)`, `var(--color-…)`, `var(--text-…)`):

| 0.x | 1.0 |
|---|---|
| `text-contrast` (also `--color-text-contrast`, `--semi-text-contrast`, `--color-contrast`) | `text-strong` (`--color-text-strong`, `--semi-text-strong`, `--color-strong`) |
| `accent-fg` (`text-accent-fg`, `border-accent-fg` …) | `strong` (flagged: brand-coloured text is gone) |
| `accent-subtle`, `accent-subtle-hover` | `item-selected` |
| `accent-line` | `outline-line` |
| `bg-accent`, `bg-action` (and `accent-hover`, `action-hover`, `on-accent`, `on-action`) | `bg-primary`, `primary-hover`, `on-primary` (flagged) |
| `text-accent`, `text-action` (and `placeholder-`, `caret-`, `fill-`, `stroke-`) | `*-strong` |
| `border-accent`, `divide-accent`, `ring-offset-accent` | `*-outline-line` |
| `ring-accent`, `outline-accent` | `ring-focus`, `outline-focus` |
| `decoration-accent` | `decoration-primary` (the active big-tab underline) |
| `accent-accent` | `accent-primary` (flagged) |
| `text-caption`, `text-label` | `text-chrome` (`text-label` flagged) |
| `text-copy` (main only, never released) | `text-ui` |
| `text-ui-lg`, `text-title`, `text-title-lg` | `text-lead` |
| `max-sm:text-title-lg` (a field's phone size) | `max-sm:text-input` |
| `text-heading-sm`, `text-heading` | `text-section` |
| `text-heading-lg`, `text-display` | `text-tab-xl` |
| `text-kpi` | `text-figure` |
| `data-style="…"` in JSX | removed |

`text-ui` is not renamed: it keeps its 14px as the content size.

**Removed without a rename** (the migration flags them, or `/semi-check` reports them): the `primary-50…900` brand
scale (`bg-primary-500`, `ring-primary-500/50` …), `tokens/styles/*.json` and `@semi/ui/styles.json`, `z-keypad`
(→ `z-sheet`), `"style"` / `"palette"` in `semi-lint.json` and `data-style` / `data-palette` on `<html>` (ignored;
`/semi-check` foundation removes them), Montserrat Alternates as the default display face.

**Hand fixes the migration prints:**

| Flag | Decide |
|---|---|
| `bg-accent → bg-primary` | A main button (the one commit action of the page or modal), the nav's main action (`mainAction`), an attention badge or tag: keep. A checked control or an "on" mark: `bg-inverted text-on-inverted`. A selected row or option: `bg-item-selected`. |
| `text-label → text-chrome` | Shell chrome or meta (a time, a count, a hint, a toolbar's compact button): keep. A form label, help text, list row or button text is content: `text-ui`. |
| `accent-fg → strong`, `accent-accent` | Links, check marks and active tabs are neutral now; a tinted checkbox or range is `bg-inverted`. |
| `primary-50…900` | `bg-primary` (main button, attention) or a neutral token (`bg-item-selected`, `border-outline-line`, `ring-focus`). Charts use `chart-1…8`. |
| `data-style` left in an expression or a CSS selector | Remove it: there is one look. |
| `app CSS sets --semi-X` / `--color-X` | Remove the declaration (`brand-override`). A brand colour goes in the brand kit; a surface, text or line token is Semi's. A removed name (`--semi-accent:`) is left as written and now sets nothing. |

**Brand kit.** `brand.json` keeps `primary` (required) and `secondary` (optional), each `"#hex"` or
`{ "color", "on" }`, `fonts.sans`, optional `fonts.display`, logo, voice and guide. `neutral`, `primaryStyle`, `styles`,
`accent`, `color.*`, `palettes` and `fonts.figure` are ignored with a warning: `/semi-brand update` removes them.
`BRANDS.md` has the schema.

**What the app deletes** (sales-hub v0.7.0 names; other apps check for the same kind of override):
- `app/semi-pending-neutral.css` and its import, and the lint `skip` entry that allowed it: the neutral greys are
  Semi's now.
- In the `TODO(semi-pending)` tail of `app/globals.css`: the rule that set content-panel heading weights
  (`.content-actions-inverse main :is(h1, h2, h3, h4, .font-title)`): `font-title` is 500 and headings use 400 / 500.
- Any app `@theme` or `:root` block that sets a `--semi-*` / `--color-*` surface, text or line token.

## T1b: content 14, chrome 12 (merged, ships in 1.0.0)

Owner decision C-011 (#155): content text is 14px (`text-ui`), only the shell chrome is 12px (`text-chrome`).
`text-ui` did not change, so apps' content text stays as it was. `text-caption` and `text-label` became `text-chrome`
(T1 table above); a `text-label` that is content goes back to `text-ui` by hand (the migration flags every file).
Which Semi piece uses which: `TOKENS.md` "Type scale". Phones: fields you type in are 16px below `sm`
(`max-sm:text-input`); touch rows stay 14.

**What the app deletes:** nothing. If the app made its content 12px to follow an early 1.0 draft, set it back to
`text-ui`.

## T2: shell (merged, ships in 1.0.0)

**What changed** (#144, CHANGELOG "1.0 shell"). `AppShell` is the 1.0 frame: a `bg-canvas` frame (8px from `sm`, none
on phones) with the nav panel (224px, or the 72px rail) and the content column, which holds the **RouteHeader**
(crumbs left, optional `middle`, `actions` and the account avatar menu right) above the `bg-panel` content card. The
nav: logo and collapse, the **main action**, the groups split by a 24px spacer with a `raised` line, group labels on
the new `text-nav-label` token (10 / 500 uppercase faint, the nav group label only), h32 items on
`bg-item-hover` / `bg-item-selected`, and a **bottom row** of 32×32 icon tools with count badges and a ••• menu. The
rail is the default between `lg` and 1280px (`railBelow`) and always between `md` and `lg`. Nav shortcuts ⌥ / Alt +
1–9. New: `RouteHeader`, `useRecordCrumb(label)`, `AccountMenu`, `Menu header`, `navShortcutKeys`, AppShell
`page="fixed"`, `flush`, `railBelow`, `railWidth`, `header`, `tools`, `toolsMenu`.

**The migration (`1.0.0-app-shell`) renames** at the tag's top level:

| 0.x | 1.0 |
|---|---|
| AppShell `create` (type `ShellCreate`) | `mainAction` (`ShellAction`; `ShellCreate` stays a deprecated alias) |
| AppShell / DocsShell `utilities` | `tools` (`ShellTool`: same id / label / icon / onClick / href / menu) |

**Hand fixes the migration prints:**

| Flag | Do |
|---|---|
| AppShell `account` / `footer` | The nav has no account block. Move who is signed in to the route header: `header={{ account: { name, detail, items, onSignOut } }}` (the menu also holds Light / Dark / System). Actions go to `tools` / `toolsMenu`. |
| `useThemeUtility()` next to a shell | Remove the theme item from `tools`: the theme is in the account menu (keep it only if the app has no account). |
| `storageKey` | The stored value is now `"rail"` / `"full"` (was `"1"` / `"0"`); AppShell upgrades a 0.x value once on load. Only app code that reads or writes the key changes. The default key is now `semi-nav` (the 0.x `semi_sidebar_collapsed` is upgraded and removed). |
| a tag with both the old and the new prop | Merge the old one into the new one. |
| a `{...spread}` on a shell tag, or a tag the script could not read to its end | Rename `create` → `mainAction` and `utilities` → `tools` by hand. |
| DocsShell `account` / `footer` | Deprecated: drawn compact in the route header; pass `actions` instead. |

Also by hand: give `<html>` `suppressHydrationWarning` (the nav's stored choice is set on it before paint); remove a
page's own breadcrumb at the top (the route header draws one: or pass `header={{ crumbs }}` / `header={false}`); a
detail page names its record with `useRecordCrumb(label)`.

**What the app deletes** (sales-hub v0.7.0): `app/components/semi-pending/ContentHeader.tsx` and its `useRecordCrumb`
(→ RouteHeader and Semi's `useRecordCrumb`); `NavBottomRow.tsx` (→ `tools` / `toolsMenu`); `navShortcuts.ts` and the
`[data-nav-num]` rules (→ AppShell shortcuts); in the globals tail `.nav-spaced` (group spacing), `.group-label`
(→ `text-nav-label`) and the 72px rail width; the account rendered in the rail (0.37 `account` render prop).

## T3: lint and checks (merged, ships in 1.0.0, #145)

**What changed** (#145, #142). `semi-lint` adds 1.0 warning rules (`one-brand-button`, `brand-colour-use`,
`removed-token`, `heading-weight`, refined `overline-place` allowing `<legend>` and flagging `<Field labelClassName="text-overline">`)
with per-line (`// semi-lint-allow <rule>: <reason>`) and per-file (`skip` with reason) opt-in allowances, plus `#142`
piped `--json` stdout flush (> 64 KB). `semi density` (`primary-actions`) counts `bg-primary` and `bg-secondary` and
scopes the nav (`<aside>` / `<nav>`) separately from the page; `semi a11y` keeps T6's quiet field edge acceptance and
documents the 44px phone touch target. `/semi-check` (`audit.mjs`) validates the 1.0 `brand.json` schema (`brand-schema`),
detects sales-hub-style stand-ins (`semi-pending-*.css`, `components/semi-pending/*`, `TODO(semi-pending)`) pointing to
this file, and counts `StickyContextBar` pages (#139). **Replaces:** no stand-in.

## T4: buttons and attention marks (merged, ships in 1.0.0)

**What changed** (#146). Ordinary actions are neutral; the brand fill is only for the main button (`DESIGN_SYSTEM.md`
§0). `Button` variants: `subtle` (**the default**, `bg-subtle-button`), `surface` (`bg-raised`: toolbar actions),
`inverse` (`bg-inverted`: a card's or a list title row's main action; `size="xs" shape="round"` is the pill), `outline`
(transparent, 1px `outline-line`), `ghost`, `primary` / `secondary` (**brand** fills: `secondary` is the brand secondary,
the primary when the brand has none), `danger`. Sizes `xs` 24 · `sm` 28 · `md` · `modal`. Hover in 150ms, a 2px focus
outline, disabled neutral. On a phone with a touch screen every button is at least 44 × 44px as its **real size**
(`BTN_HIT`, `pointer-coarse` + `max-sm`), never a pseudo-element that could cover a neighbour. New: `CountBadge` (brand
fill, "99+", `tone="neutral"` for a plain count), Button `badge` (a count at an icon button's corner: it is
`aria-hidden`, so say the count in `aria-label`; without one, Button adds it as screen-reader-only text), `NewTag`
("Mới"), `BTN_SUBTLE`, `BTN_SURFACE`, `BTN_INVERSE`, `BTN_XS`, `MODAL_BTN_SUBTLE` / `_SURFACE` / `_INVERSE` / `_GHOST`,
`buttonClass()`.

**The migration (`1.0.0-buttons`) renames** (only literal attributes of components imported from `@semi/ui`):

| 0.x | 1.0 |
|---|---|
| `<Button variant="secondary">`, `<SplitButton variant="secondary">` (the neutral tint) | `variant="subtle"` (or drop it: `subtle` is the default) |
| `BTN_SECONDARY` | `BTN_SUBTLE` |
| `MODAL_BTN_SECONDARY` | `MODAL_BTN_SUBTLE` |

**Hand fixes the migration prints:**

| Flag | Do |
|---|---|
| a variant chosen in an expression, in a file that names `"secondary"` | `"secondary"` is now the brand secondary fill: use `"subtle"` for a neutral button. |
| a wrapper typed with `ButtonVariant` that passes the variant on | Its callers' `"secondary"` is now the brand fill: change them to `"subtle"`. |
| `Button` imported under another name (`as`, `import * as`) | Not rewritten: rename its `secondary` by hand. |
| `<X variant="secondary">` that is not a Semi Button / SplitButton | If it wraps `Button`, the same: `"subtle"` for neutral. |
| `variant="outline"` | Now transparent with a 1px `outline-line` (no field fill): check it on its surface, or use `subtle` / `surface`. |

Also by hand: keep **one** filled brand button per page or modal; a list title row's "Thêm" is `inverse` unless it is the
page's commit action; an icon button's count moves to Button `badge` (or `CountBadge`), with the count in its
`aria-label`; a "Mới" tag becomes `NewTag`.

**What the app deletes** (sales-hub v0.7.0): in the globals tail `.content-actions-inverse .bg-action` (the forced
inverse main button) and the `content-actions-inverse` class where it only served that: use `variant="inverse"`.

## T5: tabs (merged, ships in 1.0.0)

**What changed** (#147, #121). Three tab controls with one clear rule (`DESIGN_SYSTEM.md` §0, §4h):
- **`PillTabs` (new):** default for 5+ sections of a page or sections with icons (settings-like pages). No track, h30
  round pills (16px icon + 4px + 12px/600 label), sliding `item-hover` pill in 300ms (`transition-slide`), `tablist` /
  `tab` / `tabpanel` (`id`, `aria-controls`, `aria-labelledby`), roving `tabIndex`, ←/→, Home / End.
- **`SegmentedControl` (new):** 2–5 filter values shown in full, with optional tabular-nums counts. `raised` track
  (radius 8, padding 4, gap 4, h32), h24 items (12px/600), sliding solid `raised-2` pill (white in light theme) in
  300ms, `radiogroup` / `radio`, ←/→, ↑/↓, Home / End.
- **Big `TextTabs` (updated):** strictly 2–4 top-level views of a discovery or reading page. `font-display text-tab-xl
  font-normal` (24px below `sm`, 28px from `sm`, weight 400 in the brand display face), every tab in `text-strong`,
  inactive `opacity-20` (hover raises opacity in 150ms, keyboard focus restores full opacity), active 2px brand
  underline (`decoration-primary`) at 6px offset under the word only, gaps 16 / 20 / 24, 28px to the intro below.
- **Shared across all three:** sideways scroll with no scrollbar, 2px `bg-outline-line` overflow edge cue
  (`data-edges`), `activation="manual"`, sync/async `onBeforeChange(key)` honoured by both button and `href` tabs,
  **`useTabParam`** (`?tab=` URL state via `urlState.ts` without pushing a history entry per arrow key), and
  `prefers-reduced-motion` turning off sliding pills and edge-cue fades.
- **Existing components:** `Pills`, `PageTabsTitle`, and `Tabs variant="segmented"` are **deprecated** (kept exported
  so existing code keeps compiling); `ViewSwitch` is **kept** (icon-only list ↔ grid + density toggle); `Tabs`
  underline is **kept** for sections of one record inside a card; the old `TextTabs` look is replaced in place.

**The migration (`1.0.0-tabs`) flags** deprecated `Pills`, `PageTabsTitle`, `Tabs variant="segmented"`, and any
leftover `.text-tabs-strong` stand-in rules for hand migration (because `SegmentedControl` and `PillTabs` require an
accessible `label`).

**What the app deletes** (sales-hub v0.7.0): `app/components/semi-pending/PillTabs.tsx`,
`app/components/semi-pending/SegmentedControl.tsx`, and `.text-tabs-strong` in the `TODO(semi-pending)` tail of
`app/globals.css`.

## T6: fields and forms (merged, ships in 1.0.0)

**What changed** (#148). Every text-like field (`Input`, `NumberInput`, `Textarea`, `HintTextarea`, `CustomSelect`,
`CustomCombobox`, `MultiCombobox`, `DatePicker`, `SearchInput`, `SearchPill`, `Command`, `InputGroup`, `InputOTP`) moves
to the quiet 1.0 style (`bg-field`, 1px `border-field-line`, `rounded-control`; on focus `border-field-line-focus` +
`bg-field-focus`, no glow ring; keyboard-only 2px `outline-focus` outline). `semi a11y` accepts the quiet field edge
(< 3:1 by owner choice) when the 2px ≥ 3:1 `:focus-visible` outline exists. `text-overline` is allowed for form/detail
section labels (never a single field's `<label>`) and does not force `display: flex`. New: `MultiCombobox` (searchable
multi-select with removable chips, IME-safe/diacritic-aware search, option groups), `CustomCombobox` option groups
(`group`), `OptionCards` (`radiogroup`/`radio`, neutral `item-selected`, 8px gap), `LetterAvatar` (and `Avatar
initials={1}` / `tone="neutral"`, wired into `AccountMenu`), `Textarea` / `HintTextarea` reply-box `autoGrow` +
`resizable` top `role="separator"` edge (md+, phones auto-grow only), `HintTextarea` Popover engine (portaled at
`z-popover`, flips above) + `HintToken.insert` / `showValue` + value truncation, `Modal` / `Drawer` physical-keyboard
autofocus (`autoFocusFirstField`, opt-out `false`) and `focusFirstField(root)`.

**What the app deletes:** `app/components/semi-pending/MultiCombobox.tsx` → `MultiCombobox`; `LetterAvatar.tsx` →
`LetterAvatar`; `autofocus.ts` → `Modal` / `Drawer` autofocus + `focusFirstField(root)`; `ProviderCards` → `OptionCards`;
reply-box drag → `Textarea` / `HintTextarea` `autoGrow` + `resizable`; the `.border-control-line` override in the
globals tail.

## T7: page layouts and lists (merged, ships in 1.0.0)

**What changed** (#149, CHANGELOG "1.0 page layouts and lists"). New `Page` (`layout="work" | "reading" | "two-column"`, `fixed`, shared anatomy slots `title` / `actions` / `tabs` / `intro` / `toolbar` / `children` / `footer` owning the 32 / 28 / 32 / 16 / 8 vertical rhythm), `SubNav` (240px sub-nav card, 20 / 10 padding, `text-nav-label` group labels with optional 16px icon actions, h32 items, 1px `bg-raised` dividers), `PageSection` (20/500 heading + 16px content gap), `PageGrid` (8px `@container` grid), `ListReaderLayout` + `ReaderHeader` (two independent scrollers on `fixed` mode, `?open=`, `useRecordCrumb`, phone swap with Back, sticky one-row header with wrapping title left and `[•••]` + one main action right), and `useListSelection`. `PageTitle` becomes 18 / 400 UI sans on the action row (`variant="reading"` opts into 44 / 500 `text-title-xl` display on one-column reading pages). `FilterChipRow` and `PhoneFilterBar` gain `sort` and in-place `selection` (`"n đã chọn"` 600 + `•••` + at most one filled bulk button + `"Xong"`, zero list shift); `ResultLine` is deprecated for list pages; `DataTable` gains `activeRowId` (`bg-item-selected`); `Card` and `Item` gain non-nested `selectable` / `checked` / `onCheckedChange` / `selected`. `WorkspaceLayout.action` is optional, `SplitButton` gains `fullWidth`, and `PageSkeleton` gains `shape="workspace"`.

**What the app deletes** (sales-hub v0.7.0): in the globals tail the flush container (`main#main > div`), `.page-title-row` and `.content-card h1`, `.page-column*`, `.list-*`, and hand-built selection rows.

## T8: StickyContextBar pinning and URL state (merged, ships in 1.0.0)

**What changed** (#150, #129, #124, #139, CHANGELOG "1.0 StickyContextBar pin behaviour").
- **`StickyContextBar` layout-pin & focus-pin:** pins when scrolling past the bar or focusing the search text field (250ms ease-out, instant under reduced motion, cancelled by wheel/touch; works on short lists; filter chips, sort and view buttons do not pin). From `md` (768px), pins by layout (`data-sticky-host`, `--sticky-pin`, `--sticky-view`, `overscroll-behavior: contain` on `[data-page-body]` or `ListReaderLayout` panels) so trackpad momentum and flings never unpin and only a new upward wheel gesture (> 200ms idle) from the list top unpins. Filter, sort, search, selection-mode and data changes keep pinned/unpinned state. Exposes `data-stuck` and `data-searching` and clears all attributes/vars on unmount. Below `md`, keeps native scrolling and touch behaviour.
- **`BarActions` & `BarAction`:** pass `<BarActions actions={…} menu={…} />` in `SearchPill`'s `trailing` slot to show up to 2 icon-button slots with tooltips in title-row order (`[•••][main action]`, 8px apart) while pinned and not searching (150ms fade, opacity-only under reduced motion, out of flow and out of the accessibility tree when hidden).
- **URL state (`useFilterParams`, `filterParams`, `urlState`, `DataTable`):** `useFilterParams` gains `legacy` (one-time post-hydration rewrite via `replaceState`, zero history entries), `patch(values, mode)` (multi-filter change in one history entry) and URL-backed `?sort=key.dir` (`sort`, `setSort`, `sortDef` shared by `FilterChipRow`, `PhoneFilterBar`, `FilterPanel` and `DataTable`, plus `readSort`, `writeSort`, `parseSort`, `formatSort`, `SORT_PARAM`); `replaceFilters` and `writeSearch` exported from `@semi/ui`; `DataTable` gains `onResultsChange` alongside `sortRows` / `searchRows`; `FilterPanel` `single` radio groups write with `"replace"` and label `role="radiogroup"` directly; an empty `single` `FilterChip` is disabled.

**What the app deletes** (sales-hub v0.7.0): `app/components/semi-pending/BarActions.tsx`,
`app/components/semi-pending/stickyBar.ts`, and in the `TODO(semi-pending)` tail of `app/globals.css`: `.bar-actions`,
`[data-page="fixed"|"list"]` scroll rules, and `.content-card [role="search"]`.

## T9: motion wiring (merged, ships in 1.0.0)

**What changed** (#151, CHANGELOG "1.0 motion wiring"). Wires T1's motion tokens (`TOKENS.md` "Motion") across Semi components:
- **`PageEnter` & `<Page enter>`:** `display: contents` route-level wrapper (keyed by `usePathname()` or custom `routeKey`) that runs `motion-enter` (400ms, opacity + translateY 4px → 0) and `motion-stagger` (35ms per item, capped at the first 10 rows/cards) once per route — never replays on filter, search, sort or `?tab=` changes, and never animates rows arriving after `windowMs` (default 1000ms).
- **Component wiring:** `Skeleton` / `PageSkeleton` / `.shimmer` pulse quietly with `motion-pulse` (2.5s, opacity 1 → 0.6 → 1, stops under reduced motion); `Tooltip` enters with `animate-tooltip-in` (200ms, opacity + scale 0.96 → 1); `Accordion` / `Collapsible` use `--motion-disclosure` (300ms ease-out) and `--motion-disclosure-close` (300ms ease-in) with `inert` + `aria-hidden` while closed; interactive elements use `transition-hover` (150ms) instead of hard-coded durations; under `prefers-reduced-motion: reduce`, all entrances animate opacity only and skeleton pulse stops. The shell never remounts or moves on a route change.

**What the app deletes** (sales-hub v0.7.0): `app/semi-pending-motion.css` and its local `PageEnter` stand-in (use `@semi/ui`'s `PageEnter` or `<Page enter>` and T1's motion tokens).

## Stand-ins and their replacements

The sales-hub v0.7.0 stand-ins (the app that found these gaps), one row each. Other apps look for the same kind of
local code. All T1–T9 replacements ship in `1.0.0`.

| Stand-in | Replacement | Shipped in |
|---|---|---|
| `app/semi-pending-neutral.css` (+ its lint skip) | T1 neutral tokens | T1 (merged, in 1.0.0) |
| globals tail: content-panel heading weights | `font-title` 500, headings 400 / 500 | T1 (merged, in 1.0.0) |
| `semi-pending/ContentHeader.tsx` + `useRecordCrumb` | RouteHeader, `useRecordCrumb` | T2 (merged, in 1.0.0) |
| `semi-pending/NavBottomRow.tsx` | AppShell `tools` / `toolsMenu` | T2 (merged, in 1.0.0) |
| `semi-pending/navShortcuts.ts`, `[data-nav-num]` | AppShell nav shortcuts | T2 (merged, in 1.0.0) |
| globals tail: `.nav-spaced`, `.group-label`, rail width | AppShell nav, `text-nav-label` | T2 (merged, in 1.0.0) |
| globals tail: `.content-actions-inverse .bg-action` | `Button variant="inverse"` | T4 (merged, in 1.0.0) |
| `semi-pending/PillTabs.tsx` | `PillTabs` | T5 (merged, in 1.0.0) |
| `semi-pending/SegmentedControl.tsx` | `SegmentedControl` | T5 (merged, in 1.0.0) |
| globals tail: `.text-tabs-strong` | big `TextTabs` | T5 (merged, in 1.0.0) |
| `semi-pending/MultiCombobox.tsx` | `MultiCombobox` | T6 (merged, in 1.0.0) |
| `semi-pending/LetterAvatar.tsx` | `LetterAvatar` | T6 (merged, in 1.0.0) |
| `semi-pending/autofocus.ts` | Modal / Drawer autofocus, `focusFirstField` | T6 (merged, in 1.0.0) |
| `ProviderCards` (`SettingsView.tsx`) | `OptionCards` | T6 (merged, in 1.0.0) |
| reply-box drag | `Textarea` / `HintTextarea` `autoGrow` + `resizable` | T6 (merged, in 1.0.0) |
| globals tail: `.border-control-line` override | quiet fields | T6 (merged, in 1.0.0) |
| globals tail: flush container, `.page-title-row`, `.content-card h1`, `.page-column*`, `.list-*` | T7 page layouts (`Page`, `SubNav`, `PageTitle`, `ListReaderLayout`) | T7 (merged, in 1.0.0) |
| `semi-pending/BarActions.tsx`, `semi-pending/stickyBar.ts` | `StickyContextBar` pinning and `BarActions` | T8 (merged, in 1.0.0) |
| globals tail: `.bar-actions`, `[data-page]` scroll rules, `.content-card [role="search"]` | `StickyContextBar` | T8 (merged, in 1.0.0) |
| `app/semi-pending-motion.css`, `PageEnter` | motion tokens and `PageEnter` / `<Page enter>` | T9 (merged, in 1.0.0) |
