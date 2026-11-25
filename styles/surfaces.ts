// Shared surface classes (docs/DESIGN_SYSTEM.md §5, §13, §15). Use these instead of re-typing them.

/** Content card (C-030): the card surface (bg-card: dark one step above the panel, light recessed one step below the
 * app), separated by tone, no visible border in Flat and Soft (the style's card border, radius and resting shadow; Sharp
 * keeps its 2px line). Add padding at the call site: p-card (sm:p-panel for a roomy one), never tighter (semi-lint card-padding). */
export const CARD = "bg-card border-card rounded-card shadow-card min-w-0";

/** Bordered card for dense data views (a table or a list of rows that needs a frame): the panel fill and a 1px line, the look of CARD before 0.36. */
export const CARD_BORDERED = "bg-panel border border-line rounded-card shadow-card min-w-0";

/** Clickable card (opens a detail view): the border shows on hover. */
export const CARD_HOVER = `${CARD} hover:border-line-hover active:scale-[0.99] transition-hover`;

/** Clickable bordered card. */
export const CARD_BORDERED_HOVER = `${CARD_BORDERED} hover:border-line-hover active:scale-[0.99] transition-hover`;

/** Plain hero panel at the top of a page, on the card surface. No glow (docs/DESIGN_SYSTEM.md, "Flat, no glow, no gradients"). */
export const HERO = "relative overflow-hidden rounded-panel border-card bg-card shadow-card p-card sm:p-panel";

/** Add to CARD for an active / "on" / printing card: primary border, no glow. */
export const CARD_ACTIVE = "!border-outline-line";

/** Flat status dot (add a size, e.g. `w-2 h-2 rounded-full`). */
export const STATUS_DOT = {
  online: "bg-success-solid",
  printing: "bg-inverted animate-pulse",
  busy: "bg-warning-solid",
  error: "bg-danger-solid",
  offline: "bg-muted",
} as const;

/** Sub-page toolbar row (filters left, actions right) that sticks to the top of the scrolling content panel.
 * Bleeds to the panel's side padding so cards scroll under an opaque strip; the negative y margin keeps the layout
 * gap unchanged. On phones it sits below the safe area, which `before:` paints over. */
export const STICKY_TOOLBAR =
  "sticky top-0 max-md:top-[env(safe-area-inset-top)] z-sticky -mx-4 sm:-mx-6 px-4 sm:px-6 -my-2.5 py-2.5 bg-app before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-app";

/** Tonal tile inside a card (stats, readings, nested rows): one step off the card (bg-card-field), no border. */
export const TILE = "rounded-control bg-card-field";

/** Section heading row: <div className={SECTION_HEAD}><h2 className={SECTION_TITLE}>…</h2><span className={COUNT_PILL}>3</span></div> */
export const SECTION_HEAD = "flex items-center gap-2 px-1";
export const SECTION_TITLE = "text-ui font-semibold text-strong tracking-tight";
export const COUNT_PILL = "h-4 min-w-[18px] px-1.5 rounded-full bg-raised text-chrome tabular-nums text-muted inline-flex items-center justify-center";

/** Attention count (unread, to approve): the brand fill with its on-colour, text-badge (10/700). CountBadge renders it with the 99+ cap. */
export const COUNT_BADGE = "inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-on-primary text-badge tabular-nums";
/** A plain count that is not an alert: neutral. */
export const COUNT_BADGE_NEUTRAL = "inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-raised text-strong text-badge tabular-nums";
/** Add to COUNT_BADGE to pin it to the top-right corner of a `relative` icon button. */
export const COUNT_BADGE_CORNER = "absolute -top-1 -right-1 pointer-events-none";
/** "Mới" / "New" tag: the brand colour at 18% (bg-new-tag) behind brand text (text-on-new-tag: the brand, or the strong text where the brand is not AA on that tint; the token build decides). */
export const NEW_TAG = "inline-flex items-center h-4 px-1.5 rounded-full bg-new-tag text-on-new-tag text-tag leading-none shrink-0";

/** Text link on the right of a section heading ("Quản lý ›"). */
export const SECTION_LINK = "ml-auto inline-flex items-center gap-1 text-ui font-medium text-muted hover:text-strong transition-hover";

/** Empty state: dashed card, icon above one short line. Usually a <button> that adds the first item. */
export const EMPTY =
  "rounded-card border border-dashed border-line p-8 flex flex-col items-center gap-2.5 text-center text-ui text-muted hover:text-strong hover:border-line-hover transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus";

/** Non-interactive empty state (EmptyState): same dashed card as EMPTY without the hover. */
export const EMPTY_STATIC =
  "rounded-card border border-dashed border-line p-8 flex flex-col items-center gap-2.5 text-center text-ui text-muted";

/** Phone cap for an empty or error state (P13): compact padding, at most 40% of the viewport, scrolls inside if a long text still overflows. */
export const EMPTY_PHONE_CAP = "max-sm:p-4 max-sm:gap-2 max-sm:max-h-[40svh] max-sm:overflow-y-auto";

/** Square icon-only action button in a card header (edit, delete, more). */
export const ICON_BTN =
  "w-7 h-7 rounded-control flex items-center justify-center text-muted hover:text-strong bg-tint hover:bg-tint-hover transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus active:scale-95";
export const ICON_BTN_DANGER =
  "w-7 h-7 rounded-control flex items-center justify-center text-muted hover:text-danger-fg bg-tint hover:bg-danger-bg active:bg-danger-border transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus active:scale-95";

/** Close button in modal headers: visible background pill with clear contrast, easily tappable on dark backgrounds. */
export const MODAL_CLOSE =
  "w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-tint hover:bg-tint-hover text-muted hover:text-strong flex items-center justify-center transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus active:scale-95 shrink-0";

/** Status pill (device state, job result): coloured 15% fill + 300 text. */
export const STATUS_PILL = "inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-chrome font-medium whitespace-nowrap";

/** Standard chromatic tones across the Semi ecosystem. */
export type SemanticTone =
  | "purple"
  | "violet"
  | "indigo"
  | "blue"
  | "sky"
  | "cyan"
  | "teal"
  | "emerald"
  | "green"
  | "amber"
  | "yellow"
  | "orange"
  | "rose"
  | "red"
  | "pink"
  | "gray";

/** Dual-theme tonal surfaces: 10% alpha fill + 20% alpha border + high-contrast text adapted for both dark and light modes. */
export const TONAL_SURFACE: Record<SemanticTone, string> = {
  purple: "bg-purple-500/10 border-purple-500/20 text-tone-purple",
  violet: "bg-violet-500/10 border-violet-500/20 text-tone-violet",
  indigo: "bg-indigo-500/10 border-indigo-500/20 text-tone-indigo",
  blue: "bg-blue-500/10 border-blue-500/20 text-tone-blue",
  sky: "bg-sky-500/10 border-sky-500/20 text-tone-sky",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-tone-cyan",
  teal: "bg-teal-500/10 border-teal-500/20 text-tone-teal",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-tone-emerald",
  green: "bg-emerald-500/10 border-emerald-500/20 text-tone-emerald",
  amber: "bg-amber-500/10 border-amber-500/20 text-tone-amber",
  yellow: "bg-amber-500/10 border-amber-500/20 text-tone-amber",
  orange: "bg-orange-500/10 border-orange-500/20 text-tone-orange",
  rose: "bg-rose-500/10 border-rose-500/20 text-tone-rose",
  red: "bg-rose-500/10 border-rose-500/20 text-tone-rose",
  pink: "bg-pink-500/10 border-pink-500/20 text-tone-pink",
  gray: "bg-field border-line text-muted",
};

/** Tonal badge base class (11px or 12px pill). */
export const BADGE_BASE = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-chrome font-medium border whitespace-nowrap";

/** Dual-theme tonal container (cards, callouts, alert banners): 10% alpha fill + 20% alpha border + dual-theme text. */
export const TONAL_CONTAINER = TONAL_SURFACE;

/** Dual-theme tonal interactive hover (clickable cards, list rows, buttons): 15% hover fill + 30% hover border. */
export const TONAL_HOVER: Record<SemanticTone, string> = {
  purple: "hover:bg-purple-500/15 hover:border-purple-500/30",
  violet: "hover:bg-violet-500/15 hover:border-violet-500/30",
  indigo: "hover:bg-indigo-500/15 hover:border-indigo-500/30",
  blue: "hover:bg-blue-500/15 hover:border-blue-500/30",
  sky: "hover:bg-sky-500/15 hover:border-sky-500/30",
  cyan: "hover:bg-cyan-500/15 hover:border-cyan-500/30",
  teal: "hover:bg-teal-500/15 hover:border-teal-500/30",
  emerald: "hover:bg-emerald-500/15 hover:border-emerald-500/30",
  green: "hover:bg-emerald-500/15 hover:border-emerald-500/30",
  amber: "hover:bg-amber-500/15 hover:border-amber-500/30",
  yellow: "hover:bg-amber-500/15 hover:border-amber-500/30",
  orange: "hover:bg-orange-500/15 hover:border-orange-500/30",
  rose: "hover:bg-rose-500/15 hover:border-rose-500/30",
  red: "hover:bg-rose-500/15 hover:border-rose-500/30",
  pink: "hover:bg-pink-500/15 hover:border-pink-500/30",
  gray: "hover:bg-raised hover:border-line-hover",
};

/**
 * Modal shell: backdrop + panel.
 * Phones (< sm): full screen (edge-to-edge, h-dvh, rounded-none, border-0).
 * iPad / desktop (>= sm): centred dialog (max-h-[92dvh], rounded-panel, border-line).
 * Pass only the max-width at the call site (`max-w-md`…).
 */
export const MODAL_BACKDROP =
  "fixed inset-0 z-modal flex items-stretch sm:items-center justify-center sm:p-4 bg-overlay backdrop-blur-lg";
export const MODAL_PANEL =
  "bg-panel border-line max-sm:border-0 sm:border max-sm:rounded-none sm:rounded-panel w-full shadow-overlay max-sm:h-dvh max-sm:max-h-dvh sm:max-h-[92dvh] overflow-y-auto overscroll-contain flex flex-col";
/** Modal header row: icon/title left, close button right. Includes safe-area padding on mobile. */
export const MODAL_HEAD = "px-5 pt-4 max-sm:pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3 shrink-0";
/** Modal title. */
export const MODAL_TITLE = "text-lead font-semibold text-strong tracking-tight truncate";
/** Modal footer: buttons right-aligned; stretched on a phone with safe-area bottom padding. */
export const MODAL_FOOT =
  "px-5 py-3 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-divider flex items-center justify-end gap-2 shrink-0 max-sm:*:flex-1";

/** A page form's column (D13): never wider than `max-w-2xl`, fields stacked `gap-stack`, labels above the controls. */
export const FORM_PAGE = "w-full max-w-2xl flex flex-col gap-stack";

/** The action row of a form (`FormActions`): right-aligned, a destructive action alone on the left. Phones get 44px buttons from the component. */
export const FORM_ACTIONS = "flex items-center justify-end gap-2 flex-wrap";

/**
 * `FormActions` on a page: sticks to the bottom of the scrolling page, over the page background (`bg-app`; the panel colour inside the AppShell card), with a line above.
 * The component adds the safe-area padding and lifts it above the on-screen keyboard (`bottom`).
 */
export const FORM_ACTIONS_STICKY = "sticky bottom-0 z-sticky -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 bg-app border-t border-divider";

/** Form field label above an input/select/textarea. */
export const FIELD_LABEL = "block text-ui font-medium text-muted mb-1";

/** Text size of a field you type in: 16px below `sm` (iOS Safari zooms the page on focus into a field under 16px and
 * never zooms back), the size of the component from `sm` up. Add it to every text-entry control. */
export const FIELD_TEXT_PHONE = "max-sm:text-input";

/** Form text input: 1.0 quiet field (bg-field, 1px field-line, radius 8; darker fill + field-line-focus on focus, no glow; 2px keyboard-only outline). */
export const FIELD_INPUT =
  "w-full h-field pointer-coarse:max-sm:min-h-11 bg-field border border-field-line rounded-control px-3 text-ui max-sm:text-input text-strong placeholder:text-muted focus:border-field-line-focus focus:bg-field-focus outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus transition-hover disabled:opacity-40";

/** Form textarea: 1.0 quiet field matching FIELD_INPUT. */
export const FIELD_TEXTAREA =
  "w-full bg-field border border-field-line rounded-control px-3 py-2 text-ui max-sm:text-input text-strong placeholder:text-muted focus:border-field-line-focus focus:bg-field-focus outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus transition-hover disabled:opacity-40";

/** The 1.0 shell frame (used by AppShell, #144): `canvas` with 8px padding and gap from sm, none on phones. */
export const SHELL_OUTER =
  "h-dvh overflow-hidden flex flex-col md:flex-row sm:p-2 sm:gap-2 bg-canvas text-body";
/** The nav panel: `panel`, radius 16, a container (`@container/nav`) so the rail hides labels with a container query. Width: AppShell. */
export const SHELL_NAV =
  "@container/nav max-md:hidden shrink-0 rounded-panel bg-panel flex flex-col overflow-hidden select-none motion-safe:transition-[width] duration-200";
/** The content column: `app`, radius 16 from sm, holds the route header and the content card. */
export const SHELL_COLUMN = "flex-1 min-w-0 min-h-0 flex flex-col bg-app sm:rounded-panel overflow-hidden";
/**
 * The content card: `panel`, radius 16 from sm, flush with the column, 4px above its bottom, no border. Inside it
 * `bg-app` is the panel colour (`--semi-app`, the variable `bg-app` reads, is set to `--semi-panel` on the card), so
 * sticky strips that paint `bg-app` (STICKY_TOOLBAR, FORM_ACTIONS_STICKY, AppHeader, StickyContextBar) match the card
 * and stay `app` on a page without AppShell.
 */
export const SHELL_CARD =
  "flex-1 min-w-0 min-h-0 flex flex-col bg-panel sm:rounded-panel sm:mb-1 overflow-x-hidden overscroll-contain [--semi-app:var(--semi-panel)]";
/** @deprecated Since 1.0: the nav panel is SHELL_NAV. */
export const SHELL_ASIDE = SHELL_NAV;
/** @deprecated Since 1.0: the content is SHELL_COLUMN (route header + card) and SHELL_CARD. */
export const SHELL_MAIN = SHELL_CARD;
/** The centred page container inside the card (AppShell without `flush`): at most 1440px, 16 / 24px padding. */
export const SHELL_CONTAINER =
  "flex-1 min-w-0 w-full max-w-[1440px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8 sm:pb-10 flex flex-col";
