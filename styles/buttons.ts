// Shared button classes (docs/QUICK_REF.md): use these instead of re-typing the Tailwind string.
const BASE =
  "inline-flex items-center justify-center gap-1.5 h-[34px] rounded-lg text-[12px] font-medium transition cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed";

/** Main action (Thêm, Lưu). */
export const BTN_PRIMARY = `${BASE} px-3 bg-primary-500 hover:bg-primary-400 active:scale-[0.98] text-white`;

/** Secondary action (Làm mới, Tính lại, Đóng). */
export const BTN_SECONDARY = `${BASE} px-3 bg-white/[0.05] hover:bg-white/[0.10] border border-line text-gray-200 hover:text-white`;

/** Icon-only toolbar button (Thêm, Làm mới): add to BTN_PRIMARY / BTN_SECONDARY; keep `title` + `aria-label`. */
export const BTN_ICON = "w-[34px] !px-0";

/** Destructive action (Dừng in, Xoá). */
export const BTN_DANGER = `${BASE} px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400`;

/** Modal / dialog action base: standard 44px (h-11) touch target on mobile (< sm), 34px on desktop. */
const MODAL_BASE =
  "inline-flex items-center justify-center gap-2 max-sm:h-11 sm:h-[34px] px-4 sm:px-3 rounded-xl sm:rounded-lg max-sm:text-[14px] text-[12px] font-medium transition cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";

/** Main action in dialogs & modals (Lưu, In lại, Gửi lệnh). */
export const MODAL_BTN_PRIMARY = `${MODAL_BASE} bg-primary-500 hover:bg-primary-400 text-white`;

/** Secondary action in dialogs & modals (Huỷ, Đóng). */
export const MODAL_BTN_SECONDARY = `${MODAL_BASE} bg-white/[0.05] hover:bg-white/[0.10] border border-line text-gray-200 hover:text-white`;

/** Destructive action in dialogs & modals (Dừng in, Xoá). */
export const MODAL_BTN_DANGER = `${MODAL_BASE} bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400`;

