# Semi Design System — Quick Reference

Component pages for agents: `docs/components/README.md` → `docs/components/<id>.md` (when to use, what instead, examples,
API from the types). Cheatsheet of `DESIGN_SYSTEM.md`, which is the **single source of truth for UI rules** across the Semi ecosystem: a new
or changed rule goes into `docs/DESIGN_SYSTEM.md`, `docs/QUICK_REF.md`, `docs/DECISIONS.md` (+ `lint/semi-lint.mjs` when
checkable) in the `semi-nextjs-codebase` repo, tagged with a new release. Never record UI rules in agent memory, skills
or per-project `AGENTS.md`.

Style: restrained dark & light dual-theme (`data-theme="dark|light"`) + bento cards, flat (no gradients, no glow), minimal text, collapsible neutral
left panel menu (`w-52` / `w-14`) floating on `bg-canvas` (`md:p-2 md:gap-2`), full-width right content panel (`md:rounded-panel bg-app`),
`font-display` page titles (`PageTitle` / `PageTabsTitle`, text only, no subtitle; either on their own row above the toolbar, or on the toolbar row via `SubpageToolbar title`),
sticky sub-page toolbar row (`SubpageToolbar`: filters left, icon-only primary CTA + `SearchInput` + `RefreshButton` right).
Phones (`< md`) hide the top logo header and use `MobileTabBar` at the bottom (never a hamburger slide-over drawer).

**Two-Tier Semantic Tokens (Dark & Light Mode):**
| Semantic Token | Tailwind Class | Dark Mode (`[data-theme="dark"]`) | Light Mode (`[data-theme="light"]`) | Usage |
|---|---|---|---|---|
| `--color-canvas` | `bg-canvas` | `#0c0d0e` | `#f1f5f9` (Slate-100) | Outermost viewport frame |
| `--color-app` | `bg-app` | `#121316` | `#ffffff` | Main workspace & content canvas |
| `--color-panel` | `bg-panel` | `#202226` | `#ffffff` | Bento Cards, Sidebar, Modals, Menus |
| `--color-field` | `bg-field` | `#272a2f` | `#f1f5f9` (Slate-100) | Form inputs (`FIELD_INPUT`), table headers |
| `--color-raised` | `bg-raised` | `#26282e` | `#e2e8f0` (Slate-200) | Hover surface, subtle elevation, skeleton shimmer |
| `--color-text-contrast` | `text-contrast` | `#ffffff` | `#0f172a` (Slate-900) | Headings, active state, high-contrast text |
| `--color-text-body` | `text-body` | `#d1d5db` (Gray-300) | `#334155` (Slate-700) | Primary UI labels, body text |
| `--color-text-muted` | `text-muted` | `#9ba1aa` | `#5b6779` | Captions, placeholders, inactive hints |
| `--color-line` | `border-line` | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.08)` (Slate-200) | Borders on cards, panels, dividers (inputs: `control-line`) |
| `--color-line-hover` | `border-line-hover` | `rgba(255,255,255,0.2)` | `rgba(0,0,0,0.16)` (Slate-300) | Hover border state |
| `--color-control-line` | `border-control-line` | `text-muted` 65% | `text-muted` 80% | Edge of inputs, checkboxes, radios (≥ 3:1); hover `border-control-line-hover` |
| `--color-divider` | `border-divider` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.05)` (Slate-100) | Subtle row & item separators |

*Accent & status (AA in both themes):* solid action `bg-accent hover:bg-accent-hover text-on-accent` · primary text/icon `text-accent-fg` · focus `ring-focus` / focused field `border-focus` · selected `bg-accent-subtle` (hover `bg-accent-subtle-hover`) + `border-accent-line` · status text `text-danger-fg` / `text-success-fg` / `text-warning-fg` / `text-info-fg` · tonal text `text-tone-<hue>`. Never `text-*-400` or `text-*-700 dark:text-*-300` in shared UI.

*Theme:* `<html suppressHydrationWarning>` + `<ThemeScript />` in `<head>` (no flash) + `<ThemeProvider defaultTheme="dark">` (same options); `<ThemeSwitcher />` (Sáng · Tối · Hệ thống, settings / sidebar footer) or `<ThemeToggle />` (one-tap dark/light), or `const { theme, resolvedTheme, mounted, setTheme } = useTheme()`. `data-theme="system"` follows the OS.

**Colour:** accent (Semi default `#00AE42`; a product gets its own from its brand kit, never in its own CSS) = actions, focus, "on", through `bg-accent` / `text-accent-fg` tokens. Status tokens carry meaning only: success = online/done · warning = busy/paused · danger = error/destructive · info = news/cost. Category tints: `<Badge tone>`, `TONAL_SURFACE`, `text-tone-<hue>` (§3c). Nav menu: grey 16px icons, no count badges, active = `bg-raised text-contrast`.
Chips (`Chip`, `chipClass(active)`): `rounded-full h-control px-3.5`, ghost when off, active uses semantic high-contrast background; colour only on a
leading dot or icon (`TONE_DOT`, `chipIconClass(tone)`). Card tiles keep their area tint. Flat: no gradients, no glow
blobs, no `shadow-[0_0_…]` (status dots and power buttons too). Active card = `CARD_ACTIVE` (primary border).

**Type:** page title (`PageTitle` / `PageTabsTitle`) `font-display text-heading sm:text-display font-title tracking-tight text-contrast` ·
KPI figure (`KpiCard`) `font-figure font-title text-figure sm:text-heading tabular-nums text-contrast` · section `text-ui`–`text-title`
font-semibold text-contrast` · UI `text-label font-medium text-body` · label `text-label font-medium text-muted` ·
caption `text-caption`–`text-label` text-muted` · numbers `tabular-nums` (Geist; `font-mono` only for code) · Geist +
Montserrat Alternates (`font-display`) · weights medium/semibold · type scale only: `text-caption` 11 · `label` 12 · `ui` 14 (compact 13) · `ui-lg` 15 (compact 14) · `title` 15 · `title-lg` 16 · `figure` 18 · `heading-sm` 20 · `heading` 22 · `heading-lg` 24 · `display` 26 (no `text-xs/sm`, no `text-[13px]`) ·
sentence case, no ALL CAPS.

**Status, layers, elevation:** callouts / badges `bg-{danger,success,warning,info}-bg border-*-border text-*-fg` (`Alert`) ·
dots / bars `bg-*-solid` · backdrop `bg-overlay` · floating layers `shadow-overlay` (canvas controls `shadow-float`) ·
layers `z-sticky` < `z-drawer` < `z-modal` < `z-dialog` < `z-sheet` < `z-popover` < `z-toast` < `z-tooltip` (no `z-[9999]`).

**A11y & strings:** icon-only controls need `aria-label` · forms use `Field` (label / hint / error wired) · dialogs are
`Modal` / `Drawer` / `confirmDialog` (focus trap, Escape, focus return) · keep `FOCUS_RING` on custom controls · a
control drawn under 24px gets `HIT_AREA` · UI text in shared components comes from `useSemiLocale()`
(`<SemiLocaleProvider locale={en}>`). Checked on the rendered page in both themes by `npx semi a11y <url>` (§18):
`contrast`, `edge`, `name`, `focus-ring`, `target-size`, `img-alt`, `lang`, `zoom-lock`, + axe-core when installed.

**Style (docs/STYLES.md):** the app's style sets the neutral colours behind `bg-*` / `text-*` / `border-line`, the fonts
(`font-sans`, `font-display`), control sizes `h-control` (toolbar buttons, pills, chips, search) / `h-field` (inputs,
selects), the card border (`border-card`, in `CARD`) and the shape below. Never `h-[34px]` or a per-style class.

**Shape (style tokens):** marks / checkboxes / inline code `rounded-chip` · controls / tiles / rows
`rounded-control` · cards / popovers / menus / toasts `rounded-card` · panels / hero / modal / sidebar `rounded-panel` ·
pills / avatars / dots `rounded-full` · resting card shadow `shadow-card` (in `CARD`; none in Flat). The app's style
(`<html data-style>`: Flat by default, Soft or Sharp) sets the values. Never `rounded`, `rounded-lg/xl/2xl` or `rounded-[Npx]`.

**Use the shared blocks (`@semi/ui` and `@semi/ui/styles`) — never create a local `ui.tsx` wrapper barrel:**
- **Layout & Structure (`@semi/ui`):**
  - `ThemeProvider`, `useTheme`, `ThemeToggle`: Zero-runtime-overhead dual-theme management via `data-theme` attribute and CSS variables.
  - `AppShell` (+ `MobileTabBar`, `TAB_BAR_PAD`): 2-panel floating Bento frame on `bg-canvas`, collapsible `w-52`/`w-14` sidebar with grouped `sections`, and mobile bottom tab bar. Items may carry `children` (one level, optional grey icon, no colour or count): closed by default, open only while the parent or a child is active; hidden in the rail / below `lg` / phones, so pages check `useAppShell().submenuVisible` and offer their own picker.
  - `PageTitle`, `PageTabsTitle`: text-only display heading or underline tab heading (`h-[2.5px] bg-primary`).
  - `SubpageToolbar`: sticky toolbar (`STICKY_TOOLBAR`) with `left` filters and `right` icon-only `BTN_PRIMARY BTN_ICON` + `SearchInput` + `RefreshButton`; `title` puts the page title on the same row (then no `PageTitle`).
  - `KpiCard`: metric card with a `tabular-nums` value in the style's figure font (`font-figure`), optional neutral icon (`iconTone` only for a status), `featured` for the screen's main number, shimmer `loading` state.
  - `Modal`: portal dialog with `MODAL_BACKDROP`, `MODAL_PANEL`, `MODAL_HEAD`, `MODAL_CLOSE`, and `footer` (`MODAL_FOOT`).
- **Controls (`@semi/ui`):**
  - `Icon` (stroke 1.75, `w-4 h-4`), `IconTile` (`size="sm|md|lg"`). Follow semantic icon mapping in `docs/ICONS.md` (e.g. `trash` for delete, `close` for dialog dismiss, `refresh` for sync, `sliders` for parameters, `user` for profiles, `filter` for lists, `sun`/`moon` for theme). New icons go into `ICONS` in `@semi/ui` (never inline `<svg><path>`; no ✕ ✓ ✗ glyphs).
  - `Pills`, `Chip` (+ `tone`), `Badge` (`tone="purple|blue|emerald|amber|rose|sky|..."`), `SearchInput`, `CustomSelect` (toolbar default vs `variant="field"` in forms), `CustomCombobox`, `DatePicker`, `Pagination`, `NumberInput` (+ `NumPadPopup`). Never native `<select>`, `type="date"`, `type="number"`.
  - `AppHeader` (stand-alone tool/3D app top bar), `PageActions`, `SidePanel`, `RefreshButton`, `ExternalLink`, `Markdown`.
  - Loading: `Skeleton` / `SkeletonCard` / `SkeletonGrid` / `SkeletonRows` / `PageSkeleton`; no "Đang tải…" text or page spinners. Only exception: `BootLoader` (below).
  - States (§13, §13c): `EmptyState variant="first-use"` (one icon, one sentence, one primary action) or `"no-results"` (+ `onClearFilters` → "Xoá lọc"); hide the title-row primary while the empty state shows its own; `ErrorState onRetry`, `NotFound`, `Forbidden` (link home). Each route group ships `loading.tsx` (`<PageSkeleton shape inShell />`), `error.tsx` (`<ErrorState headingLevel={1} onRetry={reset} />`), `not-found.tsx` (`<NotFound />`), plus root `app/error.tsx` and `app/global-error.tsx`; `npx semi example states`.
  - Shell and loading: `AppShell` once in `app/(app)/layout.tsx` (never in a page, `app-shell-in-page`); items routed by `href` (`shell-nav-href`); the session check once in that layout, best on the server; before the layout is known `if (!session) return <BootLoader />` (centred spinner, layouts only, `boot-loader-place`); content loading is a `loading.tsx` beside the layout with `PageSkeleton`, never a skeleton around the shell (`shell-gate`).
  - Confirmations: `confirmDialog({ title, message, confirmLabel, tone, icon })` + `<ConfirmHost />`, never `window.confirm`.
  - AI chat (§14b): `<AIChat messages busy onSend onStop onRetry onNewChat empty toolbar />` (or `ChatPanel` > `ChatView` > `ChatList` + `ChatComposer` with `UserMessage` / `AssistantMessage` / `ChatError` / `ChatThinking` / `ChatIntro` / `ChatSuggestion`). UI only: the app keeps messages and streaming; the provider → model → effort chips are `toolbar={<ChatModelPicker providers models efforts … />}`. Never a local composer or bubbles.
- **Style Constants (`@semi/ui/styles`):**
  - `surfaces.ts`: `SHELL_OUTER`, `SHELL_ASIDE`, `SHELL_MAIN`, `SHELL_CONTAINER`, `CARD`, `CARD_HOVER`, `CARD_ACTIVE`, `HERO`, `TILE`, `SECTION_*`, `COUNT_PILL`, `EMPTY`, `ICON_BTN*`, `STATUS_PILL`, `STATUS_DOT`, `TONAL_SURFACE`, `TONAL_CONTAINER`, `TONAL_HOVER`, `BADGE_BASE`, `STICKY_TOOLBAR`, `MODAL_*`, `FIELD_LABEL`, `FIELD_INPUT`, `FIELD_TEXTAREA`.
  - `buttons.ts`: `BTN_PRIMARY`, `BTN_SECONDARY`, `BTN_DANGER`, `BTN_ICON`, `MODAL_BTN_*`.
  - `appChrome.ts`: `HEADER_ICON_*`, `headerPrimary`, `HEADER_PILL`, `VIEWPORT_*`.

**Not the generic AI screen (§19):** one main block per screen (`KpiCard featured`, not four equal cards) · KPI icons
neutral, colour only for a status (`decorative-icon-tones`) · no three feature cards with icons and vague promises: proof
(a real number, a quote, a product shot) · icons only where they help scanning · sample text from the brand brief ·
plain sections and white space next to cards. Title weight and figure font come from the style; density and
type scale are the product's (`data-density`, `data-type-scale` on `<html>`, `semi-lint.json`).

**Density budgets (§4c, measured on the rendered page: `npx semi density <url>`, `test:ui`):** text ≥ 12px from a
box's sides, ≥ 8px from top / bottom (`tight-box`) · list rows ≥ `h-control` when clickable, 6px around their text
(`tight-row`: `Item`, `Menu`, `DataTable`) · ≤ 3 frames deep (`box-nesting`) · ≤ 4 text sizes (`type-mix`) and ≤ 3
colours (`colour-noise`) per box · 1 filled accent button per view (`primary-actions`) · ≥ 8px between boxes
(`cramped-boxes`) · one line between two things (`double-line`). Lengths scale with density. `data-density-view` on a
frame that stands for a whole screen (preview, sample app); `data-density-skip="<reason>"` only on a specimen.

## Anti-patterns & Token Rules (enforced by `npx semi-lint`)

- **Compose, never re-create (0.30.0):** no raw `<button>/<input>/<textarea>/<table>` (`raw-control`), no other UI or icon kit (`foreign-ui`), no own `Card`/`Badge`/`Tooltip`… (`local-primitive`), no hand-made overlay or spinner (`custom-overlay`, `custom-spinner`), no `<div onClick>` (`click-target`: `<Card onClick>` is keyboard-ready) or bare `outline-none` (`focus-hidden`), no emoji icons (`emoji-icon`).
- **No escape hatches:** `p-[13px]` / `z-[9999]` / `bg-panel/[0.05]` / `bg-[var(--semi-…)]` (`arbitrary-value`), `shadow-sm…2xl` (`tw-shadow`), `uppercase` (`text-case`), `leading-*` but tight/none (`leading-override`), colours or type in `style={{}}` (`inline-style-value`) or in `.css` (`css-raw-value`).
- **The baseline only shrinks:** `--update-baseline` refuses new hits; `--accept-new` only after a Semi upgrade or with the user's OK; `semi-lint --ci` fails a PR whose baseline, skips or disabled rules grew.
- **No literal palette colors (`no-literal-palette`):** Never use direct physical classes like `bg-white`, `text-slate-900`, `border-slate-200`, `divide-slate-100`, `bg-slate-50`, `bg-gray-800/900`. Always use Semantic Tokens (`bg-panel`, `bg-field`, `text-contrast`, `text-body`, `text-muted`, `border-line`, `divide-divider`).
- **No fixed chromatic text (`no-fixed-tone-text`):** `text-emerald-400`, `text-rose-700 dark:text-rose-300`, `fill-sky-500` → `text-accent-fg`, `text-*-fg`, `text-tone-<hue>`.
- **No brand scale for states (`accent-state-token`):** `ring-primary-500/50`, `bg-primary-500/15`, `border-primary-500/30` → `ring-focus`, `bg-accent-subtle`, `border-accent-line` (themed, checked in both themes).
- **No brand-scale fills (`primary-fill`):** `bg-primary-500 text-white`, `border-primary-500` → `bg-accent hover:bg-accent-hover text-on-accent`, `border-accent-line` / `border-focus`. The brand colour is one step of `primary-*`, so `primary-500` turns pale with a brand kit; the scale is for charts and illustrations (`skip` those files).
- **No arbitrary colours / sizes:** `bg-[#…]`, `text-[rgb(…)]` (`hex-colour-class`), `"#fff"` in style props or configs (`literal-colour-value`), `text-[13px]` (`arbitrary-text-size`).
- **No solid pastel surfaces (`no-solid-pastel-surfaces`):** Never use solid pastels (`bg-*-50`, `border-*-200`) for cards, rows, or containers; in dark mode they turn into glaring light rectangles. Use the themed status surfaces (`bg-warning-bg border-warning-border text-warning-fg`, also danger / success / info) or standard `bg-panel`.
- **Universal Tonal Theme-Matching:** Chromatic accents across ANY component (cards, alert banners, callouts, table rows, buttons, badges, chips) adapt seamlessly to both dark & light themes using alpha transparency: static fill `bg-<color>-500/10`, hover fill `hover:bg-<color>-500/15`, active fill `active:bg-<color>-500/20`, border `border-<color>-500/20`, hover border `hover:border-<color>-500/30`, and text `text-tone-<color>` (or `TONAL_CONTAINER` / `TONAL_HOVER` / `<Badge tone="...">`).
- **No Card class override (`card-class-override`):** `<Card>` (`interactive`, `active`) owns its surface: no `bg-*` / `shadow-*` in its className.
- **Surfaces & Shadows:** Gradients, glow, `shadow-[0_0_…]`, `shadow-sm/md/lg` are banned. Cards are separated by borders (`border-line`); their only resting shadow is `shadow-card`, which the style sets (none in Flat, soft in Soft, hard offset in Sharp).
- **Typography:** `font-bold`, `text-[9|10px]`, `text-xs/sm`, uppercase labels, ALL CAPS buttons.
- **Shell structure (`app-shell-in-page`, `shell-gate`, `shell-nav-href`, `boot-loader-place`):** AppShell only from a layout; no `if (!ready) return <PageSkeleton />` before it; `href` on page items, not `onSelect` + `router.push`; `BootLoader` only as the layout's boot gate.
- **Radii (`radius-token`):** `rounded`, `rounded-sm/md/lg/xl/2xl`, `rounded-[Npx]` (they ignore the app's style); per-style classes or `[data-style=…]` selectors in an app.
- **Navigation & Layout:** fixed `border-r` sidebars or `-translate-x-full` hamburger drawers (use `AppShell` + `MobileTabBar`) · local `ui.tsx` wrapper barrels (`PageHeader`, `Select`, `Input`, `Button`, `Modal`): use `Button`, `Field` + `Input`, `CustomSelect`, `Modal`, `EmptyState` from `@semi/ui`.
- **Icons & Controls:** emoji / ✕ ✓ glyphs, stroke 2+, inline `<path>` · native `<select>` / date / number inputs, `window.confirm` · "Đang tải…" text (a progress step label or a `role="status"` line is fine) · Home button in app headers, page subtitles, text buttons on the page title row.
- **Content colours:** illustrations and data palettes go under `skip` with a reason per file (`"skip": { "literal-colour-value": { "lib/scenePalette.ts": "data colours: 3D scene" } }`; `literal-colour-value`, `inline-svg-path`, `no-literal-palette` only), not in the baseline. `font-mono` only on code (`<code>`, `<pre>`, `CodeBlock`, `Terminal`, code editors); `max-w-4xl…6xl` only on dialogs and drawers.

## Component inventory

<!-- generated:components:start (scripts/build-manifest.mjs) -->
**Components (128)** — full props / summaries in `node_modules/@semi/ui/components.json`:

- `Agent`: `Reasoning`, `ToolCall`, `Sources`, `Citation`, `TaskList`, `ActionConfirmation`, `FileTree`, `ContextMeter`
- `AppHeader`: `AppHeader`
- `AppShell`: `AppShell`
- `AspectRatio`: `AspectRatio`
- `Badge`: `Badge`
- `Breadcrumb`: `Breadcrumb`
- `Button`: `Spinner`, `Button`
- `ButtonGroup`: `ButtonGroup`
- `Calendar`: `Calendar`
- `Card`: `Card`
- `Carousel`: `Carousel`
- `Chart`: `BarChart`, `LineChart`, `DonutChart`, `Sparkline`
- `Chat`: `ChatAvatar`, `ChatThinking`, `UserMessage`, `AssistantMessage`, `ChatError`, `ChatCopyButton`, `ChatIntro`, `ChatSuggestion`, `ChatSuggestions`, `ChatList`, `ChatComposer`, `ChatModelPicker`, `ChatView`, `ChatPanel`, `ChatAnswer`, `AIChat`
- `Chip`: `Chip`
- `Choice`: `Checkbox`, `Switch`, `RadioGroup`
- `CodeBlock`: `CodeBlock`
- `Command`: `Command`, `CommandDialog`
- `CustomCombobox`: `CustomCombobox`
- `CustomSelect`: `CustomSelect`
- `DataTable`: `DataTable`
- `DatePicker`: `DatePicker`
- `Disclosure`: `Collapsible`, `Accordion`
- `Drawer`: `Drawer`
- `ExternalLink`: `ExternalLink`
- `Feedback`: `Alert`, `Progress`, `Avatar`, `EmptyState`
- `Field`: `Field`, `Input`, `Textarea`
- `FileDrop`: `FileDrop`
- `Icon`: `Icon`, `IconTile`
- `InputGroup`: `InputGroup`
- `InputOTP`: `InputOTP`
- `Item`: `Item`, `ItemGroup`
- `Kbd`: `Kbd`
- `KpiCard`: `KpiCard`
- `Markdown`: `Markdown`
- `MobileTabBar`: `MobileTabBar`
- `Modal`: `Modal`
- `NavigationMenu`: `NavigationMenu`
- `NumPadPopup`: `NumPadPopup`
- `NumberInput`: `NumberInput`
- `Overlay`: `Tooltip`, `Menu`, `ContextMenu`, `Menubar`
- `PageActions`: `PageActionsProvider`, `PageActionsSlot`, `PageActions`
- `PageTitle`: `PageTitle`, `PageTabsTitle`
- `Pagination`: `Pagination`
- `Pills`: `Pills`
- `Popover`: `Popover`, `HoverCard`
- `Prose`: `Prose`
- `QRCode`: `QRCode`
- `RefreshButton`: `RefreshButton`
- `Resizable`: `ResizablePanels`
- `ScrollArea`: `ScrollArea`
- `SearchInput`: `SearchInput`
- `Separator`: `Separator`
- `SidePanel`: `SidePanelToggle`, `SidePanel`
- `Skeleton`: `Skeleton`, `Loading`, `SkeletonCard`, `SkeletonGrid`, `SkeletonRows`, `PageSkeleton`, `BootLoader`
- `Slider`: `Slider`
- `States`: `ErrorState`, `NotFound`, `Forbidden`
- `SubpageToolbar`: `SubpageToolbar`
- `Table`: `Table`, `THead`, `TBody`, `TR`, `TH`, `TD`
- `Tabs`: `Tabs`
- `TaskHost`: `TaskHost`
- `Terminal`: `Terminal`
- `ThemeProvider`: `ThemeProvider`, `ThemeToggle`, `ThemeSwitcher`
- `ThemeScript`: `ThemeScript`
- `Toast`: `ToastHost`
- `Toggle`: `Toggle`, `ToggleGroup`
- `confirmDialog`: `ConfirmHost`
- `locale`: `SemiLocaleProvider`

**Hooks:** `useAppShell`, `useHotkey`, `useField`, `useCoarsePointer`, `useTheme`, `useScrollLock`, `useBackdropClose`, `useFocusTrap`, `useDialog`, `useAnchoredPosition`, `useSemiLocale` · **Functions:** `isoDay`, `parseDay`, `chipClass`, `chipIconClass`, `normalizeSearch`, `filterCommands`, `pageWindow`, `startTask`, `themeScript`, `toast`, `dismissToast`, `confirmDialog`, `composeRefs`, `cloneTrigger`, `cn`
<!-- generated:components:end -->
