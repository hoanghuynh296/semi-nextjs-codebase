"use client";

// Page-level actions (Thêm máy in, Thêm automation…) live in the top-right corner of the page header.
// The page renders <PageActionsSlot /> in its header; a tab renders its buttons inside <PageActions>, which portals them there.
import React, { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

const SlotContext = createContext<{ el: HTMLElement | null; setEl: (el: HTMLElement | null) => void } | null>(null);

export function PageActionsProvider({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return <SlotContext.Provider value={{ el, setEl }}>{children}</SlotContext.Provider>;
}

/** Where the actions appear: the right end of the page header row. */
export function PageActionsSlot({ className = "" }: { className?: string }) {
  const ctx = useContext(SlotContext);
  return <div ref={ctx?.setEl} className={`flex items-center gap-2 shrink-0 empty:hidden ${className}`} />;
}

/** Renders its children in the page header slot (inline when the page has no slot). */
export function PageActions({ children }: { children: React.ReactNode }) {
  const ctx = useContext(SlotContext);
  if (!ctx?.el) return ctx ? null : <div className="flex items-center justify-end gap-2">{children}</div>;
  return createPortal(children, ctx.el);
}
