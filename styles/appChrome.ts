// Shared chrome of the stand-alone apps (tool apps with a canvas / 3D view): header buttons and the floating controls
// over the canvas. One string per element, so every tool app looks the same (docs/DESIGN_SYSTEM.md §4b).

/** Icon-only header button (AI, toggles): 34 px square, bordered, 44px on a touch phone (BTN_HIT). Add `HEADER_ICON_ON` when on. */
export const HEADER_ICON_BTN =
  "w-control h-control pointer-coarse:max-sm:min-h-11 pointer-coarse:max-sm:min-w-11 rounded-control border border-line flex items-center justify-center transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus shrink-0 disabled:opacity-40";
export const HEADER_ICON_OFF = "text-muted hover:text-strong hover:bg-raised";
export const HEADER_ICON_ON = "bg-raised text-strong";

/** The app's main action at the right of the header (Slice, Phối màu, Xong). */
export const headerPrimary = (enabled: boolean) =>
  `h-control px-4 rounded-control text-chrome font-semibold flex items-center justify-center gap-1.5 transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus select-none shrink-0 ${
    enabled ? "bg-primary hover:bg-primary-hover text-on-primary" : "bg-raised text-muted border border-line cursor-not-allowed"
  }`;

/** Round pill buttons of the header centre (file badge, save). */
export const HEADER_PILL =
  "h-control flex items-center gap-2 bg-field hover:bg-raised motion-safe:active:scale-[0.98] border border-line hover:border-outline-line rounded-full transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus text-body";

/** Floating tool bar at the top centre of the 3D view (object tools). */
export const VIEWPORT_TOOLBAR =
  "absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-1rem)] flex items-center bg-panel/95 backdrop-blur-md border border-line p-1 sm:p-1.5 rounded-panel z-20 select-none shadow-float";
/** A tool of that bar; add `VIEWPORT_TOOL_ON` when active. */
export const VIEWPORT_TOOL =
  "h-10 sm:h-11 min-w-10 sm:min-w-11 px-2 rounded-card text-muted hover:text-strong bg-transparent hover:bg-raised border border-transparent hover:border-line motion-safe:active:scale-[0.98] transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus flex items-center justify-center gap-1.5 text-ui font-medium cursor-pointer disabled:opacity-30 disabled:pointer-events-none";
export const VIEWPORT_TOOL_ON = "bg-raised !border-strong text-strong";

/** Undo / redo pill at the bottom centre of the 3D view. */
export const VIEWPORT_PILL =
  "absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center bg-panel/95 border border-line backdrop-blur-md rounded-panel p-1 gap-1 select-none shadow-float";
export const VIEWPORT_PILL_BTN =
  "w-10 h-10 sm:w-11 sm:h-11 rounded-card text-muted hover:text-strong hover:bg-raised flex items-center justify-center transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus motion-safe:active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none";

/** Round view button at the bottom left of the 3D view (fit the model). */
export const VIEWPORT_ROUND_BTN =
  "w-10 h-10 rounded-full bg-panel/90 border border-line backdrop-blur-md text-muted hover:text-strong hover:border-line-hover flex items-center justify-center transition-hover outline-none focus-visible:ring-2 focus-visible:ring-focus motion-safe:active:scale-[0.98] shadow-float";

/** Info badge at the bottom right of the 3D view (size, count). */
export const VIEWPORT_BADGE =
  "absolute bottom-4 right-4 z-20 bg-panel/80 backdrop-blur-md border border-line px-3 py-1.5 rounded-card text-chrome text-muted tabular-nums flex items-center gap-1.5 shadow-float select-none";
