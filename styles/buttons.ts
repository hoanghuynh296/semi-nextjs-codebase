// Shared button classes (docs/QUICK_REF.md, DESIGN_SYSTEM.md §9): use these instead of re-typing the Tailwind string.
// 1.0 (#146): ordinary actions are neutral; the brand fill (PRIMARY / SECONDARY) is only for the one main button of a
// page, a dialog or the nav, or a case the app's owner asks for.

/**
 * What every variant shares: content text (text-ui, 14px), hover in 150ms (transition-hover = --motion-hover), a 2px
 * focus outline (outline-focus, the strong text colour, as on fields), a neutral disabled look for every variant
 * (brand ones too). Not `relative`: Button adds it (and BTN_HIT) unless its className positions it; a BTN_* on a
 * Link adds `relative` + BTN_HIT itself for the phone hit area.
 */
const CORE =
  "inline-flex items-center justify-center gap-1.5 rounded-control font-medium transition-hover outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus cursor-pointer shrink-0 whitespace-nowrap " +
  "disabled:cursor-not-allowed disabled:!bg-subtle-button disabled:!text-muted disabled:!border-transparent disabled:active:!scale-100";
const BASE = `${CORE} h-control text-ui`;

/** Ordinary action (the default): translucent neutral fill (subtle-button), strong text. */
export const BTN_SUBTLE = `${BASE} px-3 bg-subtle-button hover:bg-tint-hover text-strong`;

/** Toolbar action (Mời, Tuỳ chỉnh): the raised surface fill. */
export const BTN_SURFACE = `${BASE} px-3 bg-raised hover:bg-raised-2 text-strong`;

/** Main action of a card or of a list page's title row (Thêm, Xem): the strong text colour as the fill. */
export const BTN_INVERSE = `${BASE} px-3 bg-inverted hover:bg-inverted-hover text-on-inverted active:scale-[0.98]`;

/** Secondary action beside an inverse one (Chia sẻ): transparent with a 1px outline-line. */
export const BTN_OUTLINE = `${BASE} px-3 bg-transparent border border-outline-line hover:bg-item-hover text-strong`;

/** Icon buttons (32×32 with BTN_ICON), the nav bottom row, quiet row actions: no fill, item-hover on hover. */
export const BTN_GHOST = `${BASE} px-3 bg-transparent hover:bg-item-hover text-body hover:text-strong`;

/** The one main button of a page, a dialog (its commit: Gửi, Lưu) or the nav: the brand primary fill. */
export const BTN_PRIMARY = `${BASE} px-3 bg-primary hover:bg-primary-hover text-on-primary active:scale-[0.98]`;

/** A second brand main button: the brand secondary fill (the primary when the brand has none). */
export const BTN_SECONDARY = `${BASE} px-3 bg-secondary hover:bg-secondary-hover text-on-secondary active:scale-[0.98]`;

/** Destructive action (Dừng in, Xoá): the danger status fill (tint + line) with danger text. */
export const BTN_DANGER = `${BASE} px-3 bg-danger-bg hover:bg-danger-bg-hover border border-danger-border text-danger-fg`;

/** Icon-only button: add to any BTN_* constant (square, h-control); keep `title` + `aria-label`. */
export const BTN_ICON = "w-control !px-0";

/** Compact (28px, 12px text) for dense rows and toolbars: add to any BTN_* constant. */
export const BTN_SM = "!h-7 !px-2.5 !text-chrome";

/** Smallest (24px, 12px text): the inverse pill of a list title row, chips of actions. Add to any BTN_* constant. */
export const BTN_XS = "!h-6 !px-2 !text-chrome";

/** Dialog / full-width commit: 44px and 15px text on phones, h-control from sm. */
const MODAL_BASE = `${CORE} max-sm:h-11 sm:h-control px-4 sm:px-3 max-sm:text-lead text-ui gap-2`;

/** Surface / inverse / ghost at dialog size. */
export const MODAL_BTN_SURFACE = `${MODAL_BASE} bg-raised hover:bg-raised-2 text-strong`;
export const MODAL_BTN_INVERSE = `${MODAL_BASE} bg-inverted hover:bg-inverted-hover text-on-inverted active:scale-[0.98]`;
export const MODAL_BTN_GHOST = `${MODAL_BASE} bg-transparent hover:bg-item-hover text-body hover:text-strong`;

/** Commit action of a dialog (Lưu, In lại, Gửi lệnh): the brand primary. */
export const MODAL_BTN_PRIMARY = `${MODAL_BASE} bg-primary hover:bg-primary-hover text-on-primary active:scale-[0.98]`;

/** Second brand action of a dialog: the brand secondary. */
export const MODAL_BTN_SECONDARY = `${MODAL_BASE} bg-secondary hover:bg-secondary-hover text-on-secondary active:scale-[0.98]`;

/** Cancel / close in a dialog (Huỷ, Đóng): subtle. */
export const MODAL_BTN_SUBTLE = `${MODAL_BASE} bg-subtle-button hover:bg-tint-hover text-strong`;

/** Outlined action in a dialog. */
export const MODAL_BTN_OUTLINE = `${MODAL_BASE} bg-transparent border border-outline-line hover:bg-item-hover text-strong`;

/** Destructive confirm in a dialog (Xoá, Dừng in): the danger status fill (tint + line, danger text: AA in both themes). */
export const MODAL_BTN_DANGER = `${MODAL_BASE} bg-danger-bg hover:bg-danger-bg-hover border border-danger-border text-danger-fg active:scale-[0.98]`;

/**
 * The hit area (HIT_AREA of styles/utils, repeated here so this file has no imports): a 24px pseudo-element on a fine
 * pointer, 44px on a touch screen (any-pointer-coarse), centred, never smaller than the button. Needs a positioned button.
 */
export const BTN_HIT =
  "before:absolute before:top-1/2 before:left-1/2 before:size-6 before:min-w-full before:min-h-full before:-translate-1/2 any-pointer-coarse:before:size-[44px]";

export type ButtonVariantName = "subtle" | "surface" | "inverse" | "outline" | "ghost" | "primary" | "secondary" | "danger";
export type ButtonSizeName = "xs" | "sm" | "md" | "modal";
const MD: Record<ButtonVariantName, string> = {
  subtle: BTN_SUBTLE, surface: BTN_SURFACE, inverse: BTN_INVERSE, outline: BTN_OUTLINE,
  ghost: BTN_GHOST, primary: BTN_PRIMARY, secondary: BTN_SECONDARY, danger: BTN_DANGER,
};
const MODAL: Record<ButtonVariantName, string> = {
  subtle: MODAL_BTN_SUBTLE, surface: MODAL_BTN_SURFACE, inverse: MODAL_BTN_INVERSE, outline: MODAL_BTN_OUTLINE,
  ghost: MODAL_BTN_GHOST, primary: MODAL_BTN_PRIMARY, secondary: MODAL_BTN_SECONDARY, danger: MODAL_BTN_DANGER,
};
/** A className that positions the button itself (then it is already a containing block: no `relative`). */
const POSITIONED = /(^|\s)(?:[\w-]+:)*(absolute|fixed|sticky)(?=\s|$)/;

/** Button's classes: variant × size, icon-only, round, full width, the hit area, and `relative` unless className positions it. */
export function buttonClass(
  variant: ButtonVariantName = "subtle",
  size: ButtonSizeName = "md",
  { iconOnly = false, round = false, fullWidth = false, className = "" }: { iconOnly?: boolean; round?: boolean; fullWidth?: boolean; className?: string } = {},
): string {
  const base = size === "modal" ? MODAL[variant] : size === "sm" ? `${MD[variant]} ${BTN_SM}` : size === "xs" ? `${MD[variant]} ${BTN_XS}` : MD[variant];
  return [
    base,
    POSITIONED.test(className) ? "" : "relative",
    BTN_HIT,
    iconOnly && BTN_ICON,
    iconOnly && size === "sm" && "!w-7",
    iconOnly && size === "xs" && "!w-6",
    round && "!rounded-full",
    fullWidth && "w-full",
    className,
  ].filter(Boolean).join(" ");
}
