// Shared button classes (docs/QUICK_REF.md, DESIGN_SYSTEM.md §9): use these instead of re-typing the Tailwind string.
// 1.0 (#146): ordinary actions are neutral; the brand fill (PRIMARY / SECONDARY) is only for the one main button of a
// page, a dialog or the nav, or a case the app's owner asks for.

/**
 * What every variant shares: content text (text-ui, 14px), hover in 150ms (transition-hover = --motion-hover), a 2px
 * focus outline (outline-focus, the strong text colour, as on fields), a neutral disabled look for every variant
 * (brand ones too), and one press (PRESS: 98% while pressed, none under reduced motion) for every variant
 * (#218). Not `relative` (Button adds it for the corner badge unless its className positions it) and not
 * BTN_HIT: Button adds the phone touch size; a BTN_* on a Link adds BTN_HIT itself.
 */
const CORE =
  "inline-flex items-center justify-center gap-1.5 rounded-control font-medium transition-hover motion-safe:active:scale-[0.98] outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus cursor-pointer shrink-0 whitespace-nowrap " +
  "disabled:cursor-not-allowed disabled:!bg-subtle-button disabled:!text-muted disabled:!border-transparent disabled:active:!scale-100";
const BASE = `${CORE} h-control text-ui`;

/** Ordinary action (the default): translucent neutral fill (subtle-button), strong text. */
export const BTN_SUBTLE = `${BASE} px-3 bg-subtle-button hover:bg-tint-hover text-strong`;

/** Toolbar action (Mời, Tuỳ chỉnh): the raised surface fill. */
export const BTN_SURFACE = `${BASE} px-3 bg-raised hover:bg-raised-2 text-strong`;

/** Main action of a card or of a list page's title row (Thêm, Xem): the strong text colour as the fill. */
export const BTN_INVERSE = `${BASE} px-3 bg-inverted hover:bg-inverted-hover text-on-inverted`;

/** Secondary action beside an inverse one (Chia sẻ): transparent with a 1px outline-line. */
export const BTN_OUTLINE = `${BASE} px-3 bg-transparent border border-outline-line hover:bg-item-hover text-strong`;

/** Icon buttons (32×32 with BTN_ICON), the nav bottom row, quiet row actions: no fill, item-hover on hover. */
export const BTN_GHOST = `${BASE} px-3 bg-transparent hover:bg-item-hover text-body hover:text-strong`;

/** The one main button of a page, a dialog (its commit: Gửi, Lưu) or the nav: the brand primary fill. */
export const BTN_PRIMARY = `${BASE} px-3 bg-primary hover:bg-primary-hover text-on-primary`;

/** A second brand main button: the brand secondary fill (the primary when the brand has none). */
export const BTN_SECONDARY = `${BASE} px-3 bg-secondary hover:bg-secondary-hover text-on-secondary`;

/** Destructive action (Dừng in, Xoá): solid red (danger-fill, hover danger-fill-hover) with white text (on-solid), AA in both themes (#189). */
export const BTN_DANGER = `${BASE} px-3 bg-danger-fill hover:bg-danger-fill-hover text-on-solid`;

/** The quieter destructive look (the danger status tint + line, danger text): the pre-#189 `danger`, for a destructive action that is not the main one. */
export const BTN_DANGER_SUBTLE = `${BASE} px-3 bg-danger-bg hover:bg-danger-bg-hover border border-danger-border text-danger-fg`;

/** Icon-only button: add to any BTN_* constant (square, h-control); keep `title` + `aria-label`. Carries the phone touch
 * size (BTN_HIT: 44 × 44px on a touch phone), so a hand-built icon button (`${BTN_SUBTLE} ${BTN_ICON}`) gets it too. */
export const BTN_ICON = "w-control !px-0 pointer-coarse:max-sm:min-h-11 pointer-coarse:max-sm:min-w-11";

/** Compact (28px, 12px text) for dense rows and toolbars: add to any BTN_* constant. */
export const BTN_SM = "!h-7 !px-2.5 !text-chrome";

/** Smallest (24px, 12px text): the inverse pill of a list title row, chips of actions. Add to any BTN_* constant. */
export const BTN_XS = "!h-6 !px-2 !text-chrome";

/** Large CTA (40px, 14px / 500, the control radius): the one call to action of a page header (#189; lint `one-large-button`). Add to any BTN_* constant. */
export const BTN_LG = "!h-10 !px-4 !text-ui";

/** Small pill CTA (24px, 12px / 500, fully rounded) (#189). Add to any BTN_* constant. */
export const BTN_PILL = "!h-6 !px-2.5 !text-chrome !rounded-full";

/** Dialog / full-width commit: 44px and 15px text on phones, h-control from sm. */
const MODAL_BASE = `${CORE} max-sm:h-11 sm:h-control px-4 sm:px-3 max-sm:text-lead text-ui gap-2`;

/** Surface / inverse / ghost at dialog size. */
export const MODAL_BTN_SURFACE = `${MODAL_BASE} bg-raised hover:bg-raised-2 text-strong`;
export const MODAL_BTN_INVERSE = `${MODAL_BASE} bg-inverted hover:bg-inverted-hover text-on-inverted`;
export const MODAL_BTN_GHOST = `${MODAL_BASE} bg-transparent hover:bg-item-hover text-body hover:text-strong`;

/** Commit action of a dialog (Lưu, In lại, Gửi lệnh): the brand primary. */
export const MODAL_BTN_PRIMARY = `${MODAL_BASE} bg-primary hover:bg-primary-hover text-on-primary`;

/** Second brand action of a dialog: the brand secondary. */
export const MODAL_BTN_SECONDARY = `${MODAL_BASE} bg-secondary hover:bg-secondary-hover text-on-secondary`;

/** Cancel / close in a dialog (Huỷ, Đóng): subtle. */
export const MODAL_BTN_SUBTLE = `${MODAL_BASE} bg-subtle-button hover:bg-tint-hover text-strong`;

/** Outlined action in a dialog. */
export const MODAL_BTN_OUTLINE = `${MODAL_BASE} bg-transparent border border-outline-line hover:bg-item-hover text-strong`;

/** Destructive confirm in a dialog (Xoá, Dừng in): solid red with white text (AA in both themes, #189). */
export const MODAL_BTN_DANGER = `${MODAL_BASE} bg-danger-fill hover:bg-danger-fill-hover text-on-solid`;

/** The quieter destructive look at dialog size (danger tint + line, danger text): the pre-#189 MODAL_BTN_DANGER. */
export const MODAL_BTN_DANGER_SUBTLE = `${MODAL_BASE} bg-danger-bg hover:bg-danger-bg-hover border border-danger-border text-danger-fg`;

/**
 * 44px touch target on a phone with a touch screen (`pointer-coarse` + `max-sm`): the button itself grows to at least
 * 44 × 44px (min-height / min-width win over the `!h-7` / `!w-7` of sm / xs). Real size, not a pseudo-element, so it
 * never covers a neighbour and never overflows a scroll row. A mouse, a tablet and a desktop keep the drawn size.
 * The shared touch-target pair (docs/DESIGN_SYSTEM.md "Touch targets"): BTN_HIT grows a control that sits in a dense row
 * (pager, view switch, step nav), HIT_AREA (styles/utils.ts) adds an invisible 44px area around an isolated small one.
 */
export const BTN_HIT = "pointer-coarse:max-sm:min-h-11 pointer-coarse:max-sm:min-w-11";

export type ButtonVariantName = "subtle" | "surface" | "inverse" | "outline" | "ghost" | "primary" | "secondary" | "danger" | "danger-subtle";
export type ButtonSizeName = "pill" | "xs" | "sm" | "md" | "lg" | "modal";
const MD: Record<ButtonVariantName, string> = {
  subtle: BTN_SUBTLE, surface: BTN_SURFACE, inverse: BTN_INVERSE, outline: BTN_OUTLINE,
  ghost: BTN_GHOST, primary: BTN_PRIMARY, secondary: BTN_SECONDARY, danger: BTN_DANGER, "danger-subtle": BTN_DANGER_SUBTLE,
};
const MODAL: Record<ButtonVariantName, string> = {
  subtle: MODAL_BTN_SUBTLE, surface: MODAL_BTN_SURFACE, inverse: MODAL_BTN_INVERSE, outline: MODAL_BTN_OUTLINE,
  ghost: MODAL_BTN_GHOST, primary: MODAL_BTN_PRIMARY, secondary: MODAL_BTN_SECONDARY, danger: MODAL_BTN_DANGER,
  "danger-subtle": MODAL_BTN_DANGER_SUBTLE,
};
/** The size classes added to a variant's md constant. */
const SIZE: Record<Exclude<ButtonSizeName, "md" | "modal">, string> = { pill: BTN_PILL, xs: BTN_XS, sm: BTN_SM, lg: BTN_LG };
/** Icon-only width per size (square; pill is a circle). */
const ICON_W: Partial<Record<ButtonSizeName, string>> = { pill: "!w-6", xs: "!w-6", sm: "!w-7", lg: "!w-10" };
/** A className that positions the button itself (then it is already a containing block: no `relative`). */
const POSITIONED = /(^|\s)(?:[\w-]+:)*(absolute|fixed|sticky)(?=\s|$)/;

/** Button's classes: variant × size, icon-only, round, full width, the phone touch size (BTN_HIT: lg and pill too; `hit: false` leaves it out), and `relative` unless className positions it. */
export function buttonClass(
  variant: ButtonVariantName = "subtle",
  size: ButtonSizeName = "md",
  {
    iconOnly = false,
    round = false,
    fullWidth = false,
    hit = true,
    className = "",
  }: {
    iconOnly?: boolean;
    round?: boolean;
    fullWidth?: boolean;
    /** The phone touch size (BTN_HIT, also inside BTN_ICON). `false` keeps the drawn size on a touch phone: give the control an invisible area instead (HIT_AREA, styles/utils.ts), e.g. in a row that must stay short (RouteHeaderBanner, #192). */
    hit?: boolean;
    className?: string;
  } = {},
): string {
  const base = size === "modal" ? MODAL[variant] : size === "md" ? MD[variant] : `${MD[variant]} ${SIZE[size]}`;
  return [
    base,
    // a ::before / ::after position (HIT_AREA's before:absolute) does not position the button itself
    POSITIONED.test(className.split(/\s+/).filter((c) => !/(^|:)(before|after):/.test(c)).join(" ")) ? "" : "relative",
    hit && BTN_HIT,
    iconOnly && (hit ? BTN_ICON : "w-control !px-0"),
    iconOnly && ICON_W[size],
    round && "!rounded-full",
    fullWidth && "w-full",
    className,
  ].filter(Boolean).join(" ");
}
