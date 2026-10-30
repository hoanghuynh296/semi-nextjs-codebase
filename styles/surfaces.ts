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
  online: "bg-emerald-400",
  printing: "bg-primary-400 animate-pulse",
  busy: "bg-amber-400",
  error: "bg-rose-500",
  offline: "bg-gray-500",
} as const;

/** Sub-page toolbar row (filters left, actions right) that sticks to the top of the scrolling content panel.
 * Bleeds to the panel's side padding so cards scroll under an opaque strip; the negative y margin keeps the layout
 * gap unchanged. On phones it sits below the safe area, which `before:` paints over. */
export const STICKY_TOOLBAR =
  "sticky top-0 max-md:top-[env(safe-area-inset-top)] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 -my-2.5 py-2.5 bg-app before:absolute before:inset-x-0 before:bottom-full before:h-[env(safe-area-inset-top)] before:bg-app";

/** Tonal tile inside a card (stats, readings, nested rows). */
export const TILE = "rounded-lg bg-white/[0.04] border border-white/[0.06]";

/** Section heading row: <div className={SECTION_HEAD}><h2 className={SECTION_TITLE}>…</h2><span className={COUNT_PILL}>3</span></div> */
export const SECTION_HEAD = "flex items-center gap-2 px-1";
export const SECTION_TITLE = "text-[13px] font-semibold text-white tracking-tight";
export const COUNT_PILL = "h-4 min-w-[18px] px-1.5 rounded-full bg-white/[0.07] text-[11px] tabular-nums text-gray-300 inline-flex items-center justify-center";

/** Text link on the right of a section heading ("Quản lý ›"). */
export const SECTION_LINK = "ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-gray-400 hover:text-white transition";

/** Empty state: dashed card, icon above one short line. Usually a <button> that adds the first item. */
export const EMPTY =
  "rounded-xl border border-dashed border-line p-8 flex flex-col items-center gap-2.5 text-center text-[12px] text-gray-400 hover:text-white hover:border-line-hover transition";

/** Square icon-only action button in a card header (edit, delete, more). */
export const ICON_BTN =
  "w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.10] active:bg-white/[0.15] border border-white/[0.06] transition active:scale-95";
export const ICON_BTN_DANGER =
  "w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 bg-white/[0.05] hover:bg-rose-500/10 active:bg-rose-500/20 border border-white/[0.06] transition active:scale-95";

/** Close button in modal headers: visible background pill with clear contrast, easily tappable on dark backgrounds. */
export const MODAL_CLOSE =
  "w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:bg-white/[0.22] text-gray-200 hover:text-white flex items-center justify-center transition border border-white/[0.08] active:scale-95 shrink-0";

/** Status pill (device state, job result): coloured 15% fill + 300 text. */
export const STATUS_PILL = "inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] font-medium";

/**
 * Modal shell: backdrop + panel.
 * Phones (< sm): full screen (edge-to-edge, h-dvh, rounded-none, border-0).
 * iPad / desktop (>= sm): centred dialog (max-h-[92dvh], rounded-2xl, border-line).
 * Pass only the max-width at the call site (`max-w-md`…).
 */
export const MODAL_BACKDROP =
  "fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-lg";
export const MODAL_PANEL =
  "bg-field border-line max-sm:border-0 sm:border max-sm:rounded-none sm:rounded-2xl w-full shadow-2xl max-sm:h-dvh max-sm:max-h-dvh sm:max-h-[92dvh] overflow-y-auto overscroll-contain flex flex-col";
/** Modal header row: icon/title left, close button right. Includes safe-area padding on mobile. */
export const MODAL_HEAD = "px-5 pt-4 max-sm:pt-[max(1rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3 shrink-0";
/** Modal title. */
export const MODAL_TITLE = "text-[15px] font-semibold text-white tracking-tight truncate";
/** Modal footer: buttons right-aligned; stretched on a phone with safe-area bottom padding. */
export const MODAL_FOOT =
  "px-5 py-3 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-divider flex items-center justify-end gap-2 shrink-0 max-sm:*:flex-1";
