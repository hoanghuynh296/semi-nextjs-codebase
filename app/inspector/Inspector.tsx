"use client";

// The docs site's component inspector (#194, docs/COMPONENT_DOCS.md "Component inspector"). Hovering a piece of an
// example preview (or anything on a /demo/* page) for 300ms outlines the innermost element marked with data-semi and
// shows its name, one-line description and the chain of marked ancestors; each name opens that component's page.
// Keyboard: with focus in an example, Alt+↑ / Alt+↓ walk the chain, Enter opens the page, Escape closes; a visually
// hidden live region says what is shown (the floating card is decorative: aria-hidden, its links out of the tab order).
// The card never catches a press meant for the page: it is pointer-events:none until the pointer rests on it (ARM_MS).
// Floating layers count only when an example opened them, so the docs' own menus and tooltips are never inspected.
// Docs site only: it lives in app/, never in @semi/ui.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isEditableTarget } from "../../src/navShortcuts";
import { cn } from "../../styles/utils";
import { describe, loadNames, type NameMap } from "./names";
import { inspectorOn, setInspectorOn, useInspectorOn } from "./store";

const PREVIEW = "[data-example-preview]";
const FLOATING = "[data-semi-floating]";
const DWELL_MS = 300;
const HIDE_MS = 150;
/** How long the pointer rests on the card before its links take clicks. */
const ARM_MS = 250;
/** Where the I key belongs to the focused widget (type-ahead, typing, an example's own keys). */
const OWN_KEYS = '[role="menu"], [role="listbox"], [role="tree"], [role="grid"], [role="treegrid"], [data-example-preview], [data-semi-floating]';

/** Where the last press, key or focus happened: decides whether a floating layer without a linked trigger is an example's. */
let lastInteraction: "example" | "other" = "other";
function noteInteraction(e: Event) {
  const t = e.target as Element | null;
  if (!t || typeof t.closest !== "function") return;
  if (t.closest(PREVIEW)) lastInteraction = "example";
  else if (!t.closest(FLOATING)) lastInteraction = "other";
}

/** Was this floating layer (menu, popover, tooltip, listbox) opened from an example preview? */
function layerFromExample(layer: Element, depth = 0): boolean {
  if (depth > 4) return false;
  const ids = [layer, ...layer.querySelectorAll("[id]")].map((n) => n.id).filter(Boolean);
  for (const id of ids) {
    const q = CSS.escape(id);
    const owner = document.querySelector(`[aria-controls~="${q}"], [aria-describedby~="${q}"], [aria-owns~="${q}"]`);
    if (!owner || layer.contains(owner)) continue;
    const parent = owner.closest(FLOATING);
    return parent ? layerFromExample(parent, depth + 1) : Boolean(owner.closest(PREVIEW));
  }
  return lastInteraction === "example";
}

/** The element the inspector may look inside, for `el`: its example preview, a layer an example opened, or the page on /demo/*. */
function scopeOf(el: Element, everywhere: boolean): Element | null {
  if (everywhere) return document.body;
  const preview = el.closest(PREVIEW);
  if (preview) return preview;
  const layer = el.closest(FLOATING);
  return layer && layerFromExample(layer) ? layer : null;
}

type Shown = { chain: HTMLElement[]; index: number; x: number; y: number; mode: "pointer" | "keyboard" };

/** Marked elements from the scope's outermost to the innermost one at `el` (elements without a box left out). */
function chainAt(el: Element | null, everywhere: boolean): HTMLElement[] {
  if (!el || typeof el.closest !== "function" || el.closest("[data-semi-inspector]")) return [];
  const root = scopeOf(el, everywhere);
  if (!root) return [];
  const out: HTMLElement[] = [];
  for (let n = el.closest<HTMLElement>("[data-semi]"); n && root.contains(n); n = n.parentElement?.closest<HTMLElement>("[data-semi]") ?? null) {
    if (n.getClientRects().length) out.unshift(n);
  }
  return out;
}

const pageOf = (id: string) => `/components/${id}/`;

export function ComponentInspector() {
  const on = useInspectorOn();
  const pathname = usePathname();
  const router = useRouter();
  const everywhere = Boolean(pathname?.startsWith("/demo/"));
  const [names, setNames] = useState<NameMap | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [said, setSaid] = useState("");
  const [armed, setArmed] = useState(false);
  const shownRef = useRef<Shown | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const namesRef = useRef<NameMap | null>(null);
  namesRef.current = names;

  const show = (next: Shown | null) => {
    shownRef.current = next;
    setShown(next);
  };

  // I toggles it (on or off) anywhere on the site, except while typing or when a widget took the key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.key.toLowerCase() !== "i") return;
      if (isEditableTarget(e.target) || isEditableTarget(document.activeElement)) return;
      const focused = document.activeElement;
      if ((e.target as Element | null)?.closest?.(OWN_KEYS) || focused?.closest(OWN_KEYS)) return;
      e.preventDefault();
      const next = !inspectorOn();
      setInspectorOn(next);
      setSaid(next ? "Đã bật soi component" : "Đã tắt soi component");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", noteInteraction, true);
    document.addEventListener("keydown", noteInteraction, true);
    document.addEventListener("focusin", noteInteraction, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", noteInteraction, true);
      document.removeEventListener("keydown", noteInteraction, true);
      document.removeEventListener("focusin", noteInteraction, true);
    };
  }, []);

  useEffect(() => {
    if (!on || names) return;
    let live = true;
    loadNames().then((m) => live && setNames(m), () => undefined);
    return () => {
      live = false;
    };
  }, [on, names]);

  // a new page, or turned off: nothing stays on screen
  useEffect(() => {
    queueMicrotask(() => show(null));
  }, [pathname, on]);

  useEffect(() => {
    if (!on) return;
    let dwell: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let pending: HTMLElement | null = null;
    let pressed = false;
    let armTimer: ReturnType<typeof setTimeout> | undefined;
    let isArmed = false;
    const arm = (next: boolean) => {
      clearTimeout(armTimer);
      armTimer = undefined;
      if (isArmed === next) return;
      isArmed = next;
      setArmed(next);
    };
    const stop = () => {
      clearTimeout(dwell);
      clearTimeout(hideTimer);
      pending = null;
    };
    const hide = () => {
      stop();
      arm(false);
      if (shownRef.current) show(null);
    };
    const hideSoon = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, HIDE_MS);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (pressed) return;
      const target = e.target as Element;
      const tip = tipRef.current;
      if (tip) {
        // Over the card (by position: until armed it lets the pointer through): keep it, and after ARM_MS of rest
        // its links take clicks. A press before that reaches what is under it (onDown hides the card).
        const r = tip.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          stop();
          if (!isArmed && !armTimer) armTimer = setTimeout(() => arm(true), ARM_MS);
          return;
        }
        arm(false);
      }
      const chain = chainAt(target, everywhere);
      const cur = shownRef.current;
      if (!chain.length) {
        clearTimeout(dwell);
        pending = null;
        if (cur) hideSoon();
        return;
      }
      const inner = chain[chain.length - 1];
      if (cur?.mode === "pointer" && cur.chain[cur.chain.length - 1] === inner) {
        stop();
        return;
      }
      // the pointer rests on a new piece: show it after DWELL_MS (the card shown now stays meanwhile, so it can be reached)
      if (pending === inner) return;
      clearTimeout(dwell);
      pending = inner;
      const at = { x: e.clientX, y: e.clientY };
      dwell = setTimeout(() => {
        pending = null;
        clearTimeout(hideTimer);
        show({ chain, index: chain.length - 1, x: at.x, y: at.y, mode: "pointer" });
      }, DWELL_MS);
    };
    const onDown = (e: PointerEvent) => {
      if (isArmed && tipRef.current?.contains(e.target as Node)) return;
      pressed = true;
      hide();
    };
    const onUp = () => {
      pressed = false;
    };
    const onScroll = () => {
      if (shownRef.current || pending) hide();
    };
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) hide();
    };

    const open = (s: Shown) => {
      const info = describe(s.chain[s.index].dataset.semi ?? "", namesRef.current);
      if (!info.id) return;
      hide();
      router.push(pageOf(info.id));
    };
    // capture: Enter and Escape belong to the inspector while its keyboard card shows (not to the focused button)
    const onKeyCapture = (e: KeyboardEvent) => {
      const cur = shownRef.current;
      if (!cur || cur.mode !== "keyboard" || e.isComposing || e.keyCode === 229) return;
      if (e.key === "Enter" && !e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        // a piece without a page leaves Enter to the focused control
        if (!describe(cur.chain[cur.index].dataset.semi ?? "", namesRef.current).id) return;
        e.preventDefault();
        e.stopPropagation();
        open(cur);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        hide();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      const walk = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown");
      if (walk) {
        if (e.defaultPrevented) return; // a widget's own Alt+↓ (a combobox opening its list) wins
        const cur = shownRef.current;
        if (cur?.mode === "keyboard") {
          const index = Math.max(0, Math.min(cur.chain.length - 1, cur.index + (e.key === "ArrowUp" ? -1 : 1)));
          e.preventDefault();
          show({ ...cur, index });
          return;
        }
        const chain = chainAt(document.activeElement, everywhere);
        if (!chain.length) return;
        e.preventDefault();
        stop();
        show({ chain, index: chain.length - 1, x: 0, y: 0, mode: "keyboard" });
        return;
      }
      if (["Alt", "AltGraph", "Shift", "Control", "Meta"].includes(e.key)) return;
      if (shownRef.current || pending) hide(); // typing hides it
    };
    const onFocusOut = () => {
      queueMicrotask(() => {
        const cur = shownRef.current;
        if (cur?.mode === "keyboard" && !cur.chain[cur.chain.length - 1].contains(document.activeElement)) hide();
      });
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onUp, true);
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("blur", hide);
    window.addEventListener("keydown", onKeyCapture, true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      stop();
      clearTimeout(armTimer);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onUp, true);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("blur", hide);
      window.removeEventListener("keydown", onKeyCapture, true);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [on, everywhere, router]);

  const el = shown ? shown.chain[shown.index] : null;
  const rect = el?.getBoundingClientRect() ?? null;
  const infos = shown ? shown.chain.map((n) => describe(n.dataset.semi ?? "", names)) : [];
  const info = shown ? infos[shown.index] : null;

  // what the keyboard card shows, for screen readers
  useEffect(() => {
    if (shown?.mode !== "keyboard" || !info) return;
    const chainText = infos.map((i) => i.name).join(" › ");
    queueMicrotask(() => setSaid(`${info.name}. ${info.summary} ${chainText}. Enter mở trang, Alt+mũi tên lên xuống đi theo chuỗi.`));
  }, [shown, names]);

  // keep the card inside the viewport, under the hovered element (or above it) so it covers as little as it can
  useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!tip || !shown || !rect) return;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pointer = shown.mode === "pointer";
    let left = pointer ? shown.x - 16 : rect.left;
    // a tall element: no further than 48px below the pointer
    let top = (pointer ? Math.min(rect.bottom, shown.y + 48) : rect.bottom) + 8;
    if (top + h > vh - 8) top = (pointer ? Math.max(rect.top, shown.y - 48) : rect.top) - h - 8;
    left = Math.max(8, Math.min(left, vw - w - 8));
    top = Math.max(8, top);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  });

  return (
    <div data-semi-inspector="">
      <div role="status" className="sr-only">
        {said}
      </div>
      {on && shown && rect && info && (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed z-tooltip rounded-control ring-2 ring-focus"
            style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
          />
          <div
            ref={tipRef}
            aria-hidden
            data-inspector-card=""
            data-armed={armed ? "" : undefined}
            className={cn(
              "fixed z-tooltip w-max max-w-80 rounded-card bg-raised border border-line shadow-overlay p-3 text-chrome text-body",
              !armed && "pointer-events-none",
            )}
            style={{ left: -9999, top: -9999 }}
          >
            {info.id ? (
              <Link href={pageOf(info.id)} tabIndex={-1} className="text-ui font-medium text-strong underline-offset-2 hover:underline">
                {info.name}
              </Link>
            ) : (
              <span className="text-ui font-medium text-strong">{info.name}</span>
            )}
            {info.summary && <p className="mt-1 text-muted">{info.summary}</p>}
            {infos.length > 1 && (
              <p className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                {infos.map((it, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-muted">›</span>}
                    {it.id ? (
                      <Link
                        href={pageOf(it.id)}
                        tabIndex={-1}
                        data-inspector-crumb={it.name}
                        className={cn("underline-offset-2 hover:underline", i === shown.index ? "text-strong font-medium" : "text-body")}
                      >
                        {it.name}
                      </Link>
                    ) : (
                      <span className="text-body">{it.name}</span>
                    )}
                  </React.Fragment>
                ))}
              </p>
            )}
            <p className="mt-2 text-muted">{shown.mode === "keyboard" ? "Enter mở trang · Alt+↑↓ đi theo chuỗi · Esc đóng" : "Bấm tên để mở trang · ⌘ / Ctrl-click: tab mới · phím I tắt"}</p>
          </div>
        </>
      )}
    </div>
  );
}
