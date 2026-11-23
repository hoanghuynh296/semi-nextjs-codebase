// Shared button classes (docs/QUICK_REF.md): use these instead of re-typing the Tailwind string.
const BASE =
  "inline-flex items-center justify-center gap-1.5 h-control rounded-control text-ui font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed";

/** Main action (Thêm, Lưu): the action fill (the accent, or the inverted neutral in a brand with primaryStyle inverted). */
export const BTN_PRIMARY = `${BASE} px-3 bg-primary hover:bg-primary-hover active:scale-[0.98] text-on-primary`;

/** Secondary action (Làm mới, Tính lại, Đóng): translucent tint fill, no border (C-030); reads on every surface. */
export const BTN_SECONDARY = `${BASE} px-3 bg-tint hover:bg-tint-hover text-body hover:text-strong`;

/** Outlined secondary action: field fill and a 1px line, the look of BTN_SECONDARY before 0.36 (a toolbar of framed controls). */
export const BTN_OUTLINE = `${BASE} px-3 bg-field hover:bg-raised border border-line text-body hover:text-strong`;

/** Icon-only toolbar button (Thêm, Làm mới): add to BTN_PRIMARY / BTN_SECONDARY; keep `title` + `aria-label`. */
export const BTN_ICON = "w-control !px-0";

/** Destructive action (Dừng in, Xoá). */
export const BTN_DANGER = `${BASE} px-3 bg-danger-bg hover:bg-danger-border border border-danger-border text-danger-fg`;

/** Modal / dialog action base: standard 44px (h-11) touch target on mobile (< sm), h-control on desktop. */
const MODAL_BASE =
  "inline-flex items-center justify-center gap-2 max-sm:h-11 sm:h-control px-4 sm:px-3 rounded-card sm:rounded-control max-sm:text-lead text-ui font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";

/** Main action in dialogs & modals (Lưu, In lại, Gửi lệnh). */
export const MODAL_BTN_PRIMARY = `${MODAL_BASE} bg-primary hover:bg-primary-hover text-on-primary`;

/** Secondary action in dialogs & modals (Huỷ, Đóng): tint fill, no border. */
export const MODAL_BTN_SECONDARY = `${MODAL_BASE} bg-tint hover:bg-tint-hover text-body hover:text-strong`;

/** Outlined secondary action in dialogs & modals. */
export const MODAL_BTN_OUTLINE = `${MODAL_BASE} bg-field hover:bg-raised border border-line text-body hover:text-strong`;

/** Destructive action in dialogs & modals (Dừng in, Xoá). */
export const MODAL_BTN_DANGER = `${MODAL_BASE} bg-danger-bg hover:bg-danger-border border border-danger-border text-danger-fg`;

/** Quiet action without a surface (row actions, "Xem thêm", cancel inside a toolbar). */
export const BTN_GHOST = `${BASE} px-3 bg-transparent hover:bg-raised text-body hover:text-strong`;

/** Smaller control height (28px) for dense rows: add to any BTN_* constant. */
export const BTN_SM = "!h-7 !px-2.5 !text-ui";
