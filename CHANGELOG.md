# Changelog

All notable changes to the **Semi Design System** (`@semi/ui` and `semi-design` plugin) are documented in this file.

## [Unreleased]

Surfaces after magnific.com (C-030, #93): pages separate by **tone instead of borders**. Cards lose their border, secondary buttons become a translucent tint, and two brand-kit options arrive: `neutral: "pure"` (0% saturation greys) and `primaryStyle: "inverted"` (a neutral main button). Every existing token, class constant and prop keeps working. **Brand kits must be rebuilt and re-released** to get the new surface values (`/semi-brand update`); the new options default to today's choices (brand-tinted greys, brand-coloured primary).

Visible changes in every app after the update: every style's surfaces take the preview's small, even steps (Flat dark canvas / app / panel `#0f1011` / `#151619` / `#191b1f`, was `#0c0d0e` / `#121316` / `#202226`; light `#eff3f7` / `#f7f9fb` / `#ffffff`; field and raised follow; Soft and Sharp keep their hue); cards (`CARD`, `<Card>`, `HERO`) have no border in Flat and Soft and sit on `bg-card` (light: recessed one step below the page; dark: one step above the panel); tiles (`TILE`) lose their border; secondary buttons, `ICON_BTN` and `MODAL_CLOSE` are a tint fill without a border; the sidebar loses its line in Flat; the shell's canvas frame (`md:bg-canvas`) now shows around the sidebar and content on `md+`; five light tone texts are one shade deeper.

Shell and navigation after the same study (C-031 / C-032, #96): AppShell gets an accent **Create** action, a **pinned** group, **utilities** and **account** at the bottom, an icon rail that is the default on iPad, and on phones a **full-screen drawer** in place of MobileTabBar. New `MegaMenu`, `MinimalHeader`, `TextTabs` and the `text-overline` token.

Search and filters (C-032, #99; closes #57): a list page's search, filter chips and result line stay pinned while the rows scroll (`StickyContextBar`, `SearchPill`, `ResultLine`), filters are one line of chips with a popover each (`FilterChipRow`), phones get a segmented filter bar and a full-screen filter panel (`PhoneFilterBar`, `FilterPanel`), with filter state in the URL (`useFilterParams`, `readFilters` / `writeFilters`). `SubpageToolbar` gains an opt-in phone layout. Additive: no existing page changes.

Overlay and actions (C-032, #102; closes #90): a record opens over its list in a `DetailOverlay` with its own URL (`?open=`), ‹ › through the results and the list's scroll kept; related actions become one control (`SplitButton`, an extended `Menu`, `CardActions` on cards, rules G1–G12); the app-wide ⌘K "Tìm hoặc tạo" box is `CommandPalette` on top of `Command`. Visible in current apps: every `Menu` (and `ContextMenu`) opens as a **bottom sheet below `sm`**, and **danger items are always listed last** after a divider (G5), wherever they sit in `items`; nothing else changes until an app adopts the new pieces.

### Added
- **`SplitButton` (#90, G1):** the main action (`label`, `icon`, `onClick`, `loading`, `disabled`) and a ▾ menu button (`menuLabel`, aria-haspopup / aria-expanded) with the other ways to do the same job (`items`, MenuItem). `variant` primary / secondary, `size` md / sm; one filled button in total. Below `sm` one button (the icon, or the label with ▾) opens a menu with the main action first (`collapseOnPhone`, default on).
- **`Menu` items (#90):** `description` (a line under the label), `checked` (menuitemcheckbox + aria-checked), `loading` (spinner, aria-busy, cannot be picked again), `href` (a `next/link`; `onSelect` becomes optional), `disabled` as a string (the reason, shown under the label; the item stays reachable with aria-disabled), `hidden` (left out; a group whose items are all hidden disappears), `group` (consecutive items under a `text-overline` heading, role=group, a divider between groups). Type-ahead: a letter moves to the next item starting with it. `Menu sheet` (default `true`): below `sm` the list is a bottom sheet over a backdrop (P6).
- **`CardActions` (L10):** round icon actions in a card's top right corner, shown on hover or keyboard focus where the device can hover, with a ⋯ `Menu` for the rest; on touch screens one always-visible ⋯ with every action. `label` (required) names the group and the ⋯; clicks inside do not reach the card.
- **`DetailOverlay` (L9):** a modal dialog over the list (named by its title, focus trap, focus back to the opener): close, title + subtitle, copy link, "n / N" (read "Mục n trên N"), ‹ › with ← → (not inside inputs, menus, sliders; disabled at the ends), main content + `related`, a `side` action panel (right column from `lg`, below the content before). The window scroll is put back on close if anything moved it; a new item starts at its top.
- **`openDetail(id, key = "open")`:** opens a DetailOverlay item on the current route from anywhere (a CommandPalette record): use it instead of a same-route `router.push("?open=…")`, which browsers without the Navigation API (Firefox, Safari < 26) do not report to the list.
- **`useDetailParam(key = "open")`:** the open id in the URL on top of `useFilterParams` (Next App Router safe: `null` history state, deferred URL listeners, no `useSearchParams`): `open(id)` pushes (Back closes), `show(id)` replaces (‹ ›), `close()` goes back when the entry is one this page opened (an entry key kept in sessionStorage with the Navigation API, so also after Back then Forward; without it the entry opened last), else removes the param (a deep link): no duplicate list entry.
- **`CommandPalette` (L1):** the app-wide "Tìm hoặc tạo" dialog on ⌘K / Ctrl+K (`hotkey`, `false` binds nothing), uncontrolled by default (`openCommandPalette()` opens it from a button) or controlled (`open`, `onOpenChange`); `items` from the layout plus the items pages register with **`useRegisterCommands(items)`** (listed first, removed on unmount); Esc key cap, key legend footer (↑↓ Chọn, ↵ Mở, ⌘↵ Mở tab mới, Esc Đóng; hidden below `sm`), `initialQuery`, `onOpenInNewTab`.
- **`Command` / `CommandItem`:** `hint` (a line under the label), `tone` (an `IconTile` colour in `size="lg"`), `href` (⌘↵ / Ctrl+↵, ⌘-click and a middle click open it in a new tab; Enter still runs `onSelect`); `Command` props `size` (`lg`: taller rows with tiles, `text-overline` group headings), `initialQuery`, `label`, `inputEnd`, `footer`, `onOpenInNewTab`, and `emptyText` as a function of the query. The default `md` list looks as before.
- **Menus:** Space activates a link item (`href`) like Enter.
- **Locale strings:** `copyLink`, `prevItem`, `nextItem`, `itemOf`, `paletteLabel`, `palettePlaceholder`, `paletteEmpty`, `paletteSelect`, `paletteOpen`, `paletteNewTab`.
- **Rules G1–G12** (C-025 / C-026) in `DESIGN_SYSTEM.md` §9 "Grouping actions", `QUICK_REF.md`, the plugin rules and the `semi-ui` skill; their lint rules come with #94 PR 6.
- **Docs:** new `split-button`, `card-actions`, `detail-overlay`, `command-palette`; `menu` gets the `grouped` example. The prerender test app mounts the palette in its root layout and a list with a DetailOverlay opened by URL on a dynamic route (`/items/[id]`).
- **Search and filters (#99):** `StickyContextBar` (`STICKY_TOOLBAR` as a column, `role=search` with `label`), `SearchPill` (wide pill search: `debounce` 250 ms by default, Escape and the clear button clear at once, `focusKey` "/" focuses it from the page, `shortcut` shows a key cap, `trailing` tools; shows a value changed from outside and drops a pending send; a `border-control-line` edge on its tint fill, ≥ 3:1 against app / panel / card in every style, theme and sample kit, `surfaces.test.mjs`), `ResultLine` (“query” · N kết quả, a polite live region, sort `Menu` on the right, `unit`, `trailing`), `SortDef`.
- **`FilterChipRow`, `FilterChip`, `FilterOptions`:** one line of chips (icon, label, the value or "Nhãn · N" when on, chevron; solid `bg-inverted` when on), a multi-select `Popover` per chip (aria-expanded) with "Bỏ chọn", switch chips (`kind: "switch"`, aria-pressed), sideways scroll with ‹ › buttons (pointer only: aria-hidden, out of the tab order), "Xoá lọc" while a filter is on, `trailing` tools behind a divider.
- **Filter state in the URL:** `filterParams.ts` (pure, no React or window; runs on the server and in tests): `readFilters`, `readFilterValues`, `writeFilters` (keeps other params), `clearFilters`, `activeFilterCount`, `toQueryString`, `FILTER_PARAM_PREFIX`, types `FilterSpec`, `FilterDef`, `FilterOption`, `FilterValues`, `ParamsInput`. Format: one repeated param per filter (`?f.status=new&f.status=won&f.big=1`), values in the options' order, unknown values dropped. `useFilterParams(specs, { prefix })`: reads the URL after hydration (`useSyncExternalStore`, prerender-safe, no `useSearchParams`), writes with `history.pushState(null, …)` so Next's App Router syncs `useSearchParams` and `router.refresh()` keeps the filters (Back undoes a filter), follows Back / Forward, every other hook on the page and, where the Navigation API exists, a Link or `router.push` to the same route (read a microtask later: Next writes history inside an insertion effect; elsewhere a hook in a layout that does not re-render can miss those, so use `useSearchParams` + `readFilters` there); `setParams` for the query / sort / view. Browser test under Next's router: `tests/prerender.spec.ts` (`test:ui` now also serves `tests/prerender-app`, so run `build:prerender-test` first). Tests: `lint/test/filter-params.test.mjs`.
- **`ViewSwitch`:** list ↔ grid toggles and an optional density toggle (`ViewMode`, `ViewDensity`).
- **`PhoneFilterBar`, `FilterPanel`:** the phone bar (views `Menu` · "Bộ lọc" with the count · settings) and the filter panel (modal dialog, focus trap, focus back to the opener; full screen on phones, a right side sheet from `sm`): sort chips first, switches, one accordion per filter (filters that are on start open), `children` for more settings, "Xem N kết quả" (`resultCount`) at the bottom.
- **`SubpageToolbar` phone layout (#57):** `filters` (`ToolbarFilters`: typed filters; up to two as chips, more collapse into "Bộ lọc · N" + the active ones as chips at every width, C-026; below `sm` always the button, opening a `FilterPanel`), `collapseFilters` + `filterCount` (below `sm`, `left` moves into a bottom `Drawer` behind "Bộ lọc · N"), `secondaryActions` (`MenuItem[]`: text buttons from `sm`, a ⋯ `Menu` below it). Below `sm` the toolbar is then at most two rows (with `collapseFilters`, `left` is mounted once: in the row, or in the sheet while it is open). Without these props it renders and wraps as before.
- **Locale strings:** `filters`, `filterCount`, `filterSelected`, `clearSelection`, `scrollLeft`, `scrollRight`, `number`, `results`, `showResults`, `sort`, `viewMode`, `viewList`, `viewGrid`, `densityCompact`, `densityComfortable`, `viewOptions`, `moreActions`.
- **Docs:** new `search-pill`, `filter-chip-row`, `view-switch`, `filter-panel`, `sticky-context-bar`; the `subpage-toolbar` doc gets the `phone` example. The prerender test app mounts the context bar on a dynamic route (`/filters/[id]`).
- **Docs builder:** a prop's `@default` TSDoc tag fills the Default column when the signature cannot show it (props read in the body).
- **AppShell (#96):** `create` (the accent action on top: a `Menu` of `items`, or one `href` / `onClick`), `pinned` (`{ label, items }` under the nav with a `text-overline` label), `utilities` (items at the bottom, usually with `onClick`), `account` (the bottom slot; its render prop gets `{ collapsed, rail }`: `rail` is true whenever the sidebar shows icons only, collapsed or at `md`, and both are false in the phone drawer), `mobileNav` (`"drawer"` or `"tabs"` for MobileTabBar; default: `"tabs"` when `mobileTabIds` is set, else `"drawer"`). Nav items gain `onClick` (act in place) and `mega` (open a MegaMenu). In the rail every item (also one with `right`, and the Create menu trigger) has an `aria-label` and a Tooltip on the right; the collapse / expand buttons have `aria-expanded` and `aria-controls` (the sidebar).
- **Phone drawer:** below `md` AppShell shows a top bar (menu button, logo, product name) and a full-screen drawer (modal dialog: focus trap, Escape goes back a level or closes, focus returns to the menu button): one accent Create row (its items open as a level), the sections, drill-down rows (›) for sub-items and mega menus with a back row (a parent with its own `href` is the level's first row, "Tất cả <label>", locale `allOf`; focus returns to the row that opened the level), the pinned group, utilities and the account at the bottom. It closes when the window grows past `md`.
- **`MegaMenu`:** flyout of category columns (`text-overline` headers as h2, links with icon / hint / New badge, See all), `placement` right (beside a sidebar) or bottom; focus moves to the first link, ↑/↓ move, Escape / outside click / Tab out close and focus returns to the trigger.
- **`MinimalHeader`:** breadcrumb (or title) left, one text link (hidden below `sm`) and one primary action right, for detail and settings pages.
- **`TextTabs`:** large text tabs as the page heading (current bright, others `text-muted`), WAI-ARIA tabs (←/→/Home/End, roving tab stop), buttons switch on focus, tabs with `href` are links (URL-driven; Enter follows), optional panel (`children`), `heading` wraps them in the `h1`.
- **`text-overline` (C-032):** 11px, `0.06em` tracking, semibold, uppercase (`tokens.json` type entries may now carry `letterSpacing`, `fontWeight`, `transform`). Only for section labels: a sidebar / drawer group, a palette group, a mega menu column.
- **`Tooltip side="right"`** (the rail). Props given to a Tooltip go on to its trigger, so it can be the `trigger` of a `Menu` or `Popover`.
- **Locale strings:** `mainMenu`, `openMenu`, `closeMenu`, `expandMenu`, `collapseMenu`, `back`, `seeAll`, `allOf`, `newBadge` (the shell's labels were hard-coded Vietnamese).
- **Docs:** the AppShell example `full` runs full screen at `/demo/app-shell/` on the docs site; new docs `mega-menu`, `minimal-header`, `text-tabs`.
- **Surface scale (#93):** `bg-panel-0` … `bg-panel-4` (`--semi-panel-0…4`, both themes, every style): `panel-0` = `canvas`, `panel-2` = `app`, `panel-4` = `panel` (the old names are the same values), `panel-1` / `panel-3` halfway between, mixed in CSS (`color-mix(in oklab, …)`) so styles and brand kits need no new values.
- **`bg-card`, `bg-card-field`:** the content-card surface (dark: `panel` + 5% text-contrast; light: `app` + 5% text-contrast, recessed) and a field / tile / table head inside a card. They are `@utility` rules (no `--color-card` theme colour, which would also create a `border-card` colour utility colliding with the style's `border-card`); `var(--color-card)` is still set for app CSS.
- **`bg-tint`, `hover:bg-tint-hover`:** translucent fill of secondary buttons (text-contrast at 7% / 11% dark, 5% / 9% light).
- **`bg-inverted`, `hover:bg-inverted-hover`, `text-on-inverted`:** a neutral solid fill opposite to the page (near-white on dark, near-black on light; ≥ 16:1).
- **`bg-action`, `hover:bg-action-hover`, `text-on-action`:** the main-button fill. Equal to the accent tokens by default; `BTN_PRIMARY`, `MODAL_BTN_PRIMARY`, `headerPrimary` and `NumPad`'s confirm now read it.
- **`CARD_BORDERED`, `CARD_BORDERED_HOVER`, `<Card bordered>`:** the pre-0.36 framed card (panel fill + `border-line`) for dense data views.
- **`BTN_OUTLINE`, `MODAL_BTN_OUTLINE`, `<Button variant="outline">`:** the pre-0.36 framed secondary button.
- **Import order for `primaryStyle: "inverted"`:** `brand.css` must be imported after `@semi/ui/tokens.css` (as the docs always showed): its block re-points `--semi-action` at the same specificity, so the later file wins.
- **Brand kits: `neutral: "pure"`** (0% saturation greys, text and lines included) and **`primaryStyle: "inverted"`** (one extra `brand.css` block points `--semi-action` at `inverted`; the accent stays for links, selection, focus, badges, switches). `neutral` may now be left out and accepts `"brand"`, the new name of `"tinted"` (still accepted, same output). The brand report (BRAND.md, `dist/brand.json`) gains text-muted on card / card-field, card vs app, and for inverted kits the main-button contrast. `/semi-brand`: `--neutral brand|pure|preset`, `--primary-style`, `set primaryStyle=inverted`. The docs Brand preview has both choices.
- **Tests:** `lint/test/surfaces.test.mjs` checks every style × theme in core and in the Semi / 3D Noobs kits (brand and pure neutrals): text-muted ≥ 4.5:1 on every panel step, the card and card-field, the scale ascends, card vs app ≥ 1.1:1 (light recessed, dark above the panel), inverted ≥ 4.5:1, every status / tone text ≥ 4.5:1 on its badge inside a card, and no plain `.bg-*` fallbacks in `tokens.css`. `brand.test.mjs` checks that the defaults (`tinted`, `brand`, missing) give byte-identical CSS, that `pure` is grey and that `inverted` only adds its block.

### Changed
- **`Menu` and `ContextMenu` on phones (#90, P6):** below `sm` the list opens as a bottom sheet over a backdrop (rows 12px taller), not as a dropdown under the trigger. Pass `sheet={false}` to a `Menu` to keep the dropdown. `Menubar` is unchanged.
- **Danger items last (G5):** `Menu`, `ContextMenu`, `Menubar` and `SubpageToolbar`'s phone ⋯ list `danger` items after the others, with a divider, keeping their order. A menu that already ends with them looks the same.
- **Density audit `primary-actions`** (`npx semi density`, `test:ui`): a SplitButton's ▾ (`data-split-menu`) is not counted as a second filled button (G7: a SplitButton is one primary).
- **`useHotkey` (and `CommandDialog`, `CommandPalette`) on Macs:** ⌘K only (Ctrl+K stays the text field's "delete to end of line"); Ctrl+K elsewhere as before. It no longer fires when a widget already handled the key (`preventDefault()`) or focus is in a contenteditable editor.
- **`ContextMenu sheet`** (default `true`), the same opt-out as `Menu`.
- **`MenuItem.onSelect` is optional** (a `href` item navigates) and **`MenuItem.disabled` accepts a string**: code that reads these fields of an item (not just passes them to `Menu`) must handle `undefined` / a string. `AppShell`'s drawer and `SubpageToolbar` leave `hidden` items out.
- **AppShell follow-ups (#98):** the `ShellCreate.items` doc says the phone drawer shows one Create row that opens the items as a level (not tiles); `Tooltip`'s `side` shows its default `"top"` in the props table; a drawer level focuses its first enabled row (or the back button), so a disabled first row no longer drops focus to the page.
- **AppShell look (#96):** new apps get the phone drawer; an app that sets `mobileTabIds` keeps MobileTabBar as before (deprecated: set `mobileNav="tabs"` to keep it on purpose, or remove `mobileTabIds` for the drawer). An app that set neither had the tab bar built from its first items and now gets the drawer. The sidebar is `w-60` (was `w-52`) and the rail `w-[60px]` (was `w-14`); rows are `h-9` with 18px icons; the active row is `bg-tint-hover text-contrast` and the others `text-body` (were `bg-raised` / `text-muted`); the logo tile is `bg-inverted` and, collapsed, expands the rail; `SHELL_MAIN` has no border (the tone step is the edge). The phone content starts under the top bar.
- **`footer` and `mobileTabIds` are deprecated** on AppShell (`footer` also on DocsShell, rendered as `account`); a development warning names them.
- **Surface values (C-030):** `canvas`, `app`, `panel`, `field`, `raised` of Flat, Soft and Sharp move to the preview's OKLCH lightness steps (dark 0.173 / 0.200 / 0.222 / 0.256 / 0.301, light ≈ 0.96 / 0.98 / 1.0 / 0.96 / 0.92), each style keeping its hue and chroma. Dark: the sidebar (`panel`) is one small step above the content (1.05:1, was 1.16:1) and cards carry the separation (`bg-card`, 1.16:1 vs the app). Light Flat: `#eff3f7` / `#f7f9fb` / `#ffffff` (field `#eff3f7`, raised `#e1e7ef`). Kits built with this version: Semi Flat dark `#110f0f` / `#171615` / `#1c1a1a`, card `#252323`.
- **`CARD`, `HERO`** use `bg-card`; Flat's `card-border` is `1px solid transparent` (the box stays, so `CARD_HOVER`'s hover border and `CARD_ACTIVE` do not shift the layout). Soft is unchanged (already borderless); Sharp keeps its 2px line. `SHELL_ASIDE` follows `card-border`, so the Flat sidebar loses its line too.
- **`BTN_SECONDARY`, `MODAL_BTN_SECONDARY`** (the default `<Button>`), **`ICON_BTN`, `ICON_BTN_DANGER`, `MODAL_CLOSE`**: `bg-tint hover:bg-tint-hover`, no border. Focus rings unchanged.
- **`TILE`**: `rounded-control bg-card-field`, no border.
- **Core default light `accent-fg` is `primary-800`** (was 700): the default green read 4.37–4.48:1 on `bg-accent-subtle` over the recessed light card (Pagination's current page in a card); now ≥ 4.5:1. Only apps without a brand kit (and the docs site) see it. The brand generator now also requires its `accent-fg` to read on every allowed style's card, with and without the selected tint; the Semi and 3D Noobs kits already pass, so their `brand.css` is unchanged.
- **Violet is pinned** in `tokens.json` (`--color-violet-50…950`) to Tailwind 4's own OKLCH values, the ones it shipped with until now (no visual change; the other palettes stay on v3 hex), so the badge contrast test covers `text-tone-violet` too.
- **Light tone text one shade deeper (#50):** `text-tone-amber`, `-orange`, `-cyan`, `-teal`, `-pink` go from `-700` to `-800` in light. On a badge (`bg-*-500/10`) over the recessed light card they were 3.9–4.5:1; now ≥ 5.5:1 (pink 4.6:1). Dark unchanged.

### Fixed
- **The shell canvas never showed (`SHELL_OUTER bg-app md:bg-canvas`).** `tokens.css` ended with plain `.bg-app`, `.bg-canvas`, `.bg-panel`, `.text-*`, `.border-*` fallbacks in `@layer utilities`, emitted after Tailwind's own utilities, so `.bg-app` beat `md:bg-canvas` at every width. The fallbacks are removed (Tailwind generates every one of them from the theme), so `md:` / `hover:` variants of these utilities now win as written. App CSS that relied on the fallback for a class Tailwind did not scan must let Tailwind see the class.

### Migration
- `migrations/0.36.0-shell.mjs` (`/semi-sync` runs it): `footer=` → `account=` on `AppShell` and `DocsShell` (only files importing `@semi/ui`; a tag that already sets `account` is left as is and reported); it prints a warning for every tag that sets `mobileTabIds` without `mobileNav`.
- By hand: move actions out of the old footer into `utilities` (`{ id, label, icon, onClick }`: theme, help, notifications), keep who is signed in in `account`; give the app one `create`; decide per app whether phones keep the tab bar (`mobileNav="tabs"`) or move to the drawer (remove `mobileTabIds`). Apps that relied on the content panel's border see none now.
- `migrations/0.36.0-surfaces.mjs` (`/semi-sync` runs it): inside one class string, a hand-made card `bg-panel border border-line rounded-card` (not floating: no `fixed`, `absolute`, `sticky`, `shadow-overlay`, `shadow-float`, `backdrop-blur`) becomes `bg-card rounded-card`; a copied `BTN_SECONDARY` string becomes the tint fill; a copied primary button (`bg-accent hover:bg-accent-hover` + `text-on-accent`) becomes `bg-action hover:bg-action-hover` + `text-on-action`.
- After `/semi-sync`, review modal and sheet panels whose own class string is `bg-panel border border-line rounded-card` while `fixed` / `absolute` sits on a parent element: the script cannot see the parent, so they become `bg-card` (recessed in light). Put them back to `bg-panel border border-line` (or use `Modal` / `MODAL_PANEL`).
- By hand (the script cannot judge them): a `bg-panel` block in another class order that is a card → `bg-card` (or `<Card>`); a block that should keep its frame (a dense table) → `<Card bordered>` / `CARD_BORDERED`; a framed toolbar that should keep its lines → `<Button variant="outline">` / `BTN_OUTLINE`; a `bg-field border border-line` button → `<Button variant="secondary">`.
- **Brand kits must be rebuilt and re-released** (`/semi-brand update` or `semi-brand build`, then a new kit tag; the brand owner releases). Until then an installed kit keeps the old surface values over the new cards and tints. A kit opts into the other looks with `"neutral": "pure"` or `"primaryStyle": "inverted"`.

## [0.35.0] - 2026-11-22

Brand kits get a different solid accent in each theme, the light Flat page gets a visible surface step, the dark chart palette gets a plum sixth colour, and `ToastHost` no longer needs a `<Suspense>` wrapper. There is **no breaking API change**.

**Brand kits must be rebuilt and re-released** to get per-theme accents and the Flat light app step (`/semi-brand update` or `semi-brand build`, then a new kit tag); the brand owner releases the kits. A kit with equal light and dark accents fails `semi-brand check` until it is rebuilt or sets `accent.sameInBothThemes`.

Visible changes: Semi orange light becomes `#bd4516`; 3D Noobs dark becomes `#539f50` with dark text; the light Flat page gets an app step (`#f8fafc`) behind the white panels; `--semi-chart-6` is now plum.

`ToastHost` fix: apps can drop the `<Suspense>` they wrapped around it; `next build` of dynamic routes works with a bare `ToastHost`.

### Changed
- **Visible change, Flat light (the default style): the page now has a surface step (#88).** `--semi-app` was `#ffffff`, the same as `--semi-panel`, so the AppShell content panel and the sidebar blended into the page. `app` is now `#f8fafc` (OKLCH L 0.984, halfway between canvas and panel: 0.016 on both sides, Sharp's are 0.012), `panel` stays `#ffffff`, `canvas` (`#f1f5f9`), `field` and `raised` are unchanged, so the order is canvas < app < panel. Dark Flat, Soft and Sharp are unchanged. The brand generator takes the Flat light neutrals from the same token, so kits get the step too: Semi `#fcf9f8` app (was `#ffffff`) and 3D Noobs `#f9faf8` (was `#ffffff`); canvas `#f6f4f3` / `#f3f5f3` and panel `#ffffff` stay. Light hover fills on `Item` rows and `TABLE_ROW_HOVER` go from `bg-field/60` to `/80` so they still read on the new app (dark unchanged). Ships in **v0.35.0** together with #84, so the kits are rebuilt once.
- **Tests:** a surface test (`lint/test/surfaces.test.mjs`) checks every style x theme in core tokens and in built kits: dark canvas < app < panel < field < raised, light canvas < app < panel and field / raised below the panel and the app, each with an OKLCH L step of at least 0.01, and that Flat light's canvas-to-app and app-to-panel steps are at least Sharp's.

### Fixed
- **`ToastHost` no longer breaks `next build` of dynamic routes (#82).** v0.34.0's `ToastHost` called `usePathname()` (to close undo toasts on a route change), so placed bare in a root layout, as the docs show, `next build` failed to prerender any dynamic route with "usePathname() in a Client Component outside <Suspense>" (`CLIENT_HOOK_DYNAMIC`). The pathname watcher is now a small internal child inside its own `<Suspense fallback={null}>`, so the toast stack always renders and **apps do not need a `<Suspense>` around `ToastHost`**; an existing `<Suspense fallback={null}>` around it can stay or go. `ToastHost` was the only component in `@semi/ui` that uses `usePathname`, `useSearchParams` or `useParams` (`AppShell`, `NavigationMenu`, `MobileTabBar`, `ConfirmHost`, `TaskHost` and `useUnsavedGuard` use none; `Breadcrumb` uses `useRouter`, which does not suspend). Regression test: `tests/prerender-app` (Cache Components, bare `ToastHost` in the root layout, a dynamic route with no `loading.tsx`) is built by `npm run build:prerender-test` in CI; it failed on v0.34.0.
- **Brand kits no longer have the same solid accent in light and dark (#84).** `semi-brand build` now derives `--semi-accent`, `--semi-accent-hover` and `--semi-on-accent` per theme, following Apple's system-colour practice: **light** takes `primary-600` (owner decision: closest to the brand), or 700 only when 600 fails white text at 4.5:1 or the fill stands out from the page less than 3:1, **dark** takes the shade of `400…500` closest to the brand colour under the same two rules, hover moves one step in the theme's direction (deeper in light, lighter in dark), and `on-accent` follows the theme (white on the light fill, dark text on the dark fill when it reads). Rebuilt locally: Semi light `#bd4516` / `#9d3100` / white (5.22:1), dark `#dd592a` / `#e8896a` / `#0c0d0e` (5.13:1); 3D Noobs light `#008509` / `#006f06` / white (4.82:1), dark `#539f50` / `#81b67d` / `#0c0d0e` (5.97:1).
- **Visible change for 3D Noobs in the dark theme:** the primary button becomes `#539f50` with dark text (`#0c0d0e`, 5.97:1) instead of `#008509` with white text; `#008509` now appears only in the light theme (a brand that wants one accent in both themes sets `accent.sameInBothThemes: true`, as Radix and Carbon do). Semi dark stays `#dd592a`.
- **`--semi-chart-6` switches between themes and is no longer a second green.** It was `#008300` in both themes, and a darker green in dark would sit next to chart-3 (aqua) and chart-4 (yellow) under colour-vision deficiency. It is now a plum: dark `#a175b1` (4.32:1 on the dark panel, in the other dark colours' lightness band), light `#88558a` (5.66:1 on white). OKLab ΔE to every other chart colour under normal, protan, deutan and tritan vision is at least 0.081 in dark (0.10 is not reachable inside that band) and 0.125 in light. Apps that drew a series 6 in green now get plum.

### Added
- **`brand.json` `accent`**: `{ "sameInBothThemes": true }` keeps one accent for both themes as an explicit brand choice; `{ "light": { fill, hover?, on? }, "dark": { … } }` pins a theme (a shade of `primary` or a hex). `semi-brand build` and `check` now **fail when the light and dark accent are equal** unless `sameInBothThemes` is set. Docs: `BRANDS.md` "Accent theo theme".
- **Brand book and the docs Brand preview** show the button, hover, text on the button and their contrast for both themes side by side.
- **Tests:** a themed-token test over the built CSS (core `tokens.css` and a built brand kit) fails when a `--semi-*` token is equal in light and dark, except an allowlist (`--semi-on-solid` and tokens that only reference themed tokens: `accent-line`, `focus`, `control-line-hover`); the two shipped brands get different accents with AA contrast.

### Migration
- **Brand kits must be rebuilt and re-released** to pick up #84 and #88 (Flat light surfaces): `/semi-brand update` (or `semi-brand build`), then a new kit tag. Until then an installed kit keeps its old, equal accent. Brand releases are the brand owner's. A kit that wants one accent in both themes adds `"accent": { "sameInBothThemes": true }`.
- A kit's primary button now changes colour between themes (and the light theme's is deeper); `semi-brand check` fails on a kit built by an older version because the generated files are stale.

## [0.34.0] - 2026-11-22

Three kits that make every app behave the same way: **states** (first use, no results, error, not found, no access, loading), **forms** (nobody loses typed work, one action bar, the right keypad) and **feedback** (undo for what can be reversed, a named confirm for what cannot, success once). Apps get them by updating `@semi/ui`. There are **no breaking changes**, and no migration is required.

What changes without any code change in an app: `EmptyState` is compact on a phone, a toast with an action stays 8 s, and identical plain toasts show once. `semi-lint` has new **warnings** (`form-no-guard`, `action-order`, `toast-for-validation`, `field-input-mode`, `local-toast`): a warning prints, is reported as `warnings` in `--json`, stays outside the baseline and never fails CI.

How apps adopt: add `error.tsx`, `not-found.tsx` and `loading.tsx` (`PageSkeleton inShell`) to each route group (recipe in the `states` doc); call `useUnsavedGuard(dirty)` on every edit page and use `FormActions`; use `toast.undo` for a delete that can be reversed and `confirmDelete({ name })` for one that cannot; replace a local toast wrapper with `toast` from `@semi/ui`.

The states kit (#66, owner decision C-021): every app can show first use, no results, error, not found, no access and loading the same way. Additive; nothing breaks.

### Changed
- **Every existing `EmptyState` (and the `DataTable` empty row) is now compact below `sm`**: `p-4`, `gap-2`, at most 40% of the viewport (`EMPTY_PHONE_CAP`), content top-aligned and, if it still overflows, focusable and scrollable. From `sm` up nothing changes.

### Added
- **`ErrorState`**, **`NotFound`**, **`Forbidden`** (`States.tsx`): title, message, a primary retry (`onRetry`), a link home (`homeHref`), a small `detail` line. Vietnamese default texts in the locale table (`errorTitle`, `errorMessage`, `notFoundTitle`, `notFoundMessage`, `forbiddenTitle`, `forbiddenMessage`, `retry`), English in `en`.
- **`EmptyState` variants** `first-use` (one icon, one sentence, one primary action) and `no-results` (own title and hint, `onClearFilters` renders "Xoá lọc"); new locale keys `noResults`, `noResultsHint`, `clearFilters`. Below `sm` every `EmptyState` is compact and at most 40% of the viewport (`EMPTY_PHONE_CAP`).
- **`PageSkeleton shape` and `inShell`**: `cards` (as before), `list` or `detail`, so loading has the shape of the page; `inShell` drops the full-page height and padding for a route `loading.tsx`. `headingLevel` on the states sets the title's heading (h1 for a route page).
- Docs: `DESIGN_SYSTEM.md` §13 / §13c, the `states` example doc (with the route-file recipe: `loading.tsx`, `error.tsx`, `not-found.tsx`) and the `first-use` / `no-results` / `list-shape` examples; the `semi-ui` skill builds the states from them.

### Feedback kit (#75, owner decision C-021)

One way to answer an action (D20, F10, owner question 17): undo for what can be reversed, a confirm that names the object for what cannot, success once. Additive; nothing breaks. The new lint rule is a warning.

#### Changed
- **A toast with an `action` (or `undo`) now waits 8 s** instead of 4 s (WCAG 2.2.1); hover and focus still pause it. Pass `duration` to keep the old time.
- **A plain toast with the same text, tone and description as one still showing replaces it** instead of stacking (success shows once). Toasts with `action`, `undo` or `onCommit` are never merged.

#### Added
- **`toast.success|error|warning|info(title, options | ms)`**, **`toast.undo(title, onUndo, options)`** and **`toast.promise(promise, { loading, success, error })`** on the existing `toast`; `toast({ ... })` works as before. The extras the apps had added locally (Studio's `toastStore`: kind helpers, a number as duration, an action that stays longer) are in Semi now; promise toasts and undo had no local version.
- **`ToastOptions.undo`** (shows the locale's "Hoàn tác", runs it, closes) and **`pending`** (spinner, no timer); **`updateToast(id, patch)`** changes a toast still showing. A toast with an `action` or `undo` waits 8 s (was 4 s), still pausing on hover and focus.
- **`onCommit`** (the undo window closed without an undo: timeout, closed, pushed out, route change, `pagehide`; best effort, fire-and-forget with `keepalive` / `sendBeacon`) and **route-change cleanup**: undo toasts already showing close when the route changes; one shown within 2 s before it (the action's own `router.push`) stays. `onUndo` must restore on the server, not only in local state; the robust pattern is to commit first (soft delete) and let undo restore.
- **`toast.promise` `timeout`** (default 30 s, `0` = none): the toast turns into the neutral "Vẫn đang xử lý…" (locale `stillWorking`), a rejection still shows the error. **`updateToast`** keeps the toast's id.
- **`ToastHost durationScale`** (multiplies every auto-dismiss time) and **`hotkey`** (default Alt+T, `false` off; skips inputs and IME composition) that focuses the newest toast's action (WCAG 2.2.1); Firefox's Alt menu is a caveat.
- **`confirmDelete({ name, message?, confirmLabel? })`**: `confirmDialog` for an irreversible action, the title names the object, red Xoá button, Huỷ. Its texts come from the provider's locale (`ConfirmHost` resolves them); in a danger dialog focus starts on Huỷ.
- **Locale keys** (Vietnamese default, English in `en`): `undo` "Hoàn tác", `stillWorking` "Vẫn đang xử lý…", `delete` "Xoá", `deleteTitle(name)`, `deleteMessage`; Huỷ is the existing `cancel`.
- **Lint warning `local-toast`** (warning tier, like the form rules): a toast library (`sonner`, `react-hot-toast`, `react-toastify`), an import of an app-level `toast` module or an exported `toast` / `notify` wrapper around Semi's toast.
- Docs: `DESIGN_SYSTEM.md` §14c, the `toast` (new `undo`, `promise`) and `confirm-dialog` (new `delete`) example docs, the `semi-ui` skill and agent rules.

#### Migration
Optional: replace a local toast wrapper with `toast` from `@semi/ui` (`toast.success("…")` is the same call as `toast({ title, tone: "success" })`), `window.confirm` / a "bạn chắc chứ" dialog for a delete with `confirmDelete({ name })`, and a delete you can reverse with `toast.undo`. `confirmDelete` follows the locale provider (English with `locale={en}`).

### Form kit (#67, owner decision C-021)

Forms behave the same everywhere and nobody loses typed work (F2, D13, P11). Additive; nothing breaks. New lint rules are warnings.

#### Added
- **`FormActions`** (`FormActions.tsx`): `Huỷ` (ghost) then `Lưu` or `Tạo` (`create`), right-aligned, `destructive` alone on the left. Sticky at the bottom of a page, above the on-screen keyboard (`visualViewport`) and the safe-area inset, `h-11` buttons below `sm`; `placement="modal"` is a `Modal` footer. Constants `FORM_ACTIONS`, `FORM_ACTIONS_STICKY`, `FORM_PAGE` (`max-w-2xl`).
- **`useUnsavedGuard(dirty)`**: warns on reload and tab close (`beforeunload`), on link clicks (asked with `confirmDialog`, then the click is repeated, so `next/link` and `basePath` work) and on back / forward in the Next.js app router (after "Rời đi" it steps off its history entry and stops warning, so Back is one press and nothing asks twice); returns `confirmLeave(then)` for navigation the app starts itself.
- **`Field kind`** (`email`, `tel`, `number`, `money`, `url`, `search`, `password`): sets `type`, `inputMode`, `autoComplete` and `enterKeyHint` on `Input` (`NumberInput` takes `autoComplete` and `enterKeyHint`) (`FIELD_KINDS`, `FieldKind`); a prop on the control wins. `number` and `money` use the decimal keypad and hold separators: parse with the #69 helpers.
- **`useFormValidation`** (error on blur, then on every change, `validate()` on submit) and **`FormErrorSummary`** (an `Alert` above `FormActions` when there is more than one error).
- **Locale keys** (Vietnamese default, English in `en`): `save` "Lưu", `create` "Tạo", `unsavedTitle`, `unsavedChanges`, `leave`, `stay`, `formErrors`; Huỷ is the existing `cancel`.
- **Lint warnings** (new: a warning tier that prints and never fails, outside the baseline): `form-no-guard`, `action-order`, `toast-for-validation`, `field-input-mode`; `--json` reports them as `warnings`.
- Docs: `DESIGN_SYSTEM.md` §9b, the `form-actions` example doc (`page-form`, `destructive`, `modal`), a `kinds` example on `Field`, the `semi-ui` skill and agent rules.

## [0.33.0] - 2026-11-22

Text fields no longer make iOS zoom the page in. Apps get the fix by updating `@semi/ui`. `/semi-check` and `semi a11y` now also report an app's own fields whose text is under 16px on a phone (the new `field-size` rule); an app's own field adds `max-sm:text-title-lg` or `FIELD_TEXT_PHONE`. There are no breaking changes.

### Fixed
- **iOS zoomed the page in on every focused text field, and stayed zoomed after blur** (#61): field text was 12-14px, and iOS Safari zooms into a focused field under 16px. Below `sm` every text-entry control now renders its text at 16px (`max-sm:text-title-lg`): `FIELD_INPUT`, `FIELD_TEXTAREA` (so Input, Textarea, NumberInput with `FIELD_INPUT`, and InputGroup; a caller passing its own `text-ui` adds `max-sm:text-title-lg`), SearchInput, CustomCombobox, Command, the Chat composer, InputOTP, and a bare `<input>` / `<textarea>` / `<select>` through `base.css`. From `sm` up the sizes are unchanged and control heights stay `h-control` / `h-field`. The viewport is untouched: no `maximum-scale`, no `user-scalable=no`. Checked at 375px in Chromium (computed font size); focus and blur on a real iPhone / the iOS Simulator are UNVERIFIED.

### Added
- `semi a11y` rule **`field-size`**: at a viewport under 640px a field you type in with text under 16px is a hit, so apps with their own fields are caught. A field of your own adds `max-sm:text-title-lg`.
- `FIELD_TEXT_PHONE` (`@semi/ui/styles`): the class string for that.

## [0.32.0] - 2026-11-21

Density budgets, accessibility checks and a screen review: a cluttered, cramped or inaccessible screen is now measured on the app's rendered page, and what no tool can measure (missing states, conventions, voice) is a checklist per screen.

### Added
- **Density & hierarchy budgets** (`DESIGN_SYSTEM.md` §4c, `QUICK_REF.md`): text inset in a box (`tight-box`), list row height and padding (`tight-row`), frames inside frames (`box-nesting`, at most three), text sizes per box (`type-mix`, at most four), colours per box (`colour-noise`, at most three), one filled accent button per view (`primary-actions`), space between boxes (`cramped-boxes`) and double lines (`double-line`). Every length is in density units, so compact and airy products keep their own scale.
- **`lint/density.mjs`**: measures the budgets in the browser (what semi-lint, reading code a line at a time, cannot see). `npx semi density <url…>` runs it with the app's Playwright at 1280px and 375px (`--width`, `--theme`, `--scope`, `--json`); `npx semi density --snippet` prints the expression to evaluate with a browser tool when the app has no Playwright.
- `data-density-view` (a frame that stands for a whole screen: a preview, a sample app) and `data-density-skip="<reason>"` (a specimen that breaks a budget on purpose).
- **`/semi-check` phase 5 — Mật độ**: measures the app's key pages with the vendored `density.mjs` (or the browser tool) and fixes the hits with the user's yes. `/semi-ui` measures a page before finishing; the consumer rules (`AGENTS.md` block) carry the budgets.
- `test:ui`: the budgets on every docs page (1280px dark, 375px light, every style at phone width) and every brand book page from 320px to 1280px; `tests/density.spec.ts` checks each rule against a bad and a good case.
- **`lint/a11y.mjs`** and **`npx semi a11y <url…>`** (`DESIGN_SYSTEM.md` §18): checks an app's rendered pages in dark and light at 1280px and 375px for text contrast (translucent tints blended in), field edges at 3:1, control names (a placeholder is not one), a visible focus indicator, 24px targets, image alt, `lang` and a viewport that allows zoom; adds axe-core's serious WCAG 2.2 AA findings when the app has `axe-core`. `--snippet` for a browser tool; `data-a11y-skip="<reason>"` for a specimen.
- **`/semi-check` phase 6 — Tiếp cận (a11y)** runs it on the app's key pages; `/semi-ui` runs it before finishing; the consumer rules carry the checks.
- **Screen review** (`DESIGN_SYSTEM.md` §19b): the questions per key screen for visual hierarchy, typography, spacing, colour, consistency, accessibility, usability and platform conventions, states and micro-interactions, and brand, each next to the tool that already measures part of it. The states come first: loading, empty and "no result", error with retry, partial, no permission, too much data. `/semi-check` walks the key screens through it (phase 4b), `/semi-ui` builds every state, and the consumer rules carry it.
- **`HIT_AREA`** (`@semi/ui/styles`): grows a control drawn smaller than 24px to a 24 × 24 px click area (44 × 44 px on touch) with a pseudo-element, keeping its visible size and the layout.

### Changed
- Core principles no longer push towards clutter: "Icons over words" (an icon on every card and section) becomes icons where they help scanning, and "Cards, not lines" becomes space first, then frames (§19 already asked for both).
- §4 spacing: `px-2` / `py-1` are for the inside of a control, never a row's or a box's padding; a list row is at least a control tall.
- `Table`: cells get `py-2` (`TABLE_CELL`), so a wrapped cell (`wrap`) no longer touches the row lines; one-line rows keep their 44px height.
- `FileDrop`: the file list keeps 8px between files (was 6px).
- WCAG 2.5.8 target size: `Carousel` dots, `Slider` thumbs, `DataTable` sort headers and `Calendar`'s "Hôm nay" get `HIT_AREA`; `Checkbox` and `Switch` now get a 24px area on a mouse too (was 44px on touch only). Nothing changes size on screen.
- `DESIGN_SYSTEM.md` §3, §3c and §7–§14, `QUICK_REF.md`: examples and descriptions now use the themed tokens the code uses (`text-tone-*`, `TONAL_SURFACE`, status `*-bg` / `*-fg` / `*-solid`, `bg-raised`, `SEGMENT_ON`, `bg-overlay`) instead of `text-*-700 dark:text-*-300` pairs, `-300` / `-400` shades, `text-gray-*` and `bg-white/[…]`, which the lint rules forbid; agents copying them learned the wrong pattern.
- `Toggle` (single) is `h-control` tall again: its shared item class also carried `h-full`, which won over `h-control` and drew it 20px tall. Only `ToggleGroup` items fill their group's height.
- `test:ui`: the a11y audit replaces the contrast-only check on every docs page (both themes, every style, phone width) and brand book page; `tests/a11y.spec.ts` checks each rule against a bad and a good case.
- Examples: `button/icons` shows one filled button (the icon-only one is secondary); `app-header/tool` shows a canvas under the header (the frame's edge doubled the header's line).
- Brand book (`semi-brand site`): the landing sample's header button is secondary (one filled button per screen), the dashboard sample's list rows are `px-4 py-2.5` and its KPI cards `gap-stack`; the sample screens are marked `data-density-view`.

### Migration
- None. Existing apps see the budgets and the a11y checks when they run `/semi-check`, `npx semi density` or `npx semi a11y`; nothing in `semi-lint` changed.

## [0.31.0] - 2026-11-20

Design Lab: try core values of Semi on the whole docs site and on sample brands before an agent writes them.

### Added
- **Design Lab** (`/lab/` on the docs site, [docs/LAB.md](docs/LAB.md)): edit the type scale (size and line height of every `text-*`), the sizes of each density and type scale, each style's fonts, title weight, figure font, radii, control heights, card shadow and border (and any other style token), and the brand generator's parameters. A draft applies on every docs page at once (a badge pauses it to compare with the original), the brand being previewed follows its generator parameters, and a link (`#lab=…`) shares it. Tabs: Chữ, Hình khối, Màu (one sample brand before / after), So sánh brand, Thay đổi (the diff per source file, and "Copy lệnh cho agent").
- **`npm run lab:apply -- <patch.json> [--dry]`** writes a Lab patch into `tokens/tokens.json`, `tokens/styles/<id>.json` (a font change updates the style's `fonts`) and `brand/params.mjs`, then runs `build:tokens` and `sync:vendor`, and lists the docs left to update. It refuses an invalid patch, and a generator change that makes a sample brand lose an AA pair.
- **`brand/params.mjs`**: the numbers of the brand generator (lightness ladder, chroma curve, fill reach, neutral tints per style, status gap and turn), with a note each. `generateBrand(brand, { …, params })` takes overrides; `@semi/ui/brand` also exports `PARAMS` and `mergeParams`. Defaults generate byte-identical kits.
- **`semi-brand compare [--params <file>]`** and `brand/samples.mjs`: eight sample brands that are hard in different ways (yellow, light cyan, navy, red next to the error colour, orange, greyish violet, blue, the test kit's green), generated with the current and with new parameters; exit 1 when one loses an AA pair.

### Changed
- `scripts/build-tokens.mjs` shares px → rem, the style selectors and the utility-only keys with the Lab (`scripts/token-css.mjs`); `tokens.css` is unchanged.
- The accent-subtle alpha the generator checks text against is read from `tokens.json` (`color-accent-subtle`) instead of a copy in `generate.mjs`.

### Fixed
- Docs site: the brand preview badge's "Sửa" link went to `./brand` relative to the current page (a 404 from a component page); it links to `/brand/`.

### Migration
- None. Brand kits build the same colours.

## [0.30.0] - 2026-11-20

Rules an agent cannot slip past, tokens named by role, and status colours that never blend with the brand.

### Added
- **semi-lint: 15 rules for re-created UI and escape hatches** (ratchet: existing apps keep today's count in the baseline, new code may not add any):
  - Re-creating instead of composing: `raw-control` (`<button>`, `<input>`, `<textarea>`, `<table>`), `foreign-ui` (lucide-react, react-icons, Radix, MUI, Headless UI, Heroicons, Chakra, antd, Mantine, Tabler, react-bootstrap, HeroUI, shadcn `components/ui` copies), `local-primitive` (an app's own `Card`, `Badge`, `Tooltip`…), `custom-overlay`, `custom-spinner`.
  - Escape hatches: `arbitrary-value` (`p-[13px]`, `z-[9999]`, `bg-panel/[0.05]`, `bg-[var(--semi-…)]`), `tw-shadow`, `text-case` (`uppercase`), `leading-override`, `inline-style-value` (colours, type, radii in `style={{}}`), `css-raw-value` (colour literals, `border-radius`, `font-size` in `.css`).
  - Keyboard and icons: `click-target` (`<div onClick>` without a role), `focus-hidden` (`outline-none` with no focus style), `emoji-icon`.
  - Each rule has allowances found on Semi itself (safe-area `env()`, viewport units, layout widths, popover lists, Semi constants on native header buttons, a text field's caret). `lint/test/invented-ui.test.mjs` checks that every invented-UI snippet of the corpus is caught and that the correct way to write each is not flagged. Against the 34-case red team of the audit, semi-lint now catches 32 (it caught 6); the two left are by decision (`opacity-*` as muted text cannot be told from disabled; a hue tint is allowed for categories, so a status written as one is a message, not a rule).
- **`semi-lint --ci`**: also fails when `semi-lint-baseline.json`, a `skip` or a disabled rule grew against the base branch (`SEMI_LINT_BASE`, default `origin/main`), except in a change that upgrades @semi/ui.
- **The gate outside Claude Code**: `/semi-new-app` and `/semi-check` put `semi-lint` in the app's `lint` script and add `.github/workflows/semi.yml` (`semi-lint --ci` + `tsc` on every push and pull request). `/semi-check` reports an app without them (`semi-gate`).
- **Brand kits: status colours turned away from the primary.** When the primary sits within 30° of a status hue, the generator turns that status (danger / warning up to 12°, success / info up to 20°), keeping lightness and chroma; `brand.css` overrides `--semi-<status>-fg|bg|border|solid` and BRAND.md notes the turn. `/semi-brand update` reports it as a minor change.

### Changed
- **`semi-lint --update-baseline` only lowers the baseline**: new hits are refused and listed. `--accept-new` records them (after a Semi upgrade: `/semi-sync` runs it; otherwise only with the user's OK). The first baseline (adopting Semi) still records everything.
- **The edit hook** lints `.css` files too, and flags any edit of `semi-lint.json` or the baseline back to the agent.
- **Agent rules** (`AGENTS.md` block): no more "baselined workaround"; lint is never silenced, a skip needs the user's OK and a reason.
- A chromatic focus or state ring (`ring-blue-500`, `outline-sky-400`) is flagged as `accent-state-token` (use `ring-focus`, `border-accent-line`). `card-padding` also covers plain `rounded-card` boxes; `all-caps-label` ignores acronyms (HTTP, JSON…); clearer `narrow-container` and `no-solid-pastel-surfaces` messages.

### Fixed
- **`<Card onClick>`** was a mouse-only `div`: it is a button for keyboards and screen readers (`role="button"`, tab order, Enter / Space, `FOCUS_RING`; `active` becomes `aria-pressed`).
- Backdrops and click-forwarding wrappers in `AppShell`, `Chat`, `confirmDialog` and `InputOTP` are `role="presentation"`; chart axis labels use `fill-muted`.
- Docs site: Foundations icon tiles are `<Card onClick>`, the JSX copy box a `Button`; the style switcher is a `ToggleGroup`; the brand preview close button a `Button`.

### Migration
- **Token renames** (release migration `0.30.0-role-token-names`, run by `/semi-sync`): `text-kpi` → `text-figure`, `z-keypad` → `z-sheet`, in classes and CSS variables. The old names stay as deprecated aliases until 1.0.
- **New lint rules**: `/semi-sync` records what they find in existing code as baseline debt (`--update-baseline --accept-new`); fix it over time, the baseline only shrinks. Apps that add a skip or grow the baseline afterwards fail `semi-lint --ci`.
- **Scripts calling `semi-lint --update-baseline` to accept new hits** now need `--accept-new`.
- **Brand kits** whose primary is close to a status colour get a slightly turned status colour after `/semi-brand update` (minor).

## [0.29.4] - 2026-11-20

### Fixed
- **`ChatList`**: scrolling up while an answer streams no longer gets pulled back down when a stream update lands before the scroll event (the list now notices it was moved off the bottom). This also made the docs test for it flaky in CI.
- **`semi-brand storybook`** printed `…/brand.html#brand=…`, a page of the old Storybook that is gone (404); it prints `…/brand/#brand=…` (every docs page reads `#brand=`).

### Changed (docs site)
- The Pages workflow builds the site **once, with the Pages path**, and runs the browser checks on that build (`serve-static.mjs` serves requests under `NEXT_PUBLIC_BASE_PATH`), so the tested build is the deployed one. One `next build` less per deploy.
- After deploying, it **smoke-checks the live site**: `components.json` answers with this version, a doc page and its stylesheet load (cache-busted).
- It also runs on **every release**: a merge to main shows "@semi/ui vX · main" in the menu footer until the tagged release is published and redeployed without the label, so the live docs say whether they match what apps install.
- README: "Docs deploy" status badge and latest release badge.
- **Docs pages follow Semi's own rules**:
  - Foundations is rebuilt on Semi components: `Input` for search, `CustomSelect` for the group, `ToggleGroup` for the tile colour, `Badge`, `Alert` for do / don't, `EmptyState`, and `toast` for "copied". Icon tiles and the JSX box were `<div onClick>`, so a keyboard could not reach them; they are buttons with `FOCUS_RING` and `aria-pressed`.
  - Removed: physical colours (`bg-emerald-500/20`, `bg-red-500/10`, `ring-white/50`), meaningless `bg-panel/[0.05]` fills, ALL CAPS labels, decorative coloured dots, a pulsing "copied" chip, and English / Vietnamese mixed headings.
  - Menu footer: a neutral `Badge` for the icon count instead of a green status chip.
  - Home: neutral card icons, focus ring on the agent file links, inline code no longer styled like links.
  - `leading-*` overrides dropped (sizes carry their line height); component index cards use `p-card`.
- **Menu**: component items have no icon, only their group heading does (the same icon on every item said nothing). The rail shows the short name instead.
- Foundations lists `border-control-line` (input edges) next to `border-line` (cards, tables).

## [0.29.3] - 2026-11-20

### Fixed
- **Brand kit install** (0.29.2 regression): the fresh `npm install` keeps `--install-links`, so a local @semi/ui (`SEMI_UI_SOURCE`, the docs' sample brand book) is copied instead of symlinked; Turbopack could not resolve the symlink and the brand book build failed.

## [0.29.2] - 2026-11-20

### Fixed
- **`/semi-brand update` / `create` and the kit's `semi-update.yml`** write a fresh `package-lock.json` when they install @semi/ui. Installing on top of the old lock (on macOS) dropped the bundled deps of Tailwind's wasm32 binding (`@emnapi/*`), so `npm ci` failed in the kit's CI on Linux (seen on hoanghuynh296/semi-brand after 2.2.0).

## [0.29.1] - 2026-11-20

### Fixed
- **Kit workflow `brand-pages.yml`**: pull-request checks had the same concurrency group as the Pages deploy, so a pull request and a push to main cancelled each other. Pull requests now get their own group (`/semi-brand update` rewrites the workflow).

## [0.29.0] - 2026-11-20

The WCAG 2.2 AA audit (major and minor issues), and brand kits that check more and update themselves.

### Brand kits (`semi-brand`, `/semi-brand`)
- **More checks in the report**: input edges (`control-line`) ≥ 3:1 in every allowed style and theme (the generator darkens `text-muted` a little when the brand's tinted neutrals would miss it), and Semi's status text (`danger-fg`, `success-fg`, `warning-fg`, `info-fg`) ≥ 4.5:1 on the brand's surfaces. A primary close to the error / success colour now says by how much (hue difference and ΔE).
- **`color.buttonText`** (`auto` · `white` · `dark`, `set buttonText=white`): force the text colour on the main button; the generator then takes the nearest shade that reads with it (an orange brand gets white text on a deeper orange instead of dark text).
- **No logo** is a warning, and `package.json` exports `./dist/logo/*` only when the kit has a logo (`/semi-brand update` removes a dangling export).
- **`semi-brand check` ignores the `@semi/ui` version stamp**: a newer Semi that generates the same colours no longer makes the kit stale.
- **Kit workflows** (added by `/semi-brand update`): `brand-pages.yml` also checks every pull request (Pages only from main); new `semi-update.yml` rebuilds the kit with the newest @semi/ui every Monday and opens a pull request only when the generated kit changes. It needs "Allow GitHub Actions to create and approve pull requests" in the kit repo's settings.
- `/semi-brand update` says that its changes come from Semi, for a CHANGELOG "Từ Semi" section apart from the brand's own changes.

### Added
- **Token `control-line`** (`border-control-line`, `hover:border-control-line-hover`): the edge of an input you type in or tick, ≥ 3:1 on every surface in every style (WCAG 1.4.11). `border-line` stays for cards, tables and frames.
- **`SEGMENT_ON`** (`@semi/ui/styles`): the chosen segment of a segmented control, the tonal fill plus an inset `control-line` ring.

### Fixed
- **`warning-fg` in the light theme** is `amber-800` (amber-700 was 4.35:1 on Soft and 4.40:1 on Sharp fields).
- **Inputs, select field, combobox, `InputGroup`, `InputOTP`, chat composer, `SearchInput`, `Checkbox`, `RadioGroup`**: their edge was 1.2–1.9:1 against the page (the 8–20% `line` tokens); it now uses `control-line`.
- **Invalid `Input`, `Textarea`, select field, combobox, `InputOTP`, `DatePicker`**: the error edge was the faint `danger-border` (about 1.5:1); it is `border-danger-fg` now. An invalid select field shows it too (it had none).
- **Focus in forced colours** (Windows high contrast): ring focus (box-shadow) vanished and nothing replaced it; `base.css` now draws a system-colour outline on `:focus-visible`, in any app that imports it.
- **`DatePicker`** trigger, **`CustomSelect`** `toolbar` / `inline` triggers and the **`Tabs`** panel showed no keyboard focus; they show the focus ring.
- **`CustomSelect`**: with `aria-label`, the button is named by the label followed by the value it shows ("Sắp xếp: Mới nhất"; a label that already holds the value is kept as is), so speech users can say what they see (WCAG 2.5.3; the label used to replace the value).
- **`Pills`, `Toggle`, pill `Tabs`, theme / style switcher**: the chosen segment was told apart only by a 1.1:1 fill (and a 2.6:1 text colour in dark); it now has an inset ring (`SEGMENT_ON`).

### Changed
- **Font sizes in rem**: `tokens.css` emits the type scale in rem (14px → 0.875rem; `tokens.json` stays in px), so text follows the browser's default font size (WCAG 1.4.4). At the default 16px nothing moves.
- **Focused inputs** (`FIELD_INPUT`, `FIELD_TEXTAREA`, select field, combobox, `InputGroup`, composer, `SearchInput`) add a 1px focus ring to the focus border: a 2px indicator like `FOCUS_RING`. `SearchInput` showed only a faint border on focus.

### Added (minor fixes)
- **`ToastHost` `label`**: names the notification region when a page section has the same name.
- **`Breadcrumb` `aria-label`**: for a page with two trails.

### Fixed (minor)
- **`Terminal`**: the output is a named `region` (an `aria-label` on a bare `<pre>` was not announced).
- **Docs**: example titles are h2, so a preview holding a page h1 no longer breaks the heading order.

### Migration
- Tests that find a `CustomSelect` by its exact `aria-label` (`getByRole("button", { name: "Sắp xếp", exact: true })`) now see `: <value>` after the label: match the start or drop `exact`.

## [0.28.1] - 2026-11-20

The medium-severity accessibility issues of the audit.

### Fixed
- **`Slider`**: two range thumbs on the same value can be dragged apart in either direction (the press picks the side the pointer is on, or the way the drag goes); a cancelled touch or a lost pointer capture ends the drag (no leaked listeners); each range thumb has its own name ("Khoảng giá từ" / "Khoảng giá đến", locale `rangeLow` / `rangeHigh`).
- **`Tabs`**: when `value` matches no enabled tab, the first enabled tab is in the tab order (the tab list was unreachable by keyboard); ids and focus lookups use the position, so keys with spaces or quotes work.
- **`Switch`**: `className` applies when the switch has no label or description.
- **`Tooltip`**: the pointer can move onto the tooltip without it closing (WCAG 1.4.13 hoverable; it was `pointer-events-none`).
- **`ContextMenu`**: the focusable area is a named group (`aria-label` = the menu's label, `aria-keyshortcuts="Shift+F10"`) instead of an unnamed tab stop.
- **`Menubar`**: closing no longer moves focus inside a state updater (ran twice under StrictMode).
- **`NavigationMenu`**: the open panel closes when focus leaves the nav; the phone menu button has `aria-expanded` / `aria-haspopup`.
- **`Carousel`**: dots and the last page follow the one slide shown on phones (all slides reachable); arrow keys move slides only when the track itself has focus (no longer hijacked in a field inside a slide); slides off screen are `inert`.
- **`Modal`, `NumPadPopup`**: the backdrop closes only on a click that starts and ends on it, not after a drag from inside the panel (new `useBackdropClose` in `a11y.ts`, internal).
- **Scroll lock** (`useScrollLock`): the scrollbar's width is added as body padding, so the page does not shift when a dialog opens.
- **`Toast`**: `role="alert"` / `role="status"` cards were nested in a polite live region (read twice or not at all, depending on the screen reader). The stack is now a labelled region ("Thông báo", locale `notifications`) holding two sibling live regions, danger toasts assertive and the rest polite; the cards carry no live role. Danger toasts sit above the others.
- **`DatePicker`**: the calendar opens in a portal (no longer clipped by a scrolling panel or a modal) and closes when focus leaves it; it reads `Field` (id, label + date as its name, `aria-describedby`, invalid) and takes `disabled` and `id`.

### Added
- Browser test for the above (modal drag-out, hoverable tooltip, toast announcer, inert slides, equal slider thumbs).

### Migration
- No code migration. A test that found a toast with `getByRole("alert")` / `getByRole("status")` should find it by text or inside `getByRole("region", { name: "Thông báo" })`.

## [0.28.0] - 2026-11-20

Roomier, readable defaults: agents kept building cramped panels (cards with `p-2`, sentences in 12px, text against the edges). The causes were in Semi itself: a 13px body size with most examples in 12px, sizes without a line height, padding left to the call site with no rule, and spacing as bare numbers. This release fixes those and the high-severity accessibility issues of the audit.

### Changed
- **Body text is 14px** (`text-ui` 13 → 14px, `text-ui-lg` 14 → 15px) at regular and airy density; `data-density="compact"` keeps 13 / 14px. `text-label` (12px) is now documented for short marks only (field labels, buttons, times, counts); running text, table cells and list rows are `text-ui` (`docs/DESIGN_SYSTEM.md` §1, `plugin/rules/AGENTS.md`).
- **Every type size carries its line height** (`--text-*--line-height`: 1.5 for 11–16px, 1.25 for 18px and up), so `text-ui` no longer inherits a `leading-tight` from a title around it; `leading-*` still overrides.
- **`<Card>` pads itself**: new `padding` prop, `"card"` (`p-card`, default) · `"panel"` (`p-card sm:p-panel`) · `"none"`. A padding class in `className` (`p-*`, `px-*`, `py-*`) replaces it, so existing `<Card className="p-4">` keeps its padding.
- `HERO` is `p-card sm:p-panel`, `KpiCard` uses `p-card` (featured `sm:p-panel`), `PageSkeleton` cards `p-card gap-stack`; examples use the Card default.
- `lint/codemod.mjs` maps `text-[14px]` to `text-ui` (was `text-ui-lg`).

### Added
- **Semantic spacing tokens** (`tokens.json` "space", multiples of the density unit): `p-card` 16px · `p-panel` 24px · `gap-stack` 12px · `gap-group` 16px · `gap-section` 24px at regular density (90% compact, 115% airy, also on a `data-density` wrapper). Any spacing utility works (`px-card`, `space-y-stack`).
- **`card-padding`** lint rule (ratchet): a `<Card>`, `CARD` or `CARD_HOVER` with `p-0.5` … `p-2.5`. `p-0` / `padding="none"` (media to the edge) and rows inside a card are not flagged.
- `examples/modal/layers` (a select and a popover inside a modal); browser tests for Escape / Tab with layers in a Modal and for Calendar `min`.

### Security
- Dev dependency `next` 16.4.3 → 16.4.6 (GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8, moderate; `use cache` only, which Semi does not use). `@semi/ui` keeps its `next >=16` peer range.

### Fixed
- **Escape and Tab inside dialogs**: the focus trap of `Modal`, `Drawer`, `CommandDialog`, `confirmDialog`, `TaskHost` and `NumPadPopup` caught Escape in the capture phase and stopped it, so Escape in an open `CustomSelect`, `CustomCombobox`, `Popover`, `HoverCard`, `Menu`, `DatePicker`, `Tooltip`, `NavigationMenu` or `SearchInput` inside a dialog closed the whole dialog (and `CommandDialog` could not clear its query). The trap now listens in the bubble phase and skips a key a layer already handled (`preventDefault()` / `stopPropagation()`): the first Escape closes the layer, the next the dialog. Tab inside a layer portaled to `body` (Popover, Menu, select list) was pulled back into the dialog; the trap now leaves such layers alone (they carry `data-semi-floating`) and sends focus that leaves the dialog anywhere else back to the last focused element in it. Tab is still trapped in the capture phase, so a widget that stops its own key events cannot let focus out. `ChatPanel` handles Escape on its own panel in both placements (over a modal its portal wrapper stops key events from reaching the modal).
- **Triggers keep their own props**: `Popover`, `HoverCard`, `Tooltip` and `Menu` cloned the trigger with their own `ref`, `onClick`, `onFocus`, `onBlur`, `onKeyDown`…, silently dropping the app's. They now compose: the trigger's ref is set too, its handler runs first and `preventDefault()` there skips ours, `aria-describedby` ids are joined.
- **`Calendar` / `DatePicker` hydration and min / max**: "today" and the initial month came from `new Date()` during render, so a server in another time zone could render a different day or month than the browser (hydration mismatch). Today is now read on the client only (`useSyncExternalStore`); a calendar without a value renders its month after hydration. Arrow keys, PageUp / PageDown and the month buttons could move focus onto a disabled day outside `min` / `max`, losing keyboard focus; the focused day is now kept inside the range and a month button with no selectable day is disabled. A `value` changed from outside now shows its month.
- **`CustomSelect`**: the highlighted option is exposed with `aria-activedescendant` (options have ids, are out of the tab order), Home / End move to the first / last enabled option, typing jumps to a matching option (and picks it while closed, like a native select), and Tab closes the list.
- **`CustomCombobox`**: the list closes when focus leaves the input, renders in a portal with fixed positioning (no longer clipped by a scrolling panel or a modal), and `aria-controls` is set only while the list exists.
- **`Toast`**: auto-dismiss also pauses while keyboard focus is inside the toast, not only on hover (WCAG 2.2.1: keyboard users can reach the action).
- **`Pagination`**: page buttons' accessible name comes from the locale (`pageN`, vi "Trang 3" / en "Page 3") instead of hard-coded Vietnamese.

### Migration
- No code migration. Body text grows 1px (13 → 14px) and text gets a paired line height, so check dense screens (tables, toolbars, sidebars with fixed widths). A dense tool keeps 13px with `data-density="compact"` (also 10% tighter spacing; set it in `semi-lint.json` `"density"` and on `<html>`).
- `<Card>` without a padding class now has `p-card`: a card with an edge-to-edge image or table needs `padding="none"`.
- Replace `p-4` / `gap-3` / `gap-4` / `gap-5` on cards and sections with `p-card` / `gap-stack` / `gap-group` / `gap-section` when you touch them; `card-padding` flags only cards tighter than `p-card`.


## [0.27.0] - 2026-11-18

### Added
- **`QRCode`** (#37): a scannable QR code as one SVG (`value`, `size` default 200 / min 120, `errorCorrection` default `"M"`, required `label` as the accessible name, `caption` with tabular numbers, `copyValue` = copy button (`true` copies `value`, a string copies that), `onError`, and a `print` variant without frame or button: pure black on white with `shape-rendering="crispEdges"`). A value too long for the level does not throw: the box shows a message (locale `qrFailed`) and `onError` gets the error. Modules are always black on white with a 4-module quiet zone in both themes, a documented exception inside the component (scanners need dark-on-light; `src/QRCode.tsx` is skipped for `inline-svg-path` (the modules are one `<path>`) and `no-literal-palette` (print variant `bg-white text-black`) in `semi-lint.json`, each with its reason, semi-lint stays clean). No `logo` prop in v1 (a centre mark covers modules and forces level H). Copy says "copied" only when the browser accepted it (no clipboard API on plain http). Doc `examples/qr-code/` (VietQR payment, receipt, the four levels, UTF-8 text, too long). `test:ui` (`tests/qr-code.spec.ts`) decodes the rendered SVG back to a VietQR EMVCo payload at every level with `jsqr`, in both themes, print, too long and copy.
  - **Encoder: `uqr` 0.1.3**, pinned exact, the package's only runtime dependency. Chosen over `qrcode-generator`: MIT, zero dependencies, ESM with types, no network or DOM, tree-shakable, byte / alphanumeric / numeric modes picked automatically, all four EC levels, and it returns the module matrix so the component draws its own SVG (one path of horizontal runs). Supply-chain check of 0.1.3 (published 2026-04, 2.5 years after 0.1.2): same publisher (antfu, maintainer of the unjs repo) as earlier versions, no install scripts, the shipped `dist` has no imports, network or `eval`, and 0.1.2 → 0.1.3 is JSDoc / types / SVG renderer changes in the tagged `unjs/uqr` source (the build was not re-run to compare bytes). Test decoder `jsqr` (dev dependency only).

### Fixed
- **`/semi-sync` never downgrades `@semi/ui`; a brand `semi` range allows later 0.x minors** (#32): a brand kit declaring `^0.24.0` (a caret pins the minor in 0.x) made `/semi-sync` move an app on 0.26.0 back to 0.24.x. `update.mjs` now keeps the installed version when the brand's range resolves below it, and warns with the brand range and the fix (`/semi-brand update`, release, `/semi-sync` again). `semi-brand` create / update write `">=X.Y.0 <1.0.0"` ("this minor or later, below the next major"); `satisfies` / `resolveTargetSpec` accept `>=X.Y[.Z] <A.B[.C]` next to `^`, `~` and exact versions, and `brand.json` validation accepts it. A new major is still capped. Existing `^0.x` kits keep working (they just cap, and never downgrade). `docs/BRANDS.md` describes the form. Migration note: a brand repo should run `/semi-brand update` once to switch to the new range.

### Migration
- No code migration. Brand kits may now declare the `semi` range as `">=X.Y.0 <1.0.0"` (any later 0.x minor), and `semi-brand` writes that form. Existing `^0.x` ranges keep working (they cap, and never downgrade); run `/semi-brand update` once in a brand repo to switch to the new range.
- New dependency: `uqr` (0.1.3, exact) comes with `@semi/ui` for `QRCode`; no action needed.

## [0.26.1] - 2026-11-18

### Fixed
- **`FileDrop` names its hidden file input** (#33): the input had no accessible name, so `getByLabel(<field label>)` in a test reached only the button and `setInputFiles` failed (apps patched `aria-label` onto the input from outside). The input is now named like the button (`aria-labelledby` the button, which carries the `Field` label or the title), and FileDrop takes an `aria-label` prop that names both and wins. No behaviour change for keyboard or screen readers: the input stays hidden, the button the only control. `Field` now gives its label element an id (`labelId` in `useField()`). Doc `examples/file-drop/` shows the test locator (`getByLabel(label).and(locator('input[type=file]'))`).
- **`/semi-sync` in pnpm / yarn workspaces** (#31): `detectPkgManager` only looked for a lockfile in the app folder, so an app in a workspace (lockfile at the root, `workspace:*` dependencies) got `npm install`, which failed with `EUNSUPPORTEDPROTOCOL` and changed nothing. It now walks up to the workspace root (stops at the git root); `packageManager` in a `package.json` wins, then `pnpm-lock.yaml` / `pnpm-workspace.yaml` / `yarn.lock` / `package-lock.json`. Installs run in the app folder with the manager's own syntax (`pnpm add`, `yarn add`, `npm install --install-links`). When an install fails, `update.mjs` names the command and where to run it by hand, leaves `package.json` as it was and still writes the AGENTS.md rules block; changelog, migrations and `tsc` wait for the next run.

## [0.26.0] - 2026-11-18

### Added
- **`FileDrop`** (#22): file picker + dropzone with a row per file (name, size, `Progress` while uploading, done check, error + Retry, Remove). Controlled `items`; accepted files go to `onAdd`, files failing `accept` / `maxSize` to `onReject` (the app decides how to show them). Works inside `Field` (id, `aria-describedby`, invalid), built-in strings from `SemiLocaleProvider` (`fileDropTitle`, `fileUploading`, `fileDone`, `fileFailed`, `fileRetry`, `fileRemove`, `filesAdded`, `filesRejected`, `fileUploadFailed`; vi + en), polite live region for added / rejected / failed files. `onReject` reasons: `type`, `size`, `directory` (dropped folder), `duplicate` (same name + size as an item or earlier in the batch), `multiple` (extra files while `multiple` is off). Drag handlers sit on a wrapper, so a drop on a disabled FileDrop is cancelled instead of opening the file. Also exports `matchesAccept`, `formatFileSize`, `classifyFiles`. No new tokens. Doc `examples/file-drop/`.

### Fixed
- **CI** (#28): `.github/workflows/check.yml` was invalid YAML since 0.19.0 (an unquoted `: ` in a step name), so the `Check` workflow failed at 0 s and PRs got no checks. The name is quoted, and `npm run check:workflows` (`scripts/check-workflows.mjs`, part of `npm run check`) now parses every workflow file.

## [0.25.0] - 2026-11-16

### Added
- **`BootLoader`** (`Skeleton.tsx`, #24): the boot / session gate before the app knows its layout, once in the root or route-group layout. A full-viewport `bg-app` with a centred `Spinner` (`text-muted`), no visible text (`label` for screen readers, locale `booting`), shown after `delay` (300 ms) and stopped under reduced motion. It is the only centred spinner (§13b). Prefer a server-side session check, which needs no gate.
- **Shell lint rules** (#23, #24), ratchet (existing hits go into the baseline with `--update-baseline`):
  - `app-shell-in-page`: a `page.tsx` that renders `AppShell` or imports a module that does (relative and `@/` imports).
  - `shell-gate`: an early `return <PageSkeleton | Skeleton… | Loading` in a file that renders `AppShell`.
  - `shell-nav-href`: `AppShell onSelect` whose handler calls `router.push` / `router.replace`.
  - `boot-loader-place`: `BootLoader` in a page, a `loading.tsx` or inside `<AppShell>` content.
- App shell doc examples `boot-gate` (session gate in the layout) and `loading` (route `loading.tsx` inside the shell).

### Changed
- **`AppShell` / `MobileTabBar`**: items (and sub-items, the logo link and the phone menu sheet) with `href` render `next/link` even when `onSelect` is set; `onSelect` then fires as a click notification. Before, any `onSelect` turned every item into a button. Apps that `router.push` the same href in `onSelect` keep working (a no-op second navigation); remove that call and let the link route.

### Migration
- No code migration. Run `npx semi-lint`: if the new rules report hits, either fix them (move `AppShell` into `app/(app)/layout.tsx`, add a `loading.tsx`, use `BootLoader` for the session gate, put `href` on page items) or run `npx semi-lint --update-baseline` to record them as debt.

## [0.24.0] - 2026-11-14

### Added
- **Icons on sidebar sub-items**: `ShellNavChild.icon` (optional, grey `w-3.5 h-3.5`, same for all sub-items of a parent). The sub-menu example uses them.
- **Icons `mail` and `inbox`** (197 icons): the email area / mailbox menu item, and the inbox folder; catalog entries, `docs/ICONS.md` rows.

### Changed
- **`icon-alias`**: `mail` is a real icon now, no longer an alias of `send`. `email` and `envelope` point to `mail`, `incoming` to `inbox`; `message` still points to `send`. Code that used `<Icon name="send" />` for an email *area* may switch to `mail`; nothing breaks.

## [0.23.0] - 2026-11-14

### Added
- **Title on the toolbar row (`SubpageToolbar` `title`)**: the page title (a string becomes the `h1` in `PageTitle` type; a `PageTabsTitle` works too) shares the sticky row with the filters and actions, and the page drops its `PageTitle`. Narrow screens wrap filters and actions below the title. The two-row layout (`PageTitle` + `SubpageToolbar`) is unchanged and stays the default. Doc example `examples/subpage-toolbar/title-row.tsx`.

## [0.22.0] - 2026-11-14

### Added
- **Sidebar sub-menus (`AppShell`)**: `ShellNavItem.children` (`ShellNavChild`: `id`, `label`, `href`), one level. Closed by default; the sub-items open under their parent while the parent or one of them is `activeId`, and close when another item is chosen. Text only (no icon, dot or count), indented on a `border-divider` guide; the parent shows a chevron, `aria-expanded`, and stays `text-contrast` while a sub-item is active. `MobileTabBar` and the phone menu sheet highlight the parent of an active sub-item.
- **`useAppShell()`**: `{ submenuVisible }`, false in the `w-14` rail, below `lg` and on phones, where sub-items are not shown; pages use it to show their own picker. Doc example `examples/app-shell/submenu.tsx`.

## [0.21.2] - 2026-11-07

### Added
- **Sidebar menu item icons in desktop mode (`AppShell`)**:
  - Sidebar navigation items now render their configured `icon` alongside the label in desktop expanded mode (`lg:w-52`), with clean `gap-2.5` alignment and consistent theme coloring.
  - In collapsed rail mode (`w-14` / `md`), the icon is rendered centered in the tab button (with fallback to short label initials if an item does not specify an icon).
  - Shimmer loading state in `AppShell` now includes the icon placeholder shape matching the rendered items.

## [0.21.1] - 2026-11-05

### Added
- **Semi Calibrated Brand Color Styling & Monochrome Override (`Icon`, `IconTile`)**:
  - Added `BRAND_PATHS` and `BRAND_TONES` in `src/Icon.tsx` for all 21 Vietnamese brand/platform icons, rendering signature multi-path / dual-color stroke paths with Semi calibrated tone tokens (`text-tone-orange`, `text-tone-pink`, `text-tone-sky`, `text-tone-amber`, `text-tone-indigo`, `text-tone-cyan`, `text-tone-teal`, `text-tone-emerald`, `text-tone-blue`, `text-tone-rose`, and `text-contrast`).
  - Seamlessly respects dark and light themes without garish neon hex colors or glow shadows, fully meeting WCAG AA contrast standards.
  - Automatic monochrome override: passing explicit `text-*` classes (e.g. `<Icon name="shopee" className="text-muted" />`) renders single-path monochrome SVG.
  - Automatic tone resolution in `<IconTile name="shopee" />` without needing manual `tone="orange"` prop.
  - Expanded `TILE_TONES`, `TONE_TEXT`, and `TONE_DOT` across all 12 Semi tone families.
  - Updated Foundations Storybook showcase to render brand-calibrated tones in the icon catalogue grid and inspector.

## [0.21.0] - 2026-11-05

### Added
- **Vietnam E-Commerce Platforms & Major Brands Icon Pack (`@semi/ui`)**: Added 21 new Lucide-standard 24×24 stroke icons expanding the system to 195 icons total:
  - **Sàn Thương mại điện tử (E-Commerce Marketplaces):** `shopee` (Shopee / Shopee Mall / ShopeePay), `lazada` (Lazada / LazMall), `tiki` (Tiki / TikiNOW / Tiki Trading), `sendo` (Sendo / SenMall / Sendo Farm), `tiktok` (TikTok Shop / TikTok), `chotot` (Chợ Tốt / Sàn rao vặt TMĐT).
  - **Ví điện tử & Cổng thanh toán (Fintech & Payments):** `momo` (Ví điện tử MoMo), `zalopay` (Ví điện tử ZaloPay), `vnpay` (Cổng thanh toán & VNPAY-QR quốc dân), `viettelMoney` (Viettel Money / ViettelPay).
  - **Giao vận & Logistics (Delivery & Couriers):** `ghtk` (Giao Hàng Tiết Kiệm), `ghn` (Giao Hàng Nhanh - GHN Express), `viettelPost` (Bưu chính Viettel Post), `vnpost` (Bưu điện Việt Nam / Vietnam Post), `grab` (Grab / GrabExpress / GrabFood / GrabMart), `be` (Be Group / beDelivery / beFood).
  - **Tập đoàn & Thương hiệu lớn (Major Brands & Tech):** `zalo` (Ứng dụng Zalo / Zalo OA), `fpt` (Tập đoàn công nghệ FPT), `viettel` (Tập đoàn Viễn thông Viettel), `vinfast` (VinFast xe điện & Tập đoàn Vingroup), `tgdd` (Chuỗi bán lẻ Thế Giới Di Động / MWG / Điện Máy Xanh).
- **Brand Domain & Registry (`brand`):**
  - Added `"brand"` domain to `IconDomain` and `"brand"` category to `IconMeta`.
  - Registered full semantic metadata, usage guidelines, and search keywords for all 21 icons in `src/iconCatalog.ts`.
  - Added `"Brands & TMĐT VN"` filter tab in `app/foundations/page.tsx` for easy visual discovery.
- **Aliases & `semi-lint` Enforcement:**
  - Added 40+ canonical aliases to `ICON_ALIASES` (`shopee_mall`, `momo_pay`, `vnpay_qr`, `vtpost`, `tikivn`, `lazmall`, `giao_hang_tiet_kiem`, `thegioididong`, `dienmayxanh`, etc.).
  - Added `icon-alias` HARD check in `semi-lint` preventing direct use of platform aliases.
  - Added unit test in `lint/test/semi-lint.test.mjs`.

## [0.20.0] - 2026-11-02

Ecosystem proposals from the 3D Noobs Studio adoption (#10, #15–#19).

### Added
- **`TaskHost` + `startTask()`** (#19): one blocking overlay for a job the user must wait for (upload, import, firmware update, payment step): label, current step, progress (0–100 or indeterminate), elapsed time, optional Cancel / Escape (`onCancel`). `task.update()`, `task.done()`, `task.fail(title)` (closes and shows a danger toast). One task at a time: a new one replaces the old, whose handle then does nothing. An `alertdialog` with `aria-busy`, focus trapped. Mount `<TaskHost />` beside `<ToastHost />` / `<ConfirmHost />`; `/semi-new-app` and the `/semi-check` layout snippet now do. Doc: `examples/task-host/`.
- **`aria-label` / `aria-labelledby` on `Switch` and `Checkbox`** (#17) for controls whose label is elsewhere (a card title, a table row); `label` wins; in development a control without any name logs a warning. **On touch screens both get a 44 × 44 px hit area** (`any-pointer-coarse:` pseudo-element), the visible size and layout unchanged. `DataTable` row boxes use `aria-label`.
- `Progress` takes `aria-label` when the bar has no string `label`.
- **Icons** (#18): `redo`, `eraser`, `viewReset` (reset the camera / view; not "fit to selection", that is `focus`), `flipHorizontal` (mirror / swap sides), with catalog entries and aliases (`repeat_action`, `erase`, `clear_paint`, `view_reset`, `iso`, `home_view`, `flip`, `mirror`, `swap_side`, `flip_side`, `flipSide`), which `icon-alias` flags.
- **`primary-fill` lint rule** (ratchet, #15): solid `bg-primary-<n>` / `border-primary-<n>` in any variant. The brand colour sits on one step of the scale, so `bg-primary-500` turns pale or off-brand with a brand kit: fills use `bg-accent hover:bg-accent-hover text-on-accent`, borders `border-accent-line` / `border-focus`; `primary-*` stays for charts and illustrations (`skip` those files). The codemod rewrites `bg-primary-400…600` → `bg-accent` (hover → `bg-accent-hover`, `text-white` → `text-on-accent`) only when the class list has `text-white` / `text-on-accent`, and reports the rest.
- **`skip` with a reason** (#16): `"skip": { "literal-colour-value": { "lib/scenePalette.ts": "data colours: 3D scene" } }` for `literal-colour-value`, `inline-svg-path` and `no-literal-palette` (illustrations, data palettes, partner logos). A reason is required (semi-lint exits 2 otherwise); the array form still works. The `/semi-check` audit lists each file ("Minh hoạ / màu dữ liệu") and the codemod leaves files skipped for `no-literal-palette`.

### Changed
- **Dark surfaces separate more** (#10): `panel` `#202226`, `field` `#272a2f`, `raised` `#31343a`, `text-muted` `#9ba1aa`, `line` white 12%, `line-hover` white 20% (app → panel 1.17:1, was 1.06; `text-muted` 4.8:1 on raised). Soft and Sharp get the same panel / field / raised lightness on their own hues (so a brand fill keeps 3:1 against every page). Light theme unchanged. Brand kits get it with `/semi-brand update`.
- The docs no longer teach `bg-primary-500 text-white` (power toggle, running dot, progress bar): `bg-accent` + `text-on-accent`.

### Fixed
- Lint / audit false positives (#16): `loading-text` skips progress step labels (`label`, a `fraction` / `value` option) and text inside `role="status"` / `role="progressbar"`; `narrow-container` skips dialogs and drawers (`MODAL_PANEL`, `Modal`, `Drawer`, `role="dialog"`); `font-mono` is allowed on and inside `<code>`, `<pre>`, `CodeBlock`, `Terminal` and `textarea` / `contentEditable` editors. The audit's `duplicates` check skips a file that imports the `@semi/ui` component it is named like (and no longer skips one that only imports something else); `subpage-toolbar` only asks list / grid pages, not tool pages with `AppHeader` and a canvas.

### Migration
- Nothing to run. `primary-fill` is a new ratchet rule at 0 per file: run `/semi-check` (its codemod fixes the fills under white text), fix the rest by hand, or record the debt with `npx semi-lint --update-baseline`; chart / illustration files go under `skip`.
- Add `<TaskHost />` to the root layout to use `startTask()`. Brand kits: `/semi-brand update` for the new dark surfaces.

## [0.19.1] - 2026-11-02

`/semi-check` fixes from the first adoption of a large dark app.

### Fixed
- **The token codemod could delete source code** (#11). It deduplicated and re-joined every string it rewrote, so a "string" the tokenizer misread (code between two quotes in a big file) lost its repeated words, and real strings broke: `viewBox="0 0 24 24"` → `"0 24"`, SVG paths, `transition` values, UI text. Now a string changes only when every token is a Tailwind class, token for token (spacing, line breaks and order stay, nothing is deduplicated); `viewBox` / `d` / `points` / `style` values and tagged templates (`glsl`, `css`, `sql`, `/* glsl */`) are never touched. Before writing, a file is parsed with the app's own `typescript`; a result that no longer parses is not written. Skipped strings and refused files are listed. `tokens --dry-run` prints the counts and writes nothing.
- **A dark app was detected as light** (#12): `foundation` printed `defaultTheme="light"` and the codemod mapped greys for a light app. One detector (`detectTheme`) now reads what the page paints: `defaultTheme` / `data-theme` / `class="dark"` in the root layout, the `html` / `body` background and surface variables in the CSS (dark-mode blocks ignored), and only then the class count. When the signals disagree or are missing it says so and stops; `/semi-check` asks the user and passes `--theme dark|light` (both phases). In a dark app, solid `bg-white` / `bg-black` / `text-black` are reported for a person instead of turning into `bg-panel` / `bg-canvas`.
- **`foundation` reported undone steps as done** (#13). A failed install puts `package.json` back (with `@semi/ui` listed but not installed, the next run skipped the install and never created the lint baseline), prints what to do and stops with exit 1. `transpilePackages` is added to configs exported as a function (`const base: NextConfig = {…}` or its `return {…}`), a named variable or `defineConfig({…})`; a shape it cannot edit is in the final **Làm tay** list instead of a "done" line. `<html>` is found outside comments and strings (`data-style` went into a comment that mentioned `<html>`). `--verify` creates the baseline when it is missing.
- **The audit counted copies and other repositories** (#14): folders git ignores and nested repositories (their own `.git`) are left out with one "Bỏ qua …" line each; `--include <dir>` checks one on purpose.
- `semi-lint`: class rules no longer fire inside SVG / style values or tagged templates (`rounded` in a GLSL shader, part of #16).

### Migration
- Nothing to run. Apps that already ran the 0.19.0 codemod: check its diff for shortened `viewBox` / `d` / `transition` strings and collapsed lines (`git diff --stat` shows files that lost many lines).

## [0.19.0] - 2026-11-02

### Added
- **`brief.sample` in `brand.json`:** the product's main list, 2–5 real items, its main figure and a proof figure. The brand book's sample screens, the agent rules (`AGENTS.brand.md` "Sample content", `semi_brand brief`) and every new app's first screen use it instead of generic shop data; the build warns when a brief has no sample. `/semi-brand` drafts it from the brief.
- **`/semi-new-app --kind tool|app|store|landing`** (the "what kind of product" question): it now sets the first screen too, not only density. Tool / app: `AppShell` with the brand's logo, the main figure (`KpiCard featured`) and the sample items. Store / landing: a top bar, a hero with the tagline, the proof figure and the sample items. **`--theme light|dark|system`**: the default theme is the product's (tool / app follow the system, store / landing start light); it was always dark. Metadata comes from the brief.
- **`CLAUDE.md` with `@AGENTS.md`** in every app `/semi-new-app`, `/semi-check` (foundation) and `/semi-sync` touch: Claude Code reads `CLAUDE.md`, so the Semi and brand rules in `AGENTS.md` did not reach it. `/semi-check` reports a missing link (`agent-rules`, phase 1).
- **The brand book is checked in the browser:** `npm run build:brand-book` builds the sample kit `tests/fixtures/brand.json` from this checkout and `npm run test:ui` checks it (contrast AA in every allowed style and both themes, axe, nothing spilling at 320 / 375 / 768 / 1280px, the sample in the screens). CI runs it.
- `/semi-brand` looks at the brand book (375 and 1280px, both themes) before handing it over.

### Changed
- **The brand book is one dashboard:** the *Thương hiệu* and *Ứng dụng* pages moved from their own top-bar frame into the Semi docs shell the UI kit and component pages use (menu on the left, tab bar on phones with Thương hiệu, Ứng dụng, Kit, UI). Same URLs and content; theme and style switch at the foot of the menu. Kits get it with `/semi-brand update`.
- **The Semi rules block in an app's `AGENTS.md` is 4 KB instead of 15 KB:** the hard rules and how to ask the MCP tools; component lists and constants are left to `semi_search` / `semi_docs`, which answer from the installed version. `/semi-sync` refreshes it.
- Callouts and status surfaces in the docs and rules use the themed tokens (`bg-warning-bg border-warning-border text-warning-fg`), not `bg-amber-500/10` with a `text-amber-600 dark:text-amber-400` pair.
- The colour warning prints the real ratio ("màu gốc chỉ 2.94:1 với nền trang, cần 3:1") instead of "gần như trùng với nền trang".

### Fixed
- Brand book, Ứng dụng › Dashboard at 320px: the order rows no longer spill out of the card (code hidden, amount on one line, badge inside); KPI cards keep their own height.
- Brand book, Ứng dụng › landing page: the proof is a real figure on the brand tint, without the internal "Ví dụ: …" caption.
- Brand book, colours: the grid has as many columns as swatches; "Đổi màu" shows a recoloured name when the brand has no logo yet.
- `DonutChart`: arc coordinates are rounded, so the server and the browser render the same path (React reported a hydration mismatch on every page with a donut).
- `plugin/hooks.json` is kept identical to `plugin/hooks/hooks.json` by `npm run sync:vendor`.

### Removed
- The command aliases `/semi-init`, `/semi-audit`, `/semi-fix` and `/semi-update` (renamed in 0.16.0): use `/semi-new-app`, `/semi-check` and `/semi-sync`.

### Migration
- Nothing to run in apps. `/semi-sync` writes the shorter rules block and `CLAUDE.md`. Brand kits: `/semi-brand update`, then add `brief.sample` to `brand.json` (the build reminds you).

## [0.18.0] - 2026-11-02

First tagged release of the 0.17.0 work (0.17.0 was never tagged; the version files said 0.17.0 under the v0.18.0 tag, so the plugin kept showing 0.17.0).

### Added
- **Product density and type scale** (a product's choice, not the brand's: one brand has a dense dashboard and a roomy store): `data-density="compact|airy"` and `data-type-scale="contrast"` on `<html>` (or any wrapper), mirrored as `"density"` / `"typeScale"` in `semi-lint.json`. Density scales Tailwind's spacing unit, so every padding and gap follows; the contrast scale enlarges KPI figures and headings. `/semi-new-app` asks the kind of product and sets them (`--density`, `--type-scale`); `style.mjs` changes them later. The brand book's Ứng dụng tab shows each sample screen with its usual pick.
- **Style tokens read by every component:** `--spacing` (Tailwind's spacing unit, so the product's density scales every padding and gap), `font-title` (title and figure weight) and `font-figure` (the font of big numbers). Sharp now has bold titles and figures in its display font; Flat and Soft look as before.
- **`KpiCard featured`:** the screen's main number, larger and two columns wide.
- **Composition rules against the generic AI screen** (`DESIGN_SYSTEM.md` §19, QUICK_REF, the plugin rules, `semi-ui` and AGENTS.brand.md): one main block per screen, neutral icons, proof instead of three feature cards, icons only where they help, sample text from the brief, varied rhythm. `/semi-check` reviews key screens against them (phase 4b).
- **`decorative-icon-tones` lint rule** (ratchet): three or more `iconTone` colours in one file.

### Changed
- **`KpiCard` icons are neutral by default** (`iconTone` was `sky`): give a colour only when it means a status. The figure uses `font-figure font-title`. Pass `iconTone` explicitly to keep a coloured icon.
- `PageTitle` / `PageTabsTitle` use `font-title` (semibold unless the style says otherwise).
- The `dashboard` block, the KPI and sparkline examples and the brand book's sample screens lead with one featured number, without decorative icon colours; the brand book's landing page shows a big figure and a customer quote instead of three feature cards.
- **The `/semi-new-app` starter is the brand's first screen**, not a 3D-printer dashboard: a hero with the brand's tagline, product line and button text from the brand kit, and an empty state in its voice.
- `brand-override` also blocks `--brand-*`, `--spacing`, `--density-spacing`, `--font-figure` and `--font-weight-title` in an app with a brand kit.
- `brand.json` `density`, `typography` and `motif` (from a pre-release draft) are ignored with a warning.
- `ScrollArea` is focusable from the server HTML on (it measured only after hydration, so an early keyboard user or a11y check met a scrolling region without a tab stop).
- `DESIGN_SYSTEM.md` §2b now describes brand kits (it still told products to override `primary-*` in their CSS).

### Migration
- Nothing to run. Apps keep regular density and the even type scale until they set `data-density` / `data-type-scale`. Apps that relied on the old sky default of `KpiCard`'s icon pass `iconTone="sky"`.

## [0.16.0] - 2026-11-01

### Changed
- **The brand kit preview is a brand book**, not a copy of the docs site. Three tabs: *Thương hiệu* (cover with logo, name, tagline and personality on the brand colour; who the brand is for; logo on both backgrounds with clear space, the mark at 16–48px and what not to do: stretch, recolour, rotate, add effects, busy backgrounds; colours by role and the share of a screen each takes; type specimens; voice with do / don't and its texts on real components in light and dark; imagery), *Ứng dụng* (dashboard, phone app, landing page and email, light and dark, texts from the voice; the landing hero follows the accent use) and *UI kit* (scales, button and text shades with their distance from the brand colour, type scale, contrast table, downloads of `brand.css`, `brand.json` and the logos, and every component page in the Semi docs shell). The brand book pages have a top bar instead of the component sidebar.
- Without a logo version for dark backgrounds, the preview's top bar and sample screens show the mark (if any) next to the name on dark instead of a logo that may not read.

- **Four commands, one per place:** `/semi-brand` (brand repo), `/semi-new-app` (empty folder; was `/semi-init`, now asks the brand first and offers only its allowed styles), `/semi-check` (existing app: checks against the brand and Semi, writes `semi-check.md`, asks, then fixes phase by phase; merges `/semi-audit` and `/semi-fix`), `/semi-sync` (new brand kit or Semi release; was `/semi-update`). The old names stay one release as aliases that point to the new ones. The report file is `semi-check.md` (was `semi-audit.md`). README, plugin descriptions and docs now present Semi as a brand builder.
- **`/semi-style` is removed as a command.** Style is a brand decision (`/semi-brand` sets the allowed styles), an app picks one at `/semi-init`, and a later switch is asked in words: the `semi-ui` skill carries the steps and the script moved to `skills/semi-init/scripts/style.mjs`. No app changes.
- **`semi-ui` runs on its own** whenever the agent builds UI in a Semi app (its description says so); docs and the plugin no longer list `/semi-ui` as a command to type. It now asks `semi_brand` before writing UI text or placing colour.

### Added
- `brief.tagline` in `brand.json` (one line, ≤ 90 characters; `set tagline=…`): on the cover, the landing page and in BRAND.md.
- `color.mix` in `dist/brand.json`: the rough share of a screen for neutrals, surfaces, the primary and the secondary colour, from the accent use (restrained 80 / 15 / 5 %, balanced 70 / 20 / 10, expressive 55 / 25 / 20). BRAND.md and AGENTS.brand.md state it.

## [0.15.0] - 2026-11-01

### Added
- **Accent state tokens:** `ring-focus` / `border-focus` (focus ring, focused field), `bg-accent-subtle` / `bg-accent-subtle-hover` (selected, active), `border-accent-line` (selected border). They follow `accent-fg`, so they reach 3:1 in both themes for every brand. Every component and class constant uses them (`FOCUS_RING`, `FIELD_INPUT`, `CARD_ACTIVE`, Pagination, Combobox, Calendar, Chat, AppShell …).
- **`accent-state-token` lint rule** (ratchet): `ring-primary-500/50`, `bg-primary-500/15`, `border-primary-500/30` and other brand-scale state colours. `/semi-fix` rewrites them.
- **Brand kits:** `bg-secondary-solid` + `text-on-secondary` for a secondary colour; `brandStep` and `fidelity` (button shade and its ΔE from the brand colour, per theme) in `dist/brand.json`; the report checks the hover of the button and the focus ring (3:1), and lists "nút tách khỏi nền" as a soft finding.
- **Brand guideline, not only colours:** `brand.json` takes an optional `brief` (product, audience, personality), `logo` (full / dark / mark files, clear space, min width), `voice` (tone friendly · neutral · formal, how to address the user, emoji, do / don't, example texts), `color` (how much accent, secondary colour role) and `imagery`. The build validates them, copies logos to `dist/logo/`, and writes a full `BRAND.md` (brief, logo, colour use, voice with Semi's shared microcopy rules, imagery) and an `AGENTS.brand.md` of decisions (one primary per area, accent use, secondary role, logo import, voice and example texts), not only prohibitions. Missing voice is a warning.
- **Kit preview:** a sample product screen in light and dark side by side (texts from the voice), the logo on both backgrounds with its clear space, the voice and colour-use sections.
- **`semi_brand` MCP tool / `semi brand [voice|color|logo|brief|tokens]`:** agents in a product ask the installed brand kit how to write, use colour and place the logo.
- **`/semi-brand`:** starts from a brief and recommends from it; asks for the logo, voice and colour use; `brand.mjs colors <logo.svg>` lists a logo's colours; `create --from <brand.json>`; new `set` keys (`tone`, `address`, `we`, `emoji`, `accent`, `secondaryRole`, `product`, `audience`, `personality`, `logo`, `logoDark`, `mark`, `imagery`). A new logo is a major kit change, voice / colour use / brief a minor one.
- Docs site *Brand preview*: the button's distance from the brand colour per theme, a "Cần" column and soft findings in the contrast table; "Copy lệnh cho agent" (a `/semi-brand` prompt with the brand.json) replaces the command that had a `<plugin>` placeholder.

### Changed
- **Brand scales sit on a fixed lightness ladder** (`LADDER` in `brand/generate.mjs`) with the brand colour unchanged on its nearest shade (`brandStep`), instead of `500 = the brand colour`. Very dark and very light brands no longer get identical shades or invisible hovers. `--color-primary` / `--color-secondary` are still the exact brand colours.
- **The button keeps the brand colour where it can:** per theme, the AA shade (white or dark text) closest to the brand colour; lifted only when it would blend into the page. E.g. `#FF6B00` light theme: `#df5d00` with dark text (was `#a14100` with white); `#1E3A8A` dark theme: `#5670aa` (was `#7d93c3`). Coloured text (`accent-fg`) is the closest shade that reads on every surface and on `bg-accent-subtle`.
- The focus ring is now solid `accent-fg` (was `primary-500` at 50%): more visible in Semi's own green too.

### Migration
- `0.15.0-accent-state-tokens` rewrites brand-scale state classes in apps (`ring-primary-500/50` → `ring-focus`, `bg-primary-500/15` → `bg-accent-subtle`, `border-primary-500/30` → `border-accent-line`, `focus:border-primary-*` → `border-focus`). Solid fills (`bg-primary-500`) are left alone: if one carries text, use `bg-accent` + `text-on-accent`.
- Brand kits: run `/semi-brand update`. Most brands' shades and buttons change, so it reports a **major** change; products then get it through `/semi-update` (asked first).

## [0.14.0] - 2026-11-01

### Removed (breaking)
- **Palettes are gone.** Each style used to have three colour variants of its neutrals (`data-palette`, `"palette"` in `semi-lint.json`, `palettes` in `tokens/styles.json`, `--palette` in `/semi-init`, `/semi-fix`, `/semi-style`, `palette.<style>` in `/semi-brand`). No app or brand kit used them, and the design system pages no longer offered them. Now each style has its own neutrals (`semantic` in `tokens/styles/<id>.json`): Flat the shared neutrals, Soft the former default Sand, Sharp the former default Ink. Looks by default do not change.
- **Migration** `0.14.0-remove-palette` (run by `/semi-update`): removes `"palette"` from `semi-lint.json` and `data-palette` from `<html>`. `/semi-audit` reports a leftover palette until `/semi-fix` cleans it up.
- **Apps on a non-default palette change look.** The migration cannot keep their colours. Before updating one, ask the user whether to keep the look: the palette's values are in git history (`git show v0.13.3:tokens/styles/soft.json`, `…/sharp.json`, `…/flat.json`). Brand kits: remove `"palettes"` from `brand.json` (a warning until then); `"neutral": "preset"` keeps the style's own neutrals.
- The docs site has no palette picker (since 0.13.3) and its style tests cover the three styles.

## [0.13.3] - 2026-11-01

### Changed
- **Docs site: no palette picker.** The footer offers the styles (Flat, Soft, Sharp) only; the palette options (Graphite, Slate, Olive…) are gone from the design system pages. Apps can still set `data-palette` as before (`docs/STYLES.md`).
- **The Foundations page is generated from `tokens/`.** `scripts/foundations.mjs` writes `site/foundations.generated.ts` (surfaces and text per theme, the type scale, each style's radius, control height, card border and fonts) during `build:manifest`. The page no longer repeats hand-typed hex values, so it cannot drift from the tokens.

## [0.13.2] - 2026-11-01

### Changed
- **Tinted brands: surfaces are nearly neutral.** `brand/generate.mjs` tinted canvas, app, panel, field and raised with the primary's hue at chroma 0.010 (Flat), which read as a colour cast over large areas. Surfaces now take 0.003 (Flat), 0.004 (Soft) and 0.002 (Sharp), near Tailwind slate-50 (≈ 0.003) and Radix slate-1 (≈ 0.002). Text and borders keep their tint. A brand with `"neutral": "tinted"` gets new neutrals after `/semi-brand update` in the brand repo, then `/semi-update` in each product.

## [0.13.1] - 2026-11-01

### Changed
- **Side menu items have no icon** (`AppShell`): the item shows its label alone. In the narrow rail (collapsed, or below `lg`) the item shows its `shortLabel`, or the initials of its label, in place of the icon; the full label is the tooltip. Group headers keep their icon, and the phone tab bar and "Menu" sheet keep theirs.

### Fixed
- **The side menu no longer resets when a page is opened.** Every page mounted its own shell, so the menu remounted on each navigation and its scroll position went back to the top. The docs shell (`SiteShell`) now lives in the root layout and stays mounted across pages.

## [0.13.0] - 2026-11-01

### Added
- **`semi` CLI for agents** (`npx semi …`, no dependencies, answers from the installed package): `search` (a need in Vietnamese or English → ranked docs with why), `docs`, `example`, `props`, `list`, `blocks`, `add <block>` (writes a page into the app, never overwrites without `--force`); `--json` everywhere. Guide: `docs/AGENT_TOOLS.md`.
- **MCP server** (`semi mcp`): tools `semi_search`, `semi_docs`, `semi_example`, `semi_props`, `semi_list`, `semi_block`. The `semi-design` plugin registers it as `semi` and starts the project's own `@semi/ui` (monorepos included); without it the server explains how to add Semi.
- **Blocks** (new docs group): `dashboard`, `list-page`, `settings-page` and `agent-run` (now titled *Agent workspace*, moved from AI).
- **`/semi-ui` skill:** build a page or component from Semi docs and blocks (search → docs → example → compose → semi-lint).
- `llms.txt`, the consumer rules block and the README point agents to the CLI / MCP first.

### Fixed
- `components.json` summaries no longer end with the comment's closing `*/`.

## [0.12.0] - 2026-11-01

### Added
- **AI agent parts, each with a doc page:** `Reasoning` (open while it streams, folds to “Đã suy luận trong N giây”), `ToolCall` (status badge, input / output as JSON, error), `Sources` + `Citation` (numbered links that match), `TaskList` (plan with step marks and progress, running step `aria-current`), `ActionConfirmation` (human-in-the-loop approve / reject; the outcome stays in the log), `Terminal` (streamed command output that follows the end, exit code, copy; ANSI codes stripped), `FileTree` (keyboard tree with added / modified / deleted marks), `ContextMeter` (context window ring, amber from 80%, red from 95%). Types `ToolCallStatus`, `Source`, `TaskStep`, `TaskStatus`, `FileNode`.
- **Agent run** doc page: one full agent turn composed from the parts, to copy.
- `examples/list.json` lists each doc's `components`.
- Locale strings for the agent parts (`reasoning`, `reasoned`, `toolStatus`, `toolInput`, `toolOutput`, `sources`, `source`, `taskStatus`, `taskProgress`, `approve`, `reject`, `approved`, `rejected`, `exitCode`, `fileChange`, `contextUsage`, `contextDetail`).

### Fixed
- Charts redraw after switching back from the table view (the size observer followed the old element).
- Docs: a pattern page with no component of its own shows no empty import line.

## [0.11.0] - 2026-11-01

### Added
- **Charts in SVG, no library:** `BarChart` (grouped or `stacked`), `LineChart` (optional `area`), `DonutChart`, `Sparkline`. Series use the new `chart-1…8` colour tokens (fixed order, colour-blind checked in light and dark); legend for 2+ series, hover and keyboard tooltip (←/→, Home, End), and a table view on every chart. Types `ChartSeries`, `DonutSlice`.
- **More components, each with a doc page and examples:** `InputOTP` (one real input: paste and SMS autofill work), `Carousel` (scroll-snap, buttons, dots, arrow keys, no auto-play), `ResizablePanels` (keyboard handles, sizes can be remembered), `AspectRatio`, `NavigationMenu` (website header with link panels; a sheet on phones), `Menubar` (Tệp · Sửa · Xem, ARIA menubar), `CodeBlock` (copy button, file name), `Prose` (long-form text styles), `Item` + `ItemGroup` (list rows).
- Docs pages for Chart, Input OTP, Carousel, Resizable panels, Aspect ratio, Navigation menu, Menubar, Typography, Code block and Item.
- Locale strings `tableView`, `chartView`, `slide`, `prevSlide`, `nextSlide`, `goToSlide`, `resize`, `oneTimeCode`.

### Changed
- The docs site's `CodeBlock` (`@semi/ui/site`) is now the public `CodeBlock`.

## [0.10.0] - 2026-11-01

### Added
- **18 new pieces, no external libraries, each with a doc page and examples:** `Separator`, `Kbd`, `Breadcrumb` (collapses past `maxItems`), `ButtonGroup`, `InputGroup` (prefix / unit / button), `Toggle` + `ToggleGroup` (single = radio group, multiple = toolbar), `Collapsible`, `Accordion` (single / multiple, arrow keys), `Popover` (non-modal dialog), `HoverCard`, `ContextMenu` (right-click, long-press, Menu key / Shift+F10), `Command` + `CommandDialog` + `useHotkey` (⌘K palette; matching ignores Vietnamese marks: `normalizeSearch`, `filterCommands`), `Slider` (one thumb or `range`), `Calendar` (single / range, full grid keyboard), `ScrollArea` (edge lines, thin scrollbar, keyboard focusable), `DataTable` (sort with aria-sort, search, select + bulk actions, paging, loading and empty states).
- `Drawer side="top"` (a sheet from the top); `MenuItem.shortcut`.
- Locale strings for the new parts (`weekdaysShort`, `monthYear`, `command*`, `selectAll`, `selectRow`, `selectedCount`, `sortBy`, `showHidden`, `value`).

### Changed
- `DatePicker` uses `Calendar`: arrow / PageUp / PageDown keys in the grid, focus returns to the button, month and weekday names from the locale (no hard-coded Vietnamese).
- `Menu` and `ContextMenu` share one panel (same keyboard and look).
- The docs site mounts `ToastHost` and `ConfirmHost` once in its layout, like an app; examples no longer render their own hosts.

### Fixed
- Docs: `Pills` and `SearchInput` accessibility notes now describe what they really do.

## [0.9.0] - 2026-11-01

### Added
- **Component docs, agent first:** every component has a doc in `examples/<id>/` (`meta.json`: description, when to use, what to use instead, accessibility; one file per example, imports from `@semi/ui` only). `npm run build:manifest` generates the API tables from the TypeScript types (types, defaults, required props, TSDoc), `docs/components/<id>.md` for agents (shipped in the package and served at `/docs/components/<id>.md`), `docs/components/README.md` and the registry the docs site renders. `components.json` links each component to its page (`doc`); `llms.txt` lists every page. `check:manifest` fails when a component has no doc or an example imports a missing export; `typecheck` covers every example. Guide: `docs/COMPONENT_DOCS.md`.
- **New docs site** (replaces the Storybook pages, same URL, Semi's own look): introduction, component index with a live example of each, one page per component (Preview / Code per example, import line, API, accessibility, "Copy page" markdown), foundations, brand preview. The docs UI ships as `@semi/ui/site` (`DocsShell`, `ComponentPage`, `ComponentIndex`, `ExampleBlock`, `CodeBlock`).
- **Brand kit previews show every component:** the kit's preview site renders the same docs pages in the brand's colours (overview + all component pages).
- `semi-lint.json` `"ignore"`: path prefixes not scanned (generated files).

### Fixed
- `sr-only` text no longer stretches the document (a required `Field` in a long page let the whole page scroll past the shell).
- `DatePicker` and `ChatModelPicker` buttons: the accessible name now contains the visible value (WCAG 2.5.3).
- `external-link` lint: `<ExternalLink href="https://…">` (the fix itself) is no longer flagged.
- Brand preview: the menu marks the page you are on (it was stuck on the first section).

## [0.8.1] - 2026-11-01

### Fixed
- `/semi-brand update` and `/semi-update` install `@semi/ui` by name (`npm install @semi/ui@<tag>`): a bare `npm install` kept the commit `package-lock.json` already had for the git dependency, so a kit or app stayed on the old release while `package.json` named the new tag. Both now stop with a message when the installed version is not the one asked for.

## [0.8.0] - 2026-11-01

### Added
- **Brand kits get their own preview site:** `semi-brand preview` serves it locally (http://localhost:4600, live while the brand is adjusted) and `semi-brand site` exports it statically (`SEMI_BRAND_BASE_PATH` for GitHub Pages). It renders the brand with real `@semi/ui` components (colours, type, controls, cards, tables, contrast report; theme and allowed styles switchable); the template ships in `@semi/ui` (`brand/preview`), so `/semi-brand update` brings newer previews. `/semi-brand create` (and `update` for older kits) adds Next.js to the kit, `.preview/` to `.gitignore` and `.github/workflows/brand-pages.yml`, which builds and publishes the preview on GitHub Pages at every push; `brand.mjs pages` turns Pages on. `semi-brand storybook` keeps the Semi Storybook link (the old `preview`).

## [0.7.0] - 2026-11-01

### Added
- **Brand kits:** Semi is now a multi-brand kit: Semi core → a brand kit per brand (its own repo) → products. `brand.json` holds the few choices (primary, optional secondary, neutrals tinted from the primary or a style preset, allowed styles, fonts); `@semi/ui/brand` (`generateBrand`, OKLCH, no dependencies) derives the 50–900 scales, the accent / on-accent / accent-fg shades of both themes and the neutrals of every allowed style, choosing the first shades that reach WCAG AA. `semi-brand build | check | preview` (new bin) writes `dist/brand.css`, `dist/brand.json`, `BRAND.md` and `AGENTS.brand.md`.
- **`/semi-brand`:** creates a kit (`create`), changes its choices (`set`, with the change level), `/semi-brand update` regenerates it for a newer `@semi/ui`, `bump` versions it. Products: `/semi-init --brand <spec>`, `/semi-fix foundation --brand`, `/semi-audit` checks the kit is installed and wired (`brand`), its styles and fonts; `/semi-update` updates the kit first (asks before a major one, `--accept-major`) and keeps `@semi/ui` inside the kit's `"semi"` range; `/semi-style` offers only the brand's styles. `semi-lint` `brand-override` (hard, apps with a brand) blocks local `--color-primary-*`, `--semi-*` and font tokens in CSS.
- **Storybook "Brand preview":** pick the choices and see the brand on every page (also from the `#brand=` link `semi-brand preview` prints), with the contrast report, `brand.json` and the create command to copy. Playwright covers it in both themes.
- **`docs/BRANDS.md`:** the step-by-step guide (3D Noobs → its Manager app) and which command to use when.
- **Palettes:** every style has three colour variants of its neutrals (both themes), set with `data-palette` next to `data-style` and `"palette"` in `semi-lint.json` (the first is the default, written as no palette): Flat = Graphite · Slate · Olive, Soft = Sand · Blush · Sage, Sharp = Ink · Paper · Mono. **Sharp's default is now Ink** (off-black / off-white, softer lines); the old pure black and white is the Mono palette. `/semi-init` / `/semi-fix foundation` / `/semi-style` take `--palette`; `/semi-style --palette <id>` recolours the current style; `/semi-audit` checks the palette against the layout. Storybook has a palette switch; Playwright runs contrast for every style × palette × theme.
- **Styles go beyond shape:** a style now also sets the neutral colours of both themes (`semantic` in `tokens/styles/<id>.json`), the fonts (`font-sans`, `font-display`, plus the `fonts` an app loads with `next/font`), the card border (`border-card`, used by `CARD` / `HERO` / `SHELL_ASIDE`) and control sizes (`h-control` 34px, `h-field` 36px in Flat). Flat is unchanged; **Soft** = warm neutrals, Plus Jakarta Sans, borderless lifted cards, 40 / 44px controls; **Sharp** = pure black / white, Space Grotesk, 2px borders, 36 / 40px controls. `/semi-init` writes the style's fonts; `/semi-audit` reports fonts the layout does not load (`style-fonts`); `/semi-fix` and `/semi-style` print the `next/font` lines. The codemod maps `h-[34px]` / `w-[34px]` → `h-control` / `w-control`. Playwright runs contrast and phone layout for every style in both themes; the Storybook loads every style's fonts.
- **Sharp style:** square corners (chip 2px, everything else 0) and a hard 4px offset shadow under cards (theme's strong line colour), for bold editorial screens.
- **Styles:** the shape of the UI is now a style an app picks once (`<html data-style>` + `"style"` in `semi-lint.json`): **Flat** (default, unchanged look) and **Soft** (radii 6 · 12 · 20 · 24px, soft resting card shadow). Style tokens `rounded-chip` · `rounded-control` · `rounded-card` · `rounded-panel` and `shadow-card` (in `CARD`, `HERO`, `SHELL_ASIDE`); sources `tokens/styles/<id>.json`, generated list `tokens/styles.json` (`@semi/ui/styles.json`, also in `components.json`), guide `docs/STYLES.md`. Storybook has a Flat / Soft switch; Playwright checks Soft before paint and its contrast in both themes.
- **`/semi-style`:** shows or switches an app's style. `/semi-init --style`, `/semi-fix foundation --style` (asked with the other decisions); `/semi-audit` reports a missing or unapplied style in phase 1; `/semi-update` warns when the app's style left the release.
- **`radius-token` (ratchet):** `rounded`, `rounded-sm/md/lg/xl/2xl`, `rounded-[Npx]` do not follow the style; the token codemod maps them (`lg` → `control`, `xl` → `card`, `2xl` → `panel`, `sm` / `md` / bare → `chip`) and `shadow-sm/md` → `shadow-card` (it used to drop them).
- **Docs ↔ code checks (`check:manifest`):** fails when a usage snippet in `app/usage.ts` imports a name `@semi/ui` does not export, when a Storybook section and its usage entry do not match, or when a component / hook is not named in `docs/DESIGN_SYSTEM.md`.
- **Maintainer guide:** "Change checklist" in `AGENTS.md` (what to update with each kind of change); `CLAUDE.md` loads it for Claude Code.
- **`/semi-fix`:** fixes what `/semi-audit` found, phase by phase from `semi-audit.md`: **foundation** (`fix.mjs foundation`: installs `@semi/ui` keeping Next / Tailwind, `transpilePackages`, Semi CSS, `semi-lint.json` + baseline, `AGENTS.md`; prints the layout providers with a `defaultTheme` matching the app's current theme; screenshots before / after), **tokens** (`fix.mjs tokens [--only dir]`), **hand fixes**, **structure** (asked up front: fix, or keep in `semi-lint.json` `"keep"`). `--verify` re-audits, runs the app's own `semi-lint` / `tsc` and deletes `semi-audit.md` once clean.
- **Release migrations:** `migrations/<version>-<id>.mjs` (shipped in the package, contract in `migrations/README.md`, helpers `renameExport` / `renameProp`); `/semi-update` runs the ones between the app's old and new version.
- **`audit.mjs --ci`:** summary only, exit 1 while issues are left (a periodic check in an app's CI).

### Changed
- **Every component and class constant** uses the style tokens instead of `rounded-lg/xl/2xl` (pixel-identical in Flat, checked on every Storybook page, both themes, desktop and phone).
- **Migration:** the `rounded-md` HARD rule is now part of `radius-token` (ratchet). App code keeps working; run `/semi-audit` → `/semi-fix` (token phase) so its own radii follow the style.
- **Commands, one job each:** `/semi-init` only creates a new app (an existing folder is refused, nothing changed); an existing app, with or without `@semi/ui`, adopts Semi with `/semi-audit` → `/semi-fix`; `/semi-update` installs the latest tag, prints the CHANGELOG of the skipped releases, runs their migrations and `tsc` (no audit, no refactor).
- **`/semi-audit`:** short Vietnamese summary (one table with each app's phase, the next command, issues grouped at the bottom) and every issue with `file:line` in `semi-audit.md`, by phase (foundation → tokens → hand fixes → structure). It changes no source file, reads the app's `semi-lint.json` (`scan`, `skip`, `disable`, new `keep`) and deletes an old report when nothing is found.
- **Fewer false issues:** `AppHeader` counts as a Semi frame; only list pages (rendering a `.map`) need a `SubpageToolbar`; a local component counts as a duplicate only when it defines its own component without building on `@semi/ui`.
- **Plugin scripts** run the app's own `semi-lint` / `tsc` (`node_modules/.bin`), never a same-named package fetched by `npx`. Setup steps live in `semi-init/scripts/setup.mjs`, shared by init, fix and update; `wireNextConfig` also handles `export default {…}` and `module.exports = {…}`.
- **`semi-lint` `scan()`** also returns every ratchet hit (`hits`), so the audit lists each line.

### Fixed
- `/semi-init` replaces create-next-app's sample `globals.css` (body Arial, `--font-sans`, `--background`), which overrode Semi's fonts and surfaces in every new app.
- `DESIGN_SYSTEM.md` now describes `Spinner`, `useField`, `useDialog` / `useFocusTrap` / `useScrollLock` and `useAnchoredPosition`.
- CI runs on Node 24 (the manifest script imports `app/usage.ts` with Node's type stripping).

## [0.6.0] - 2026-10-31

### Added
- **AI chat (`Chat.tsx`, extracted from 3D Noobs Studio and rebuilt on tokens):** `AIChat` (ready-made), `ChatPanel` (side panel, `workspace` / `screen` placement, resizable, iOS keyboard inset), `ChatView`, `ChatList` (stick-to-bottom while at the bottom, "jump to latest", one announcement per finished answer), `ChatComposer` (auto-grow, Enter / Shift+Enter, IME-safe, stop, `toolbar` slot), `UserMessage`, `AssistantMessage`, `ChatAnswer`, `ChatError` (retry), `ChatThinking`, `ChatIntro`, `ChatSuggestion(s)`, `ChatAvatar`, `ChatCopyButton`, `ChatModelPicker` (provider → model → effort chips, as in Studio), `CHAT_ROW`, `CHAT_CHIP`, `CHAT_PICK_CHIP`, `ChatItem`. Locale strings `chat*`, `copy`, `copied`.
- **Storybook for agents:** `llms.txt` at the Storybook root (every page and section with when-to-use + copy-ready code), `llms-full.txt` (+ all docs), and `components.json`, `QUICK_REF.md`, `DESIGN_SYSTEM.md`, `ICONS.md`, `agent-rules.md`, `tokens.css` served as files; linked from every page's `<head>` and the sidebar. Each page has its own title / description; every section shows its usage code. One source (`app/usage.ts`) for the pages and `llms.txt`, generated by `build-manifest` and checked by `npm run check`.
- **Storybook:** "AI Chat" page (live demo with fake streaming, panel over a Modal, every part). Playwright: contrast + axe in both themes, IME Enter, scroll position while streaming, dialog over modal, phone layout.

### Changed
- **DESIGN_SYSTEM §14b:** AI conversations use the shared chat parts (replaces "chat parts kept in each app").
- **Phones:** `Badge` / `STATUS_PILL` never wrap; table cells stay on one line so a `Table` scrolls sideways on a phone instead of squeezing columns (`TD wrap` for a long-text column); an empty chat starts at the top so the intro shows first.
- **Storybook on phones:** the page column no longer grows to its widest demo (an auto-margin flex item sized to content), section headers stack under 640px, shorter tab-bar labels. Playwright checks that every page fits a 375px screen.

## [0.5.0] - 2026-10-31

### Added
- **Tokens:** type scale `text-caption` 11 · `text-label` 12 · `text-ui` 13 · `text-ui-lg` 14 · `text-title` 15 · `text-title-lg` 16 · `text-kpi` 18 · `text-heading-sm` 20 · `text-heading` 22 · `text-heading-lg` 24 · `text-display` 26; layers `z-sticky` 30 · `z-drawer` 40 · `z-modal` 50 · `z-dialog` 60 · `z-keypad` 70 · `z-popover` 80 · `z-toast` 90 · `z-tooltip` 95; `bg-overlay`; `shadow-overlay`, `shadow-float`; status `bg/border-{danger,success,warning,info}-{bg,border}`, `bg-*-solid`, `text-on-solid`; `ease-out-soft` / `ease-in-soft`; pinned `radius-lg/xl/2xl`.
- **Components:** `Button` + `Spinner`, `Field` + `Input` + `Textarea` (+ `useField`), `Checkbox`, `Switch`, `RadioGroup`, `Tabs`, `Tooltip`, `Menu`, `toast()` / `dismissToast()` + `ToastHost`, `Alert`, `Progress`, `Avatar`, `EmptyState`, `Table` (`THead`, `TBody`, `TR`, `TH`, `TD`), `Drawer`, `SemiLocaleProvider` / `useSemiLocale` (`vi`, `en`), `useDialog` / `useFocusTrap` / `useScrollLock`, `useAnchoredPosition`.
- **Styles:** `BTN_GHOST`, `BTN_SM`, `EMPTY_STATIC`, `cn()`, `FOCUS_RING`, `OVERLAY`. Icon `more`.
- **Tooling:** `lint/classes.mjs` (class-token analysis) and `lint/codemod.mjs` (token codemod) with `node --test` fixtures (`npm test`); `/semi-init --dry-run` writes `semi-codemod-report.md`; `/semi-audit --inventory` writes `semi-migration.json` (per-module debt + coverage %); `components.json` manifest + generated component inventory in `QUICK_REF.md` (`npm run build:manifest`, checked by `npm run check`); Playwright browser checks (`npm run test:ui`) in CI.
- **Storybook:** "Primitives & Forms" and "Layout Patterns" pages; every exported component is shown.

### Changed
- **Library uses the new tokens everywhere:** px text sizes → type scale, `z-[9000]/[10000]/[10001]` → `z-dialog/keypad/popover`, `bg-black/70` → `bg-overlay`, `shadow-2xl` → `shadow-overlay`, status dots and danger buttons → status tokens.
- **Accessibility:** `Modal`, `confirmDialog`, `NumPadPopup` trap focus, lock page scroll and return focus; `Modal` gets `aria-labelledby`, optional `description`, `closeOnBackdrop`; `CustomCombobox` is a WAI-ARIA combobox (↑/↓/Enter/Escape, `aria-activedescendant`); `Pills` sets `aria-pressed`; all shared control classes (`BTN_*`, `ICON_BTN*`, `MODAL_CLOSE`, `CHIP_BASE`, header / viewport controls) show a `focus-visible` ring.
- **UI strings** of every component come from the locale (props still override).
- **`semi-lint`:** colour rules read class tokens from every string literal (and `@apply` in CSS) instead of regex over lines; scans `.js/.jsx/.mjs/.css` too; reports hit lines. New ratchet rules `no-fixed-tone-text`, `literal-colour-value`, `arbitrary-text-size`; `hex-colour-class` covers every colour prefix and `rgb()/hsl()/oklch()`; `legacy-ui-wrapper` points to the new components.
- **`/semi-init` codemod:** token-level, string literals only; collapses light/dark pairs; dark-first mapping; type scale; reports unresolved tokens instead of guessing. Starter layout includes `ToastHost`.
- **`/semi-init`, `/semi-audit`, `/semi-update` skills:** inventory → plan (Foundation / Patterns, one module per PR) → Definition of Done (0 findings per module, both themes checked) → final zero scan.

### Migration
- Existing apps: run `/semi-update`. The new ratchet rules start at 0 for every file; preview fixes with `init.mjs --dry-run`, apply, resolve the reported tokens, then shrink the baseline. Add `<ToastHost />` next to `<ConfirmHost />` if you use `toast()`.

## [0.4.0] - 2026-10-31

### Changed (visible)
- **Light/dark contrast (WCAG AA in both themes):** `BTN_PRIMARY`, `MODAL_BTN_PRIMARY`, `headerPrimary` now use `bg-accent hover:bg-accent-hover text-on-accent` — dark theme: brand green with near-black text (6.6:1, was white at 2.94:1); light theme: `primary-700` with white (6.1:1). Danger buttons, KPI deltas, selected options, active tab, pagination, links, icon tones and `TONAL_SURFACE` use the new themed text tokens instead of fixed `-300/-400` shades.
- **`text-muted`:** `#8b919a` in dark (5.5:1 on panel, was 3.64:1), `#5b6779` in light (5.2:1 on field, was 4.34:1).
- **Focus ring default:** `--default-ring-color` follows `primary-500` instead of Tailwind blue.

### Added
- **Themed semantic tokens:** `bg-accent`, `bg-accent-hover`, `text-on-accent`, `text-accent-fg`, `text-danger-fg`, `text-success-fg`, `text-warning-fg`, `text-info-fg`, `text-tone-<hue>` (purple, violet, indigo, blue, sky, cyan, teal, emerald, amber, orange, rose, pink).
- **`<ThemeScript />` / `themeScript()`:** inline `<head>` script that applies the stored theme before the first paint (no flash of the dark theme for light-mode users). Use with `<html suppressHydrationWarning>` and the same options as `ThemeProvider`. `/semi-init` starter layout includes it.
- **`data-theme="system"`:** follows `prefers-color-scheme` in pure CSS.
- **`<ThemeSwitcher />`:** three-way Sáng · Tối · Hệ thống picker (`showLabels`, `fullWidth`, `labels` for i18n; `radiogroup` semantics). `useTheme()` now also returns `mounted`; `ThemeSwitcher` and `ThemeToggle` show no selection until it is true, so the SSR default never flashes as selected.
- **`monitor` icon** (system theme / desktop) with catalog metadata.
- **Storybook:** theme switcher in the sidebar footer (toggle when collapsed), a "0. Theme" showcase with fixed `data-theme="light"` / `"dark"` previews side by side, live package version and icon count.
- **`<Card>`** (`interactive`, `active`): component form of `CARD` / `CARD_HOVER` / `CARD_ACTIVE`.
- **Maintainer tooling:** `npm run sync:vendor` / `check:vendor` (plugin copies of `semi-lint` + tokens), `npm run bump <version>` / `check:version` (all five manifests incl. `package-lock.json`), both part of `npm run check`; `.github/workflows/check.yml` runs check + build on PRs.

### Fixed
- **ThemeProvider** no longer resets `<html>` to `defaultTheme` on mount before reading the stored theme, and follows OS changes while in `system` mode.
- **Token CSS:** semantic tokens no longer self-reference (`--color-canvas: var(--color-canvas)`); values live in `--semi-*` and utilities read them via `@theme inline`. `--color-*` runtime variables are still defined in every theme scope; `text-text-contrast`-style duplicate utilities are gone.
- **`/semi-audit` used a stale vendored `semi-lint`** (missing Issue #3/#4 rules); it is re-synced, guarded by `check:vendor`, and the audit's literal-palette pattern now comes from `semi-lint` itself.
- **`card-class-override`** now targets the real `<Card>` and catches any `bg-*` / `shadow-*`, including variants (`hover:shadow-lg`).
- **Codemod / audit tonal text:** `/semi-init` maps `text-<hue>-600…900` to `text-tone-<hue>`; `/semi-audit` suggests the same.
- `package-lock.json` version was stuck at 0.2.5.
- **`<Loading>` (all skeleton wrappers)** was not positioned, so its absolute `sr-only` label escaped `AppShell`'s scroll container and made the whole window scroll past the shell; it is now `relative`.

### Migration
- Apps: add `<ThemeScript />` to `<head>` and `suppressHydrationWarning` to `<html>` (see README §3). Apps that override `primary-*` with a dark brand colour should also set `--semi-on-accent: #fff` for the dark theme.

## [0.3.7] - 2026-10-31

### Fixed
- **Gradient Stop Palette Guard Rails (`semi-lint`, Issue #4):**
  - Expanded `no-literal-palette` in `lint/semi-lint.mjs` to detect gradient stop utilities (`from-`, `via-`, `to-`) using physical color literals (`from-white`, `to-slate-900`, etc.).
  - Added warning that Semi Design System enforces Flat UI (no gradients), but if transitional fade masks are kept during migration, stops must use semantic tokens (`from-panel`, `to-transparent`).
- **Semantic Codemod for Fade Overlays (`semi-init`, `init.mjs`):**
  - Added mappings in `runSemanticCodemod` to adapt `(from|via|to)-white` $\rightarrow$ `(from|via|to)-panel`, `(from|via|to)-slate-50` $\rightarrow$ `(from|via|to)-field`, and `(from|via|to)-slate-900` $\rightarrow$ `(from|via|to)-canvas`.
- **Synchronized Palette Audit (`semi-audit`, `audit.mjs`):**
  - Updated `PHYSICAL_RX` and `SEMANTIC_RX` to cover `from-`, `via-`, and `to-` prefixes.

## [0.3.6] - 2026-10-31

### Added
- **Universal Tonal Architecture Across All Components (`@semi/ui`, `@semi/ui/styles`):**
  - Added `TONAL_CONTAINER` and `TONAL_HOVER` to `@semi/ui/styles` (`surfaces.ts`) for consistent styling of chromatic cards, alert banners, callouts, stat widgets, table rows, and interactive buttons.
  - Multi-state theme-matching tokens:
    - Static container: `bg-<color>-500/10 border-<color>-500/20 text-<color>-700 dark:text-<color>-300`
    - Hover state: `hover:bg-<color>-500/15 hover:border-<color>-500/30`
    - Active state: `active:bg-<color>-500/20`
    - Dividers & rings: `divide-<color>-500/20 ring-<color>-500/20`
- **Universal Component Tonal Analysis in `/semi-audit` (`audit.mjs`):**
  - Scans across all component types (cards, banners, callouts, table rows, buttons, badges, chips) and all prefixes (`hover:`, `active:`, `border-`, `divide-`, `ring-`, `text-`).
  - Reports cluster breakdown with both container and hover dual-theme adaptations.
- **Universal Multi-State Tonal Codemod in `/semi-init` (`init.mjs`):**
  - Full automated migration for any component type across static background, hover background, active background, static border, hover border, dividers, rings, and dual-theme high-contrast text.
- **Air-Tight Pastel Surfaces Lint Rule (`semi-lint`):**
  - Expanded `no-solid-pastel-surfaces` in `lint/semi-lint.mjs` to detect all 16 Tailwind chromatic hues across `bg`, `hover:bg`, `active:bg`, `border`, `hover:border`, `divide`, and `ring`.

## [0.3.5] - 2026-10-31

### Added
- **Theme-Matching Tonal Architecture (`@semi/ui`, `@semi/ui/styles`):**
  - Added `SemanticTone` type and `TONAL_SURFACE` constants across 16 chromatic hues (`purple`, `violet`, `indigo`, `blue`, `sky`, `cyan`, `teal`, `emerald`, `green`, `amber`, `yellow`, `orange`, `rose`, `red`, `pink`, `gray`).
  - Added first-class `<Badge tone="..." icon="..." dot>` component in `@semi/ui` for category tags, status pills, and plan labels.
  - Enhanced `<Chip tone="...">` to support theme-matching active chromatic tones.
- **Chromatic Tonal Component Analysis in `/semi-audit` (`audit.mjs`):**
  - Automatically scans and reports chromatic tonal classes (e.g. `bg-purple-50 text-purple-700`, `bg-sky-100 text-sky-800`), grouping by color family with recommended Dual-Theme tone adaptations.
  - Added interactive multiple-choice question for automated tonal adaptation.
- **Theme-Matching Tonal Codemod in `/semi-init` (`init.mjs`):**
  - Automatically adapts legacy solid pastel classes to Semi Dual-Theme matching tones:
    - `bg-<color>-50/100` $\rightarrow$ `bg-<color>-500/10`
    - `border-<color>-100/200/300` $\rightarrow$ `border-<color>-500/20`
    - `text-<color>-600/700/800/900` $\rightarrow$ `text-<color>-700 dark:text-<color>-300`
  - Preserves chromatic color identity (purple stays purple, amber stays amber) while eliminating dark-mode glare and ensuring optimal contrast in both themes.

## [0.3.4] - 2026-10-31

### Added
- **Solid Pastel Surfaces Lint Rule (`semi-lint`):** Added rule `no-solid-pastel-surfaces` (RATCHET) in `lint/semi-lint.mjs` to flag solid chromatic pastel backgrounds and borders (`bg-*-50/100`, `border-*-200`), resolving Issue #3. In Dark Mode (`data-theme="dark"`), solid pastels turn into glaring white/neon rectangular slabs.
- **Tinted Cards & Callouts Guidelines (`docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`):** Documented canonical Semi Bento pattern for tinted cards (neutral `bg-panel border-line` with `<IconTile tone="...">`) and callouts using alpha transparency (`bg-<color>-500/10 border-<color>-500/20`), which automatically blend seamlessly in both dark and light modes.

### Fixed
- **Divider Palette Checks & Codemod (`semi-lint`, `semi-init`):** Expanded `no-literal-palette` to include `divide-` prefix (`divide-slate-100`, `divide-gray-100`, etc.), and added `divide-*` mappings to `runSemanticCodemod` (`divide-divider` and `divide-line`), resolving Issue #2.

## [0.3.3] - 2026-10-31

### Fixed
- **Semantic Codemod in `/semi-init` (`init.mjs`):** Expanded `runSemanticCodemod` to map `border-(?:slate|gray|zinc|neutral|stone)-50` to `border-divider`, resolving Issue #1. In legacy tables and list views, step-50 borders previously went unmigrated and appeared as stark white lines in dark mode. Also generalized all background, text, and border mapping regexes across `slate`, `gray`, `zinc`, `neutral`, and `stone`.

## [0.3.2] - 2026-10-31

### Fixed
- **`/semi-triage` audit (`triage.mjs`):** glow `shadow-[0_0_…]` was never detected; gradient check flagged prose (`up-to-date`, `from-scratch`); dual-theme check matched any word containing "light"/"dark". The audit now scans only the *proposed solution* sections, so legacy code quoted under "Current Workaround" no longer fails a valid proposal. Added hex-class, inline `<path>`, `text-xs/sm`, `uppercase` and missing-template checks, plus `--audit-file` for offline drafts.
- **`/semi-update` (`update.mjs`):** now refreshes the whole managed `semi-design-system` block in consumer `AGENTS.md` from the plugin template (previously only the version stamp changed, so new rules never reached existing projects).

### Changed
- **`/semi-propose`:** must verify the gap first (outdated `@semi/ui` → `/semi-update`; already in docs/exports; app-specific → `UI_EXTENSIONS.md`), search for duplicates (`--search`), self-audit the draft, and get user approval before filing. Scanner reports installed vs latest version and workarounds (inline SVG, native controls) and skips `node_modules`. Fallback writes to the OS temp dir (not the consumer repo) and handles over-long prefilled URLs; labels are dropped and retried if the author cannot set them. `--dry-run` added.
- **`/semi-triage`:** issue content is treated as untrusted input; 5-question analysis (real need, already solvable, generic, compliant minimal API, cost); `NEEDS INFO` verdict; user approval before posting/labelling/closing; close-the-loop step after release. `--ensure-labels`, `--label` filter, `--remove-labels`, closing comment.
- **Always-on rules (`plugin/rules/AGENTS.md`, `semi-ui.md`):** new rule 4 "Gaps go upstream": consumer agents use `/semi-propose` instead of inventing local primitives, mark workarounds `TODO(semi#<issue>)`.
- Repo labels created: `ecosystem-proposal`, `component`, `tokens`, `icons`, `lint`, `triage:accepted|generalized|extension|rejected`, `needs-info`.

## [0.3.1] - 2026-10-31

### Added
- **Ecosystem Collaboration Skills (`/semi-propose` & `/semi-triage`):**
  - **`/semi-propose` (`plugin/skills/semi-propose/`):** Allows AI agents in consumer projects (Auton Platform, IoT, BMCU, 3D Noobs Studio, etc.) to scan project gaps, detect local wrapper components or missing primitives, format standardized feature requests, and publish issues directly to GitHub repo `hoanghuynh296/semi-nextjs-codebase` using GitHub API or prefilled issue URLs.
  - **`/semi-triage` (`plugin/skills/semi-triage/`):** Allows core maintainer agents to list, fetch, and audit proposed issues against Semi Design System constraints (Flat surfaces, Semantic Tokens, Typography, Radii, Bento structures), formulate generalized solutions, assign verdicts (`ACCEPT`, `GENERALIZE`, `WORKAROUND / EXTENSION`, `REJECT`), and post architectural analysis back to GitHub issues.

## [0.3.0] - 2026-10-31

### Added
- **Two-Tier Semantic Tokens Architecture (`tokens/tokens.json`, `tokens/tokens.css`):**
  - Replaced static surface color tokens with dynamic CSS-variable-backed Semantic Tokens:
    - `--color-canvas` (`bg-canvas`): `#0c0d0e` (Dark) / `#f1f5f9` (Light)
    - `--color-app` (`bg-app`): `#121316` (Dark) / `#ffffff` (Light)
    - `--color-panel` (`bg-panel`): `#18191c` (Dark) / `#ffffff` (Light)
    - `--color-field` (`bg-field`): `#1e1f23` (Dark) / `#f1f5f9` (Light)
    - `--color-raised` (`bg-raised`): `#26282e` (Dark) / `#e2e8f0` (Light)
    - `--color-text-contrast` (`text-contrast`): `#ffffff` (Dark) / `#0f172a` (Light)
    - `--color-text-body` (`text-body`): `#d1d5db` (Dark) / `#334155` (Light)
    - `--color-text-muted` (`text-muted`): `#6b7280` (Dark) / `#64748b` (Light)
    - `--color-line` (`border-line`): `rgba(255,255,255,0.08)` (Dark) / `rgba(0,0,0,0.08)` (Light)
    - `--color-line-hover` (`border-line-hover`): `rgba(255,255,255,0.16)` (Dark) / `rgba(0,0,0,0.16)` (Light)
    - `--color-divider` (`border-divider`): `rgba(255,255,255,0.05)` (Dark) / `rgba(0,0,0,0.05)` (Light)
  - Generated compiled CSS utilities and Tailwind 4 `@theme` mappings via updated `scripts/build-tokens.mjs`.
  - Added support for theme switching via `[data-theme="dark"]`, `[data-theme="light"]`, and `.dark` / `.light` class fallbacks.
- **Theme Provider & Switcher Components (`@semi/ui`):**
  - Added `ThemeProvider`, `useTheme()`, and `ThemeToggle` to `@semi/ui`.
  - Added `sun` and `moon` icons to `src/Icon.tsx` and `src/iconCatalog.ts`, bringing total standardized icons to 168.
- **Linter Upgrades (`lint/semi-lint.mjs`):**
  - Added `no-literal-palette` (Ratchet): Banning direct physical classes (`bg-white`, `text-slate-900`, `border-slate-200`, `bg-slate-50`, `bg-gray-800/900`, etc.) in favor of semantic tokens.
  - Added `card-class-override` (Hard): Preventing direct background and shadow overrides on `<Card>`.
  - Retired `input-bg-field` rule as `bg-field` is now the formal semantic token for form fields.
- **Plugin Skill Enhancements (`semi-audit` & `semi-init`):**
  - `/semi-audit`: Added automated scanning for physical Tailwind color classes and calculated `semanticAdoptionRate` with dual-theme health indicators.
  - `/semi-init`: Added automated codemod (`runSemanticCodemod`) mapping legacy classes (`bg-white` -> `bg-panel`, `bg-slate-50` -> `bg-field`, `text-slate-900` -> `text-contrast`, `text-slate-500` -> `text-muted`, `border-slate-200` -> `border-line`, removing drop shadows).
  - `/semi-init`: Eliminated destructive blanket skips (`skip: { ...: ["src/app"] }`) in `semi-lint.json`, recording legacy debt via `--update-baseline` in `semi-lint-baseline.json`.
- **Ecosystem Collaboration Skills (`/semi-propose` & `/semi-triage`):**
  - Added `/semi-propose`: Enables agents in downstream projects to scan unmet requirements, structure standardized GitHub issues, and publish them directly to `hoanghuynh296/semi-nextjs-codebase` via GitHub API or prefilled issue URLs.
  - Added `/semi-triage`: Enables core maintainer agents to list, view, audit rule compliance, and formulate generalized solutions for ecosystem proposals without violating Semi Design System constraints.
- **Documentation:**
  - Added "Dual-Theme & Semantic Tokenization" section in `docs/DESIGN_SYSTEM.md`, updated `docs/QUICK_REF.md`, `docs/DECISIONS.md`, and maintainer guides.

## [0.2.9] - 2026-10-31

### Changed
- **Universal Icon Metadata & Semantic Generalization (`src/iconCatalog.ts`, `docs/ICONS.md`):**
  - Refactored metadata across 76+ icons previously described with narrow, single-domain terminology (such as 3D printing or slicer specifics) into universal, multi-domain definitions suitable for Web, SaaS, Mobile, E-commerce, Dev tools, Cloud/IoT, Media, and 3D applications.
  - Examples:
    - `merge`: Generalized from *"gộp các chi tiết trong viewport 3D"* to *"Hợp nhất các đối tượng, gộp nhánh mã nguồn hoặc liên kết dữ liệu (Merge)"* with multi-purpose examples (Git merge, mesh boolean union, combining datasets).
    - `settings` / `sliders`: Clarified distinction between system configuration vs parameter tuning across web apps, SaaS settings, and IoT devices.
    - `send`: Universalized for message submission, chat dispatch, email sending, or command triggers.
    - `box`: Universalized for inventory boxes, postal parcels, UI bounding boxes, and 3D containers.
    - `code`, `terminal`, `server`, `cpu`, `activity`: Expanded to cover general backend infrastructure, DevOps CI/CD, web development, and system monitoring.
    - `scissors`, `crop`, `resize`, `move`, `rotateCw`, `rotateCcw`, `ruler`, `pipette`, `shapes`: Refactored to represent universal graphic, document, spatial, and UI manipulation tools.
    - `file*` & `folder*` family: Generalized across office documents, spreadsheets, source files, archives, and cloud drives.
  - Maintained 3D and hardware capabilities as valid secondary use cases without restricting primary semantics.
  - Synchronized documentation tables in `docs/ICONS.md` (§2.2–§2.10 and §3 Aliases) with the updated agnostic taxonomy.
- **Storybook Shell:** Updated version badge to `Semi UI v0.2.9` (166 Icons).

## [0.2.8] - 2026-10-31

### Added
- **Media, Documents & Playback Comprehensive Expansion (`@semi/ui`):** Added 22 new Lucide-standard 24×24 stroke icons expanding the system to 166 icons total (Media & Files now contains 31 icons):
  - **Documents & File Management:** `fileText` (documents / README / PDF), `fileCode` (source code / G-code / macro script), `fileArchive` (ZIP / TAR / 7Z archive / project package), `fileCheck` (validated file / integrity checksum pass), `filePlus` (create file / new preset), `fileSpreadsheet` (Excel / CSV export / inventory sheet), `folderPlus` (new directory / project folder), `folderOpen` (open folder / active directory), `paperclip` (file attachments / inquiry attachment).
  - **Audio & Sound:** `volume2` (speaker audio / buzzer level), `volumeX` (mute / silent mode / buzzer off), `headphones` (headphones / audio output), `mic` (microphone / voice control / audio notes).
  - **Video & Timelapse:** `video` (live webcam stream RTSP / timelapse video), `videoOff` (disable camera / privacy mode), `film` (timelapse reel / animation series).
  - **Playback & Editing:** `skipBack` (previous frame / previous layer), `skipForward` (next frame / next layer), `repeat` (loop video / repeat print cycle), `fastForward` (speed up simulation 2x/4x), `rewind` (rewind simulation timeline), `crop` (crop thumbnail / photo frame).
- **Aliases & AI Retrieval:** Added 50+ canonical aliases to `ICON_ALIASES` and `semi-lint` HARD rules (`document`, `doc`, `pdf`, `gcode`, `zip`, `archive`, `excel`, `csv`, `attach`, `sound`, `speaker`, `volume`, `mute`, `silent`, `webcam`, `timelapse`, `movie`, `loop`, `crop_image`, etc.).
- **Storybook Shell:** Updated to `166 Icons` dynamic count across Foundations & Component showcases.

## [0.2.7] - 2026-10-31

### Added
- **3D Slicing, CAD & Hardware Comprehensive Expansion (`@semi/ui`):** Added 21 new Lucide-standard 24×24 stroke icons expanding the system to 144 icons total:
  - **3D Slicing & CAD Tools:** `move` (XYZ coordinates / model translation / jog motor), `rotateCw` (90° clockwise rotation / plate rotate), `rotateCcw` (counter-clockwise rotation), `crosshair` (homing G28 / probe point / auto bed leveling), `ruler` (measurement / dimension / distance tool), `magnet` (lay on face / snap to bed / magnetic PEI plate), `pipette` (filament color picker / AMS slot color), `shapes` (primitive shapes / modifiers / negative volume / support blocker), `focus` (center on object / zoom to fit / camera focus), `orbit` (3D camera orbit / viewport free rotation).
  - **Hardware, Devices & Maintenance:** `thermometer` (nozzle / bed / chamber temp °C), `wrench` (mechanical maintenance / nozzle change / belt tensioning), `hammer` (hardware workshop / fabrication / DIY tools), `circuitBoard` (mainboard / MCU / toolhead CAN bus PCB), `usb` (USB drive / serial UART printing), `bluetooth` (Bluetooth BLE printer pairing / sensors), `hardDrive` (SD / MicroSD / eMMC storage for G-codes), `cable` (stepper motor wires / FPC cable / CAN bus harness), `battery` (UPS power backup / portable device battery), `scanLine` (Micro Lidar scan / first layer inspection / 3D scan), `shieldAlert` (safety enclosure door sensor / thermal runaway protection).
- **Aliases & AI Retrieval:** Added 40+ canonical aliases to `ICON_ALIASES` and `semi-lint` HARD rules (`temp`, `temperature`, `spanner`, `maintenance`, `jog`, `rotate`, `homing`, `origin`, `abl`, `measure`, `snap`, `lay_on_face`, `eyedropper`, `color_picker`, `primitives`, `zoom_to_fit`, `orbit_camera`, `sd_card`, `motherboard`, `pcb`, `wire`, `lidar`, `safety_alert`, etc.).
- **Storybook Shell:** Updated to `144 Icons` dynamic count across Foundations & Component showcases.

## [0.2.6] - 2026-10-31

### Added
- **E-Commerce Comprehensive Icon Expansion (`@semi/ui`):** Added 19 new Lucide-standard 24×24 stroke icons expanding the E-Commerce domain to 31 icons and total system icons to 123:
  - **Orders & Logistics:** `package` (order parcel / package), `packageOpen` (unboxing / packing / returns), `packageX` (cancelled order / failed delivery), `packagePlus` (new order / restock), `clipboardList` (order list / manifest / inventory), `mapPin` (shipping address / pickup location).
  - **Payments & Trust:** `banknote` (cash on delivery / COD / paper money), `landmark` (bank transfer / bank account), `qrCode` (VietQR / QR payment), `barcode` (SKU barcode / barcode scanner), `badgeCheck` (verified mall / official shop / trust badge).
  - **Marketing, Engagement & Loyalty:** `gift` (gift / present / bonus reward), `heart` (wishlist / favorite / like), `star` (ratings / reviews / stars), `badgePercent` (flash sale / deep discount / hot deal), `flame` (best seller / hot trending), `megaphone` (marketing campaigns / promotional broadcasts), `award` (loyalty program / membership tier / VIP), `calculator` (cost calculator / filament print pricing).
- **Interactive Storybook App (`app/`):**
  - Updated icon counts dynamically across Foundations & Icon Catalogue (`123 Icons chuẩn hóa`).
  - Added new e-commerce aliases to `ICON_ALIASES` and `semi-lint` HARD rules (`wishlist`, `like`, `rating`, `review`, `qr`, `vietqr`, `cod`, `cash`, `bank`, `unboxing`, `cancel_order`, `deal`, `hot`, `loyalty`, `calc`, etc.).

## [0.2.5] - 2026-10-30

### Added
- **Multi-Domain Icon Pack (`@semi/ui`):** Added 22 new Lucide-standard 24×24 stroke icons expanding the system to 104 icons total:
  - **E-Commerce & Retail:** `bag` (checkout / shopping bag), `creditCard` (card payments / Stripe / VNPay), `receipt` (invoices / VAT receipts), `truck` (delivery / logistics), `packageCheck` (delivered / received package), `percent` (discounts / coupons), `store` (shops / storefronts), `wallet` (wallet balance / prepaid).
  - **Developer & DevOps:** `database` (SQL / SQLite / Postgres), `server` (backend host / Klipper / node), `cpu` (processor / MCU / load), `bug` (debug / bug report), `gitCommit` (commit hash / firmware version), `gitPullRequest` (pull request / preset contribution), `shield` (SSL / security / firewall), `key` (API keys / auth tokens), `webhook` (webhook integrations / bot notification).
  - **Analytics & Metrics:** `activity` (heartbeat / telemetry), `trendingUp` (growth / positive KPI), `trendingDown` (reduction / negative KPI), `pieChart` (pie chart / allocation), `gauge` (speed / meter / pressure).
- **Schema & AI Retrieval Engine (`src/iconCatalog.ts`, `docs/ICONS.md`):**
  - Upgraded `IconMeta` with `domain` (`core`, `ecommerce`, `developer`, `analytics`, `hardware_3d`, `media`), `intents`, and `lucideEquivalent`.
  - Upgraded `suggestIcon` with fuzzy matching, token normalization, intent search, and Lucide alias lookup.
  - Expanded `semi-lint` HARD rule `icon-alias` regex covering 80+ alias and Lucide variants.

## [0.2.4] - 2026-10-30

### Added
- **AppShell Section Headers (`@semi/ui`):** Added visible section header rendering with `icon?: IconName` and `hideLabel?: boolean` in `ShellNavSection`, allowing sidebar items to be grouped by category or folder with clean headers. Empty non-loading sections are cleanly omitted.

## [0.2.3] - 2026-10-30

### Added
- **Pin Icon (`@semi/ui`):** Added standard 24×24 stroke path for `pin` (thumbtack / pushpin) into `ICONS` and registered in `iconCatalog.ts` and `docs/ICONS.md`.
- **AppShell NavItem Right Slot (`@semi/ui`):** Added `right?: React.ReactNode` to `ShellNavItem` in `AppShell` allowing custom actions (e.g. pin button, badges) positioned at the right end of a tab item with hover reveal capability.

## [0.2.2] - 2026-10-30

### Added
- **Semantic Icon Registry & Guide (`docs/ICONS.md`, `src/iconCatalog.ts`):** Complete catalog with metadata, purpose, do's & don'ts, and keywords for all 67 icons in `@semi/ui`. Added action mapping table for CRUD, navigation, hardware, IoT, status, and commerce.
- **Core Entity Icons (`@semi/ui`):** Added standard 24×24 stroke paths for `user` (profile / customer), `users` (team / multi-user), `filter` (funnel data filters), `bell` (notifications), and `tag` (categories / badges) to `ICONS`.
- **Icon Linter Rule (`lint/semi-lint.mjs`):** Added `icon-alias` HARD rule catching common misnamed icon calls (`delete`, `remove`, `cancel`, `gear`, `funnel`, `profile`, `notification`, etc.) and directing to canonical `IconName`.
- **AppShell Shimmer (`@semi/ui`):** Added `loading?: boolean` and `loadingCount?: number` to `ShellNavSection` in `AppShell` so side menu sections can render shimmering placeholder items while data is loading.

## [0.2.1] - 2026-10-30

### Added
- **Icons (`@semi/ui`):** Added Lucide 24×24 stroke paths for `terminal` (`>_` prompt), `folder` (directory / Finder), `file` (document), `smartphone` (mobile device), and `branch` (git branch) into `ICONS`.

## [0.2.0] - 2026-10-30

### Added
- **Structural Layout & Page Components (`@semi/ui`):**
  - `AppShell` + `MobileTabBar` (`TAB_BAR_PAD`): 2-panel floating Bento frame on `bg-canvas` (`md:p-2 md:gap-2`), collapsible `w-52` ↔ `w-14` `rounded-2xl` sidebar with grouped `sections`, primary CTA slot, and mobile bottom navigation bar (plus "Menu" bottom sheet when an app has >5 routes).
  - `PageTitle` & `PageTabsTitle`: text-only `font-display` page heading (`22px–26px`) and underline group tabs (`h-[2.5px] bg-primary`).
  - `SubpageToolbar`: unified `STICKY_TOOLBAR` with `left` filters and `right` icon-only `BTN_PRIMARY BTN_ICON` + `SearchInput` + `RefreshButton`.
  - `KpiCard`: metric card with `18px–22px` `tabular-nums` value, flat coloured icon in label, and shimmer `loading` state.
  - `Modal`: shared portal dialog with `MODAL_BACKDROP`, `MODAL_PANEL`, `MODAL_HEAD`, `MODAL_CLOSE`, and `MODAL_FOOT`.
- **Form & Shell Style Constants (`@semi/ui/styles`):** `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA` (`bg-white/[0.05]` so inputs contrast inside `bg-field` modals), and `SHELL_OUTER`, `SHELL_ASIDE`, `SHELL_MAIN`, `SHELL_CONTAINER`.
- **Structural Linter Rules (`lint/semi-lint.mjs`):**
  - `legacy-shell-aside`: bans edge-to-edge `border-r` sidebars and `-translate-x-full` mobile hamburger drawers in favour of `AppShell` + `MobileTabBar`.
  - `legacy-ui-wrapper`: bans local `ui.tsx` wrapper barrels (`PageHeader`, `Select`, `Modal`, `Input`, `Textarea`, `Button`, `EmptyState`) that shadow `@semi/ui`.
  - `input-bg-field`: bans `bg-field` on inputs/textareas (invisible inside `bg-field` modals; enforces `FIELD_INPUT` / `FIELD_TEXTAREA`).
- **Monorepo & Structural Audit (`audit.mjs` & `init.mjs`):** Automatically discovers all frontend apps in a monorepo (`frontend/dashboard`, `frontend/store`, `web/`, `apps/*`) and audits structural alignment with 3D Noobs Studio.

## [0.1.0] - 2026-10-30

### Added
- **Design Tokens (`tokens/tokens.json` → `tokens/tokens.css`):** Dark surface scale (`canvas`, `app`, `panel`, `field`, `raised`, `line`, `line-hover`, `divider`), brand `primary-*` (`#00AE42`), semantic `emerald-*` / `amber-*` / `rose-*` / neutral `gray-*` palettes, and typography tokens (`--font-sans`, `--font-display`, `--font-mono`).
- **Base CSS (`styles/base.css`):** Shimmer skeleton keyframe, hidden scrollbar utility, focus-visible ring, and touch target resets.
- **Style Constants (`@semi/ui/styles`):**
  - `surfaces.ts`: `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN*`, `STATUS_PILL`, `STATUS_DOT`, `STICKY_TOOLBAR`, `MODAL_*`.
  - `buttons.ts`: `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*`.
  - `appChrome.ts`: `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*`.
- **Shared React Components (`@semi/ui`):** `Icon`, `IconTile`, `AppHeader`, `PageActions`, `Chip`, `Pills`, `CustomSelect`, `CustomCombobox`, `NumberInput`, `NumPadPopup`, `DatePicker`, `SearchInput`, `Pagination`, `SidePanel`, `RefreshButton`, `Skeleton` (`SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton`), `confirmDialog` + `ConfirmHost`, `ExternalLink`, `Markdown`.
- **Linter (`lint/semi-lint.mjs`):** Zero-dependency CLI (`npx semi-lint`) with 15 hard rules, 7 ratchet rules, JSON output mode (`--json`), and per-project `semi-lint.json` configuration.
- **Agent Plugin (`plugin/`):** `semi-design` bundle for Antigravity and Claude Code including `rules/AGENTS.md`, `PostToolUse` auto-lint hook, and skills `semi-ui`, `/semi-init`, `/semi-audit`, and `/semi-update`.
