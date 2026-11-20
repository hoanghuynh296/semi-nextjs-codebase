// Small shared helpers of the Semi classes (no dependencies).

/** Join class names, skipping falsy parts: cn(BTN_PRIMARY, busy && "opacity-60", className). Later classes are
 * appended, not merged: to change a Semi surface pick another constant / prop instead of overriding it. */
export function cn(...parts: Array<string | false | null | undefined | 0>): string {
  return parts.filter(Boolean).join(" ");
}

/** Keyboard focus ring for custom controls (buttons, tabs, options). Visible on keyboard focus only. */
export const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-panel";

/** The click area of a control drawn smaller than 24px (a dot, a thumb, a text button in a line): at least 24 × 24 px
 * around its centre (WCAG 2.5.8), 44 × 44 px on a touch screen, from a pseudo-element, so the visible size and the
 * layout stay. The control needs `relative` (or another position) and no ::before of its own. */
export const HIT_AREA =
  "before:absolute before:top-1/2 before:left-1/2 before:size-6 before:min-w-full before:min-h-full before:-translate-1/2 any-pointer-coarse:before:size-[44px]";

/** The chosen segment of a segmented control (Pills, Toggle, pill Tabs, theme / style switcher). The tonal fill alone
 * is too faint to tell which one is on, so an inset control-line ring marks it at ≥ 3:1 (WCAG 1.4.11). */
export const SEGMENT_ON = "bg-raised text-contrast ring-1 ring-inset ring-control-line";

/** Full-screen backdrop of modals, dialogs and sheets (themed overlay colour + blur). Add a z-* layer. */
export const OVERLAY = "fixed inset-0 bg-overlay backdrop-blur-lg";
