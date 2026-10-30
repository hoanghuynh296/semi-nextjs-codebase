// Shared chrome of the stand-alone apps (tool apps with a canvas / 3D view): header buttons and the floating controls
// over the canvas. One string per element, so every tool app looks the same (docs/DESIGN_SYSTEM.md §4b).

/** Icon-only header button (AI, toggles): 34 px square, bordered. Add `HEADER_ICON_ON` when on. */
export const HEADER_ICON_BTN =
  "w-[34px] h-[34px] rounded-lg border border-line flex items-center justify-center transition shrink-0 disabled:opacity-40";
export const HEADER_ICON_OFF = "text-gray-300 hover:text-white hover:bg-white/[0.06]";
export const HEADER_ICON_ON = "bg-white/[0.10] text-white";

/** The app's main action at the right of the header (Slice, Phối màu, Xong). */
export const headerPrimary = (enabled: boolean) =>
  `h-[34px] px-4 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition select-none shrink-0 ${
    enabled ? "bg-primary-500 hover:bg-primary-400 text-white" : "bg-raised text-gray-400 border border-line cursor-not-allowed"
  }`;

/** Round pill buttons of the header centre (file badge, save). */
export const HEADER_PILL =
  "h-[34px] flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] active:scale-95 border border-line hover:border-primary-500/50 rounded-full transition";

/** Floating tool bar at the top centre of the 3D view (object tools). */
export const VIEWPORT_TOOLBAR =
  "absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-1rem)] flex items-center bg-panel/95 backdrop-blur-md border border-line p-1 sm:p-1.5 rounded-2xl z-20 select-none shadow-xl";
/** A tool of that bar; add `VIEWPORT_TOOL_ON` when active. */
export const VIEWPORT_TOOL =
  "h-10 sm:h-11 min-w-10 sm:min-w-11 px-2 rounded-xl text-gray-300 hover:text-white bg-transparent hover:bg-white/[0.08] border border-transparent hover:border-line active:scale-95 transition flex items-center justify-center gap-1.5 text-[12px] font-medium cursor-pointer disabled:opacity-30 disabled:pointer-events-none";
export const VIEWPORT_TOOL_ON = "bg-white/[0.1] !border-primary-500/70 text-white";

/** Undo / redo pill at the bottom centre of the 3D view. */
export const VIEWPORT_PILL =
  "absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center bg-panel/95 border border-line backdrop-blur-md rounded-2xl p-1 gap-1 select-none shadow-xl";
export const VIEWPORT_PILL_BTN =
  "w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-gray-300 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none";

/** Round view button at the bottom left of the 3D view (fit the model). */
export const VIEWPORT_ROUND_BTN =
  "w-10 h-10 rounded-full bg-panel/90 border border-line backdrop-blur-md text-gray-300 hover:text-white hover:border-line-hover flex items-center justify-center transition active:scale-95 shadow-lg";

/** Info badge at the bottom right of the 3D view (size, count). */
export const VIEWPORT_BADGE =
  "absolute bottom-4 right-4 z-20 bg-panel/80 backdrop-blur-md border border-line px-3 py-1.5 rounded-xl text-[12px] text-gray-300 tabular-nums flex items-center gap-1.5 shadow-lg select-none";
