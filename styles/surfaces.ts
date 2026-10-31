// Shared surface classes of the Dashboard style (docs/DESIGN_SYSTEM.md §5, §13, §15). Use these instead of re-typing them.

/** Content card: panel fill, thin line border, large radius. Add padding (p-4) at the call site. */
export const CARD = "bg-panel border border-line rounded-xl min-w-0";

/** Clickable card (opens a detail view). */
export const CARD_HOVER = `${CARD} hover:border-line-hover active:scale-[0.99] transition`;

/** Plain hero panel at the top of a page. Flat: no glow (docs/DESIGN_SYSTEM.md, "Flat, no glow, no gradients"). */
export const HERO = "relative overflow-hidden rounded-2xl border border-line bg-panel p-4 sm:p-6";

/** Add to CARD for an active / "on" / printing card: primary border, no glow. */
export const CARD_ACTIVE = "!border-primary-500/30";

/** Flat status dot (add a size, e.g. `w-2 h-2 rounded-full`). */
export const STATUS_DOT = {
  online: "bg-success-solid",
  printing: "bg-accent animate-pulse",
  busy: "bg-warning-solid",
  error: "bg-danger-solid",
  offline: "bg-muted",
} as const;

/** Sub-page toolbar row (filters left, actions right) that sticks to the top of the scrolling content panel.
 * Bleeds to the panel's side padding so cards scroll under an opaque strip; the negative y margin keeps the layout
 * gap unchanged. On phones it sits below the safe area, which `before:` paints over. */
export const STICKY_TOOLBAR =
  "sticky top-0 max-md:top-[env(safe-area-inset-top)] z-sticky -mx-4 sm:-mx-6 px-4 sm:px-6 -my-2.5 py-2.5 bg-app before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-app";

/** Tonal tile inside a card (stats, readings, nested rows). */
export const TILE = "rounded-lg bg-field border border-line";

/** Section heading row: <div className={SECTION_HEAD}><h2 className={SECTION_TITLE}>…</h2><span className={COUNT_PILL}>3</span></div> */
export const SECTION_HEAD = "flex items-center gap-2 px-1";
export const SECTION_TITLE = "text-ui font-semibold text-contrast tracking-tight";
export const COUNT_PILL = "h-4 min-w-[18px] px-1.5 rounded-full bg-raised text-caption tabular-nums text-muted inline-flex items-center justify-center";

/** Text link on the right of a section heading ("Quản lý ›"). */
export const SECTION_LINK = "ml-auto inline-flex items-center gap-1 text-label font-medium text-muted hover:text-contrast transition";

/** Empty state: dashed card, icon above one short line. Usually a <button> that adds the first item. */
export const EMPTY =
  "rounded-xl border border-dashed border-line p-8 flex flex-col items-center gap-2.5 text-center text-label text-muted hover:text-contrast hover:border-line-hover transition outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50";

/** Non-interactive empty state (EmptyState): same dashed card as EMPTY without the hover. */
export const EMPTY_STATIC =
  "rounded-xl border border-dashed border-line p-8 flex flex-col items-center gap-2.5 text-center text-label text-muted";

/** Square icon-only action button in a card header (edit, delete, more). */
export const ICON_BTN =
  "w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-contrast bg-field hover:bg-raised border border-line transition outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 active:scale-95";
export const ICON_BTN_DANGER =
  "w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-danger-fg bg-field hover:bg-danger-bg active:bg-danger-border border border-line transition outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 active:scale-95";

/** Close button in modal headers: visible background pill with clear contrast, easily tappable on dark backgrounds. */
export const MODAL_CLOSE =
  "w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-field hover:bg-raised text-muted hover:text-contrast flex items-center justify-center transition outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 border border-line active:scale-95 shrink-0";

/** Status pill (device state, job result): coloured 15% fill + 300 text. */
export const STATUS_PILL = "inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-caption font-medium whitespace-nowrap";

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
export const BADGE_BASE = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-caption font-medium border whitespace-nowrap";

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
 * iPad / desktop (>= sm): centred dialog (max-h-[92dvh], rounded-2xl, border-line).
 * Pass only the max-width at the call site (`max-w-md`…).
 */
export const MODAL_BACKDROP =
  "fixed inset-0 z-modal flex items-stretch sm:items-center justify-center sm:p-4 bg-overlay backdrop-blur-lg";
export const MODAL_PANEL =
  "bg-panel border-line max-sm:border-0 sm:border max-sm:rounded-none sm:rounded-2xl w-full shadow-overlay max-sm:h-dvh max-sm:max-h-dvh sm:max-h-[92dvh] overflow-y-auto overscroll-contain flex flex-col";
/** Modal header row: icon/title left, close button right. Includes safe-area padding on mobile. */
export const MODAL_HEAD = "px-5 pt-4 max-sm:pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3 shrink-0";
/** Modal title. */
export const MODAL_TITLE = "text-title font-semibold text-contrast tracking-tight truncate";
/** Modal footer: buttons right-aligned; stretched on a phone with safe-area bottom padding. */
export const MODAL_FOOT =
  "px-5 py-3 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-divider flex items-center justify-end gap-2 shrink-0 max-sm:*:flex-1";

/** Form field label above an input/select/textarea. */
export const FIELD_LABEL = "block text-label font-medium text-muted mb-1";

/** Form text input: semantic field surface with crisp border-line. */
export const FIELD_INPUT =
  "w-full h-9 bg-field border border-line hover:border-line-hover rounded-lg px-3 text-ui text-contrast placeholder:text-muted focus:outline-none focus:border-primary-500/50 focus:bg-raised transition-colors disabled:opacity-40";

/** Form textarea: matches FIELD_INPUT contrast and focus border. */
export const FIELD_TEXTAREA =
  "w-full bg-field border border-line hover:border-line-hover rounded-lg px-3 py-2 text-ui text-contrast placeholder:text-muted focus:outline-none focus:border-primary-500/50 focus:bg-raised transition-colors disabled:opacity-40";

/** 2-panel floating Bento shell classes (used by AppShell). */
export const SHELL_OUTER =
  "h-dvh overflow-hidden flex flex-col md:flex-row md:p-2 md:gap-2 bg-app md:bg-canvas text-body";
export const SHELL_ASIDE =
  "max-md:hidden shrink-0 rounded-2xl bg-panel border border-line flex flex-col overflow-hidden select-none transition-[width] duration-200";
export const SHELL_MAIN =
  "flex-1 min-w-0 min-h-0 md:rounded-2xl bg-app md:border md:border-line overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col";
export const SHELL_CONTAINER =
  "flex-1 min-w-0 w-full max-w-[1440px] mx-auto px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-8 pb-8 sm:pb-10 flex flex-col";
