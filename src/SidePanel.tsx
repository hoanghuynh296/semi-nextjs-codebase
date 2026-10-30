"use client";

// Left settings panel of the stand-alone tool apps: bg-panel, collapses to a thin rail
// with the same sidebar toggle as the home menu. While the width animates the content keeps its full width (clipped)
// so it does not re-wrap every frame.
import React from "react";
import { Icon } from "./Icon";

export const SIDE_PANEL_WIDTH = 320;
export const SIDE_PANEL_COLLAPSED = 48;

/** The collapse toggle placed at the top of the panel content (next to the first label). */
export function SidePanelToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Thu gọn bảng cài đặt"
      title="Thu gọn bảng cài đặt"
      className="w-7 h-7 -my-1 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] transition shrink-0"
    >
      <Icon name="sidebar" className="w-3.5 h-3.5" />
    </button>
  );
}

export function SidePanel({
  id,
  collapsed,
  onToggleCollapse,
  width = SIDE_PANEL_WIDTH,
  children,
}: {
  id?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  width?: number;
  children: React.ReactNode;
}) {
  const [prevCollapsed, setPrevCollapsed] = React.useState(collapsed);
  const [settling, setSettling] = React.useState(false);
  if (prevCollapsed !== collapsed) {
    setPrevCollapsed(collapsed);
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) setSettling(true);
  }
  return (
    <div
      id={id}
      className="flex-shrink-0 bg-panel border-r border-divider z-10 select-none h-full relative overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
      style={{ width: `${collapsed ? SIDE_PANEL_COLLAPSED : width}px` }}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "width") setSettling(false);
      }}
    >
      {/* Collapsed: a thin rail with the expand button (same toggle as the home menu) */}
      <div
        inert={!collapsed}
        className={`absolute inset-y-0 left-0 w-12 flex flex-col items-center pt-3 transition-opacity duration-200 ${
          collapsed ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Mở rộng bảng cài đặt"
          title="Mở rộng bảng cài đặt"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
        >
          <Icon name="sidebar" className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        inert={collapsed}
        className={`h-full flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar relative transition-opacity duration-200 ${
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100 delay-75"
        }`}
        style={collapsed || settling ? { width: `${width}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
