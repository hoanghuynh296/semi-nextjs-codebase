// Small shared helpers of the Semi classes (no dependencies).

/** Join class names, skipping falsy parts: cn(BTN_PRIMARY, busy && "opacity-60", className). Later classes are
 * appended, not merged: to change a Semi surface pick another constant / prop instead of overriding it. */
export function cn(...parts: Array<string | false | null | undefined | 0>): string {
  return parts.filter(Boolean).join(" ");
}

/** Keyboard focus ring for custom controls (buttons, tabs, options). Visible on keyboard focus only. */
export const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-panel";

/** Full-screen backdrop of modals, dialogs and sheets (themed overlay colour + blur). Add a z-* layer. */
export const OVERLAY = "fixed inset-0 bg-overlay backdrop-blur-lg";
