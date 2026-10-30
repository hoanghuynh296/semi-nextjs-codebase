// Shared inline stroke icons + tinted icon tiles (docs/DESIGN_SYSTEM.md §14–15).
// No icon library is installed in web/: add a Lucide-style 24×24 path here instead of inlining another <svg>.
import React from "react";

export const ICONS = {
  // Apps / areas
  home: "M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z",
  slicer: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18m8-13.5L12 12 4 7.5",
  palette:
    "M12 21a9 9 0 110-18c4.97 0 9 3.58 9 8a4 4 0 01-4 4h-1.5a1.5 1.5 0 00-1.1 2.5A1.5 1.5 0 0112 21zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01M17 11h.01",
  camera:
    "M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  printer: "M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a2 2 0 012-2h14a2 2 0 012 2v6a1 1 0 01-1 1h-2M7 14h10v7H7z",
  spool: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-6a3 3 0 100-6 3 3 0 000 6zm0-12v6m0 6v6",
  coin: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-13.5v9m2.5-7.25c-.6-.7-1.5-1-2.5-1-1.4 0-2.5.8-2.5 1.9 0 2.6 5 1.3 5 3.9 0 1.1-1.1 1.95-2.5 1.95-1 0-1.9-.35-2.5-1",
  plug: "M9 3v4m6-4v4M7 7h10v4a5 5 0 01-10 0V7zm5 9v5",
  zap: "M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z",
  code: "M8 8l-4 4 4 4m8-8l4 4-4 4M14 5l-4 14",
  sliders: "M4 6h10m4 0h2M4 12h4m4 0h8M4 18h12m4 0h0M14 4v4m-6 2v4m8 2v4",
  // Devices / sensors
  power: "M12 3v9m6.36-5.36a9 9 0 11-12.72 0",
  light: "M9 18h6m-5 3h4M12 3a6 6 0 00-3.6 10.8c.6.45.9 1.1.9 1.8V16h5.4v-.4c0-.7.3-1.35.9-1.8A6 6 0 0012 3z",
  sensor: "M14 14.76V5a2 2 0 10-4 0v9.76a4 4 0 104 0zM12 17.5h.01",
  drop: "M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z",
  nozzle: "M9 3h6v5l-2 3v3h-2v-3L9 8V3zm3 14v4",
  bed: "M3 17h18M5 17v-3h14v3M8 14v-2m4 2v-2m4 2v-2",
  fan: "M12 12a2 2 0 100-4 2 2 0 000 4zm0-4c0-3 1-5 3.5-5S19 6 12 10m0 2c3 0 5 1 5 3.5S14 19 10 12m2 0c0 3-1 5-3.5 5S5 14 12 10",
  wifi: "M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01M2 9a15 15 0 0120 0",
  // Actions
  plus: "M12 5v14m7-7H5",
  edit: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  copy: "M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-2M10 2h8a2 2 0 012 2v12a2 2 0 01-2 2h-8a2 2 0 01-2-2V4a2 2 0 012-2z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  close: "M6 6l12 12M18 6L6 18",
  search: "M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z",
  refresh: "M4 4v5h5M20 20v-5h-5M5.6 15a7 7 0 0011.9 2.3L20 15M4 9l2.5-2.3A7 7 0 0118.4 9",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  shrink: "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7",
  download: "M12 4v11m0 0l-4-4m4 4l4-4M5 20h14",
  upload: "M12 20V9m0 0l-4 4m4-4l4 4M5 4h14",
  play: "M7 5.5a1.5 1.5 0 012.3-1.3l10 6.5a1.5 1.5 0 010 2.6l-10 6.5A1.5 1.5 0 017 18.5v-13z",
  pause: "M8 5v14M16 5v14",
  stop: "M6 7a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H7a1 1 0 01-1-1V7z",
  settings:
    "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 00-2-1.2L14.5 3h-4l-.4 2.6a7.5 7.5 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 002 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  logout: "M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5m5 5H3",
  menu: "M4 7h16M4 12h16M4 17h16",
  sidebar: "M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zm5 0v16",
  // Arrows / status
  arrow: "M7 17L17 7M9 7h8v8",
  external: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  chevron: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M18 15l-6-6-6 6",
  arrowRight: "M14 5l7 7-7 7M21 12H3",
  reset: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5",
  backspace: "M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83A2.25 2.25 0 0111.01 4.17H19.5a2.25 2.25 0 012.25 2.25v11.25a2.25 2.25 0 01-2.25 2.25h-8.49a2.25 2.25 0 01-1.59-.66z",
  back: "M15 6l-6 6 6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 9v4m0 4h.01M10.3 3.9L2.4 17.5A2 2 0 004.1 20.5h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-10v5m0-8h.01",
  calendar: "M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v5l3 2",
  block: "M12 21a9 9 0 100-18 9 9 0 000 18zM5.6 5.6l12.8 12.8",
  grid: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z",
  lock: "M7 11V8a5 5 0 0110 0v3M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1z",
  box: "M21 8l-9-5-9 5m18 0v8l-9 5m9-13l-9 5m0 8l-9-5V8m9 13v-8M3 8l9 5",
  eye: "M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  chart: "M5 20V11M12 20V5M19 20v-6M3 20h18",
  scissors: "M6 9a3 3 0 100-6 3 3 0 000 6zm0 12a3 3 0 100-6 3 3 0 000 6zM20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12",
  unlock: "M7 11V8a5 5 0 019.9-1M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1z",
  brush: "M9.1 14.9l-1.6 1.6a2.5 2.5 0 01-3.5 3.5L3 21c2 0 3.5-.5 4.5-1.5a2.5 2.5 0 000-3.5M9.1 14.9L19.5 4.5a1.5 1.5 0 012.1 2.1L11.2 17M9.1 14.9l2.1 2.1",
  undo: "M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11",
  cart: "M3 4h2l2.4 11.2a1 1 0 001 .8h9.2a1 1 0 001-.8L21 8H6.2M9 20.5a.5.5 0 100-1 .5.5 0 000 1zm9 0a.5.5 0 100-1 .5.5 0 000 1z",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5",
  merge: "M8 3v4a5 5 0 005 5h3M8 21V3M16 9l3 3-3 3",
  shuffle: "M16 4h4v4M4 20L20 4M20 16v4h-4M15 15l5 5M4 4l5 5",
  eyeOff: "M3 3l18 18M10.6 5.1A9.8 9.8 0 0112 5c6 0 9.5 7 9.5 7a16 16 0 01-2.7 3.6M6.6 6.6A15.6 15.6 0 002.5 12S6 19 12 19a9.6 9.6 0 005.4-1.6M9.9 9.9a3 3 0 004.2 4.2",
  image: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm-1 11l5-5 5 5m-2-2l2-2 5 5M15.5 9.5h.01",
  minus: "M5 12h14",
  sparkles: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zm7 12l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z",
  send: "M5 12h13M12 5l7 7-7 7",
  resize: "M20 9v11H9",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className = "w-4 h-4",
  strokeWidth = 1.75,
  title,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  title?: string;
}) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name]} />
    </svg>
  );
}

/**
 * Soft tints of icon tiles: one colour per area (nav tab, page header, card headers of that area) so tabs are easy
 * to tell apart, while chips, pills and buttons stay neutral. Tints only (15% fill + light icon), no gradients.
 */
export const TILE_TONES = {
  green: "bg-primary-500/15 text-primary-400", // main areas, "on" states
  pink: "bg-pink-500/15 text-pink-300", // filament, colours, sensors
  sky: "bg-sky-500/15 text-sky-300", // camera, print hours
  amber: "bg-amber-500/15 text-amber-300", // peripherals, lights
  violet: "bg-indigo-500/15 text-indigo-300", // automation
  gray: "bg-white/[0.06] text-gray-300", // advanced / unknown
} as const;

/** Icon colour of each tone when it stands alone (inactive nav item). */
export const TONE_TEXT = {
  green: "text-primary-400",
  pink: "text-pink-400",
  sky: "text-sky-400",
  amber: "text-amber-400",
  violet: "text-indigo-400",
  gray: "text-gray-400",
} as const;

export type TileTone = keyof typeof TILE_TONES;

/** Rounded square with an icon: the leading visual of cards, list rows and dialogs. */
export function IconTile({
  name,
  tone = "green",
  size = "md",
  className = "",
}: {
  name: IconName;
  tone?: TileTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = size === "sm" ? "w-8 h-8 rounded-lg" : size === "lg" ? "w-12 h-12 rounded-xl" : "w-10 h-10 rounded-lg";
  const ico = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <span className={`${box} ${TILE_TONES[tone]} flex items-center justify-center shrink-0 ${className}`}>
      <Icon name={name} className={ico} />
    </span>
  );
}
