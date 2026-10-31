// Shared button classes (docs/QUICK_REF.md): use these instead of re-typing the Tailwind string.
const BASE =
  "inline-flex items-center justify-center gap-1.5 h-[34px] rounded-lg text-label font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed";

/** Main action (Thêm, Lưu). */
export const BTN_PRIMARY = `${BASE} px-3 bg-accent hover:bg-accent-hover active:scale-[0.98] text-on-accent`;

/** Secondary action (Làm mới, Tính lại, Đóng). */
export const BTN_SECONDARY = `${BASE} px-3 bg-field hover:bg-raised border border-line text-body hover:text-contrast`;

/** Icon-only toolbar button (Thêm, Làm mới): add to BTN_PRIMARY / BTN_SECONDARY; keep `title` + `aria-label`. */
export const BTN_ICON = "w-[34px] !px-0";

/** Destructive action (Dừng in, Xoá). */
export const BTN_DANGER = `${BASE} px-3 bg-danger-bg hover:bg-danger-border border border-danger-border text-danger-fg`;

/** Modal / dialog action base: standard 44px (h-11) touch target on mobile (< sm), 34px on desktop. */
const MODAL_BASE =
  "inline-flex items-center justify-center gap-2 max-sm:h-11 sm:h-[34px] px-4 sm:px-3 rounded-xl sm:rounded-lg max-sm:text-ui-lg text-label font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";

/** Main action in dialogs & modals (Lưu, In lại, Gửi lệnh). */
export const MODAL_BTN_PRIMARY = `${MODAL_BASE} bg-accent hover:bg-accent-hover text-on-accent`;

/** Secondary action in dialogs & modals (Huỷ, Đóng). */
export const MODAL_BTN_SECONDARY = `${MODAL_BASE} bg-field hover:bg-raised border border-line text-body hover:text-contrast`;

/** Destructive action in dialogs & modals (Dừng in, Xoá). */
export const MODAL_BTN_DANGER = `${MODAL_BASE} bg-danger-bg hover:bg-danger-border border border-danger-border text-danger-fg`;

/** Quiet action without a surface (row actions, "Xem thêm", cancel inside a toolbar). */
export const BTN_GHOST = `${BASE} px-3 bg-transparent hover:bg-raised text-body hover:text-contrast`;

/** Smaller control height (28px) for dense rows: add to any BTN_* constant. */
export const BTN_SM = "!h-7 !px-2.5 !text-caption";
