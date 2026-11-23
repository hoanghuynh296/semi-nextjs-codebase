"use client";

// Floating layers anchored to a trigger: Tooltip (hint on hover / focus), Menu (action list, WAI-ARIA menu button) and
// ContextMenu (the same list opened at the pointer).
// Both render in a portal with fixed positioning, so scrolling panels and modals never clip them.
import React, { isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { Spinner } from "./Button";
import { cloneTrigger, useAnchoredPosition, type AnchoredPosition } from "./floating";
import { FLOATING_LAYER } from "./a11y";
import { useSemiLocale } from "./locale";
import { BTN_ICON, BTN_SECONDARY } from "../styles/buttons";
import { cn } from "../styles/utils";

/**
 * Short hint for an icon-only control (one line, no interactive content). The trigger keeps its own aria-label;
 * the tooltip is linked with aria-describedby. Touch screens show nothing: never put essential text in a tooltip.
 */
export function Tooltip(props: {
  content: React.ReactNode;
  children: React.ReactElement;
  /**
   * Where the hint shows; `right` is for a vertical icon rail (AppShell's collapsed sidebar).
   * @default "top"
   */
  side?: "top" | "bottom" | "right";
}) {
  // Props given to the Tooltip itself (a Menu or Popover that uses it as its trigger passes ref, handlers, aria-*) go
  // on to the trigger, so <Menu trigger={<Tooltip><Button/></Tooltip>}> works.
  const { content, children, side = "top", ...rest } = props as typeof props & Record<string, unknown>;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const id = useId();
  const anchored = useAnchoredPosition(ref, open && side !== "right", { align: "center", minWidth: 0, gap: 6, preferAbove: side === "top" });
  const [beside, setBeside] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || side !== "right") return;
    const r = ref.current?.getBoundingClientRect();
    if (r) setBeside({ left: r.right + 8, top: r.top + r.height / 2 });
  }, [open, side]);
  const pos = side === "right" ? beside && { ...beside, bottom: undefined } : anchored;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  useEffect(() => {
    if (!open) return;
    // capture, before a Modal's focus trap: Escape hides the tooltip only (WCAG 1.4.13 dismissible)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  if (!isValidElement(children)) return children;
  const later = (next: boolean, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), ms);
  };
  const show = () => later(true, 350);
  // a short grace period, so the pointer can move from the trigger onto the tooltip (WCAG 1.4.13 hoverable)
  const hide = () => later(false, 120);
  const hideNow = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };
  const own = children as React.ReactElement<Record<string, unknown>>;
  const child = (Object.keys(rest).length ? cloneTrigger(own, rest) : own) as React.ReactElement<Record<string, unknown>>;
  const trigger = cloneTrigger(child, {
    ref: (el: HTMLElement | null) => {
      ref.current = el;
    },
    "aria-describedby": open ? id : undefined,
    onPointerEnter: show,
    onPointerLeave: hide,
    onFocus: () => {
      if (timer.current) clearTimeout(timer.current);
      setOpen(true);
    },
    onBlur: hideNow,
  });

  return (
    <>
      {trigger}
      {open &&
        pos &&
        createPortal(
          <div
            {...FLOATING_LAYER}
            id={id}
            role="tooltip"
            onPointerEnter={() => timer.current && clearTimeout(timer.current)}
            onPointerLeave={hide}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
            className={cn(
              "fixed z-tooltip max-w-[260px] px-2 py-1 rounded-control bg-raised border border-line text-chrome text-strong shadow-overlay",
              side === "right" && "-translate-y-1/2",
            )}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}

export interface MenuItem {
  label: React.ReactNode;
  icon?: IconName;
  /** What the item does. Optional when `href` is given (the link navigates). */
  onSelect?: () => void;
  /** A link item: renders a `next/link` (router navigation, ⌘-click opens a tab). `onSelect` still runs first. */
  href?: string;
  /** One short line under the label ("Từ Excel hoặc CSV"). */
  description?: React.ReactNode;
  /**
   * Destructive item (Xoá): danger text. Danger items are always listed last, after a separator (G5), whatever
   * their place in `items`.
   */
  danger?: boolean;
  /**
   * Not available now. A string is the reason, shown under the label: the item then stays reachable with the arrows
   * (aria-disabled) so screen reader users hear why. `true` greys it out and skips it.
   */
  disabled?: boolean | string;
  /** Leave the item out (a permission or device the user lacks). A group whose items are all hidden disappears. */
  hidden?: boolean;
  /** A toggle or the current choice: shows a check and makes the item `menuitemcheckbox` with aria-checked. */
  checked?: boolean;
  /**
   * With `checked`: the item is one choice of a set (`menuitemradio`): a view, a mailbox, a sort. The menu opens on
   * the checked one.
   */
  radio?: boolean;
  /** The action is running: a spinner in place of the icon; the item cannot be picked again (aria-busy). */
  loading?: boolean;
  /** Draw a divider above this item. */
  separator?: boolean;
  /**
   * Heading of the group the item belongs to ("Nhập", "Xuất"). Consecutive items with the same group are listed
   * under one `text-overline` heading, with a divider between groups.
   */
  group?: string;
  /** Keyboard shortcut or short trailing hint shown on the right ("⌘D", ":3000"); the app binds the key itself. */
  shortcut?: string;
}

/** The items as shown: hidden ones left out, danger ones moved last (after a divider), group headings resolved. */
function arrangeMenuItems(items: MenuItem[]): (MenuItem & { heading?: string })[] {
  const visible = items.filter((it) => !it.hidden);
  const safe = visible.filter((it) => !it.danger);
  const danger = visible.filter((it) => it.danger);
  const ordered = [...safe, ...danger.map((it, i) => (i === 0 && safe.length ? { ...it, separator: true } : it))];
  return ordered.map((it, i) => {
    const prev = ordered[i - 1];
    const startsGroup = it.group !== undefined && it.group !== prev?.group;
    const leavesGroup = prev?.group !== undefined && it.group !== prev.group;
    return { ...it, heading: startsGroup ? it.group : undefined, separator: it.separator || (i > 0 && (startsGroup || leavesGroup)) };
  });
}

/** Can the item be focused with the arrows (enabled, or disabled with a reason). */
const reachable = (it: MenuItem) => !it.disabled || typeof it.disabled === "string";
const pickable = (it: MenuItem) => !it.disabled && !it.loading;

/** The floating list of a Menu / ContextMenu: ↑/↓ Home End move (skipping disabled items), Enter / Space pick,
 * a letter jumps to the next item starting with it, Escape closes, Tab closes and moves on. Rendered in a portal at
 * `pos`; below `sm` it is a bottom sheet over a backdrop (`sheet`). */
function MenuPanel({
  id,
  items: raw,
  label,
  pos,
  initial,
  onClose,
  panelRef,
  onSide,
  sheet = true,
}: {
  id: string;
  items: MenuItem[];
  label: string;
  pos: AnchoredPosition;
  /** "first" / "last" reachable item, or an index in the arranged list. */
  initial: number | "first" | "last";
  onClose: (refocus: boolean) => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** ←/→ inside the panel (Menubar moves to the neighbouring menu). */
  onSide?: (dir: 1 | -1) => void;
  sheet?: boolean;
}) {
  const items = useMemo(() => arrangeMenuItems(raw), [raw]);
  const enabled = items.map((it, i) => (reachable(it) ? i : -1)).filter((i) => i >= 0);
  const [active, setActive] = useState(() => {
    // a set of choices opens on the current one (APG menu radio pattern)
    const current = items.findIndex((it) => it.radio && it.checked && reachable(it));
    if (initial === "first" && current >= 0) return current;
    return (initial === "last" ? enabled[enabled.length - 1] : initial === "first" ? enabled[0] : initial) ?? 0;
  });
  const base = useId();
  // runs of items: a group with a heading becomes a role=group labelled by it
  const segments = useMemo(() => {
    const out: { heading?: string; items: { it: (typeof items)[number]; i: number }[] }[] = [];
    items.forEach((it, i) => {
      const last = out[out.length - 1];
      if (!last || it.heading || (last.heading !== undefined && it.group !== items[i - 1]?.group)) out.push({ heading: it.heading, items: [{ it, i }] });
      else last.items.push({ it, i });
    });
    return out;
  }, [items]);
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.focus();
  }, [active, panelRef]);
  const step = (dir: 1 | -1) => {
    if (!enabled.length) return;
    const k = enabled.indexOf(active);
    setActive(enabled[(k + dir + enabled.length) % enabled.length]);
  };
  const typeAhead = (ch: string) => {
    const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("[data-idx]") ?? []);
    const text = (i: number) => nodes.find((n) => n.dataset.idx === String(i))?.querySelector("[data-label]")?.textContent?.trim().toLocaleLowerCase() ?? "";
    const k = enabled.indexOf(active);
    const order = [...enabled.slice(k + 1), ...enabled.slice(0, k + 1)];
    const hit = order.find((i) => text(i).startsWith(ch.toLocaleLowerCase()));
    if (hit !== undefined) setActive(hit);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") return onClose(false);
    const actions: Record<string, () => void> = {
      ArrowDown: () => step(1),
      ArrowUp: () => step(-1),
      Home: () => setActive(enabled[0]),
      End: () => setActive(enabled[enabled.length - 1]),
      Escape: () => onClose(true),
      ...(onSide ? { ArrowRight: () => onSide(1), ArrowLeft: () => onSide(-1) } : {}),
    };
    // a link item (an <a>) does not activate on Space by itself, as a menuitem must
    if (e.key === " " && items[active]?.href && !items[active]?.disabled) {
      e.preventDefault();
      panelRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.click();
      return;
    }
    if (!actions[e.key]) {
      if (e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(e.key);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    actions[e.key]();
  };
  const pick = (it: MenuItem, e: React.MouseEvent) => {
    if (!pickable(it)) {
      e.preventDefault();
      return;
    }
    onClose(!it.href);
    it.onSelect?.();
  };
  const rowCls = (it: MenuItem) =>
    cn(
      "w-full text-left px-3 py-2 max-sm:py-3 rounded-control text-ui flex items-center gap-2 transition outline-none",
      it.disabled ? "opacity-40 cursor-not-allowed" : it.loading ? "cursor-progress" : "cursor-pointer",
      it.danger ? "text-danger-fg hover:bg-danger-bg focus-visible:bg-danger-bg" : "text-body hover:bg-raised hover:text-strong focus-visible:bg-raised focus-visible:text-strong",
    );
  return createPortal(
    <>
      {sheet && <div {...FLOATING_LAYER} aria-hidden className="sm:hidden fixed inset-0 z-popover bg-overlay" />}
      <div
        {...FLOATING_LAYER}
        ref={panelRef}
        id={id}
        role="menu"
        aria-label={label}
        onKeyDown={onKey}
        style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.minWidth, maxHeight: pos.maxHeight }}
        className={cn(
          "fixed z-popover overflow-y-auto overscroll-contain bg-panel border border-line rounded-card shadow-overlay p-1 flex flex-col gap-0.5",
          // below sm: a bottom sheet (P6); !important beats the anchored inline position
          sheet && "max-sm:!left-0 max-sm:!right-0 max-sm:!top-auto max-sm:!bottom-0 max-sm:!min-w-0 max-sm:!max-h-[75dvh] max-sm:rounded-b-none max-sm:rounded-t-panel max-sm:border-x-0 max-sm:border-b-0 max-sm:p-2 max-sm:pb-[max(8px,env(safe-area-inset-bottom))]",
        )}
      >
        {segments.map((seg, si) => {
          const rows = seg.items.map(({ it, i }, k) => {
            const reason = typeof it.disabled === "string" ? it.disabled : undefined;
            const descId = it.description || reason ? `${base}-d-${i}` : undefined;
            const common = {
              role: it.checked === undefined ? "menuitem" : it.radio ? "menuitemradio" : "menuitemcheckbox",
              "aria-checked": it.checked,
              "aria-disabled": it.disabled ? true : undefined,
              "aria-busy": it.loading || undefined,
              "aria-describedby": descId,
              "data-idx": i,
              tabIndex: i === active ? 0 : -1,
              onPointerEnter: () => reachable(it) && setActive(i),
              onClick: (e: React.MouseEvent) => pick(it, e),
              className: rowCls(it),
            };
            const lead = it.loading ? (
              <Spinner className="w-3.5 h-3.5 shrink-0" />
            ) : it.checked !== undefined ? (
              <Icon name="check" className={cn("w-3.5 h-3.5 shrink-0", !it.checked && "invisible")} />
            ) : (
              it.icon && <Icon name={it.icon} className="w-3.5 h-3.5 shrink-0" />
            );
            const body = (
              <>
                {lead}
                <span className="flex-1 min-w-0">
                  <span data-label className="block truncate">
                    {it.label}
                  </span>
                  {(it.description || reason) && (
                    <span id={descId} className="block text-chrome text-muted truncate">
                      {reason ?? it.description}
                    </span>
                  )}
                </span>
                {it.shortcut && <span className="text-chrome text-muted tabular-nums">{it.shortcut}</span>}
              </>
            );
            return (
              <React.Fragment key={i}>
                {it.separator && !(seg.heading && k === 0) && <div role="separator" className="my-1 h-px bg-divider" />}
                {it.href && !it.disabled ? (
                  <Link href={it.href} {...common}>
                    {body}
                  </Link>
                ) : (
                  <button type="button" {...common}>
                    {body}
                  </button>
                )}
              </React.Fragment>
            );
          });
          if (!seg.heading) return <React.Fragment key={si}>{rows}</React.Fragment>;
          const hid = `${base}-g-${si}`;
          return (
            <React.Fragment key={si}>
              {seg.items[0].it.separator && <div role="separator" className="my-1 h-px bg-divider" />}
            <div role="group" aria-labelledby={hid} className="flex flex-col gap-0.5">
              <div id={hid} role="presentation" className="px-3 pt-1.5 pb-0.5 text-overline text-muted">
                {seg.heading}
              </div>
              {rows}
            </div>
            </React.Fragment>
          );
        })}
      </div>
    </>,
    document.body,
  );
}

/** Close a floating layer on a pointer down outside it (and outside its trigger). */
function useOutsideClose(open: boolean, refs: React.RefObject<HTMLElement | null>[], close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (!refs.some((r) => r.current?.contains(el))) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, refs, close]);
}

/**
 * Action menu behind a trigger button (row / card overflow actions). ↑/↓ move, Enter / Space pick, Escape closes and
 * returns focus. Default trigger: icon-only "more" button; pass `trigger` (an element) to use your own.
 */
export function Menu({
  items,
  label: labelProp,
  align = "right",
  trigger,
  sheet = true,
}: {
  /** The actions. Danger items are listed last, hidden ones left out (see MenuItem). */
  items: MenuItem[];
  /** Accessible name of the default trigger. */
  label?: string;
  align?: "left" | "right";
  trigger?: React.ReactElement;
  /**
   * Below `sm` the list opens as a bottom sheet over a backdrop (P6, since 0.39). `false` keeps the anchored
   * dropdown on phones too.
   * @default true
   */
  sheet?: boolean;
}) {
  const t = useSemiLocale();
  const label = labelProp ?? t.actions;
  const [open, setOpen] = useState<false | "first" | "last">(false);
  const btnRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const pos = useAnchoredPosition(btnRef, open !== false, { align, minWidth: 180 });
  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);
  const refs = useMemo(() => [menuRef, btnRef], []);
  useOutsideClose(open !== false, refs, () => close(false));

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen("first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen("last");
    }
  };
  const triggerProps = {
    ref: (el: HTMLElement | null) => {
      btnRef.current = el;
    },
    "aria-haspopup": "menu" as const,
    "aria-expanded": open !== false,
    "aria-controls": open !== false ? id : undefined,
    onClick: () => (open !== false ? close() : setOpen("first")),
    onKeyDown: onTriggerKey,
  };

  return (
    <>
      {trigger && isValidElement(trigger) ? (
        cloneTrigger(trigger, triggerProps)
      ) : (
        <button type="button" aria-label={label} title={label} className={cn(BTN_SECONDARY, BTN_ICON)} {...triggerProps}>
          <Icon name="more" className="w-4 h-4" />
        </button>
      )}
      {open !== false && pos && <MenuPanel id={id} items={items} label={label} pos={pos} initial={open} onClose={close} panelRef={menuRef} sheet={sheet} />}
    </>
  );
}

/**
 * The menu of an area opened at the pointer: right-click, long-press on touch, or the Menu key / Shift+F10 when the
 * area has focus. Use for power-user shortcuts that also exist elsewhere (a row's Menu, a toolbar button).
 */
export function ContextMenu({
  items,
  label: labelProp,
  className,
  children,
  sheet = true,
}: {
  items: MenuItem[];
  /** Accessible name of the menu. */
  label?: string;
  className?: string;
  /** The area that opens the menu (it becomes focusable). */
  children: React.ReactNode;
  /**
   * Below `sm` the list opens as a bottom sheet over a backdrop (P6, since 0.39); `false` keeps it at the pointer.
   * @default true
   */
  sheet?: boolean;
}) {
  const t = useSemiLocale();
  const label = labelProp ?? t.actions;
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const pos = useAnchoredPosition(anchorRef, at !== null, { minWidth: 180, gap: 0 });
  const close = useCallback((refocus = true) => {
    setAt(null);
    if (refocus) areaRef.current?.focus();
  }, []);
  const refs = useMemo(() => [menuRef], []);
  useOutsideClose(at !== null, refs, () => close(false));
  const openAt = (x: number, y: number) => setAt({ x, y });
  const clearPress = () => press.current && clearTimeout(press.current);
  return (
    <div
      ref={areaRef}
      tabIndex={0}
      // a named stop in the tab order that says how to open its menu
      role="group"
      aria-label={label}
      aria-keyshortcuts="Shift+F10"
      onContextMenu={(e) => {
        e.preventDefault();
        openAt(e.clientX, e.clientY);
      }}
      onKeyDown={(e) => {
        if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
          e.preventDefault();
          const r = areaRef.current!.getBoundingClientRect();
          openAt(r.left + 16, r.top + 16);
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        const { clientX, clientY } = e;
        press.current = setTimeout(() => openAt(clientX, clientY), 550);
      }}
      onPointerUp={clearPress}
      onPointerCancel={clearPress}
      onPointerMove={clearPress}
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-card", className)}
    >
      {children}
      {at && <span ref={anchorRef} aria-hidden style={{ position: "fixed", left: at.x, top: at.y, width: 0, height: 0 }} />}
      {at && pos && <MenuPanel id={id} items={items} label={label} pos={pos} initial="first" onClose={close} panelRef={menuRef} sheet={sheet} />}
    </div>
  );
}

export interface MenubarMenu {
  label: string;
  items: MenuItem[];
}

/**
 * The menu bar of a desktop-style tool (Tệp · Sửa · Xem): ←/→ move between menus (and switch the open one), ↓ / Enter
 * open, the menus behave like Menu. For page navigation use NavigationMenu or AppShell instead.
 */
export function Menubar({ menus, label, className }: { menus: MenubarMenu[]; /** Accessible name of the bar. */ label: string; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [focus, setFocus] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const openRef = useRef(open);
  openRef.current = open;
  const close = useCallback((refocus = true) => {
    const o = openRef.current;
    setOpen(null);
    if (refocus && o !== null) btnRefs.current[o]?.focus();
  }, []);
  const refs = useMemo(() => [menuRef, barRef], []);
  useOutsideClose(open !== null, refs, () => close(false));
  const moveTo = (i: number, openIt: boolean) => {
    const k = (i + menus.length) % menus.length;
    setFocus(k);
    btnRefs.current[k]?.focus();
    setOpen(openIt ? k : null);
  };
  return (
    <div ref={barRef} role="menubar" aria-label={label} className={cn("inline-flex items-center gap-0.5 rounded-control border border-line bg-panel p-0.5", className)}>
      {menus.map((m, i) => (
        <button
          key={m.label}
          ref={(el) => {
            btnRefs.current[i] = el;
          }}
          type="button"
          role="menuitem"
          aria-haspopup="menu"
          aria-expanded={open === i}
          aria-controls={open === i ? id : undefined}
          tabIndex={i === focus ? 0 : -1}
          onClick={() => (open === i ? close() : moveTo(i, true))}
          onPointerEnter={() => open !== null && open !== i && moveTo(i, true)}
          onKeyDown={(e) => {
            const keys: Record<string, () => void> = {
              ArrowRight: () => moveTo(i + 1, open !== null),
              ArrowLeft: () => moveTo(i - 1, open !== null),
              ArrowDown: () => moveTo(i, true),
              Enter: () => moveTo(i, true),
              " ": () => moveTo(i, true),
              Home: () => moveTo(0, false),
              End: () => moveTo(menus.length - 1, false),
            };
            if (!keys[e.key]) return;
            e.preventDefault();
            keys[e.key]();
          }}
          className={cn("h-7 px-2.5 rounded-control text-chrome font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-focus", open === i ? "bg-raised text-strong" : "text-body hover:bg-field hover:text-strong")}
        >
          {m.label}
        </button>
      ))}
      {open !== null && (
        <MenubarDropdown
          key={open}
          anchor={btnRefs.current[open]}
          id={id}
          menu={menus[open]}
          onClose={close}
          panelRef={menuRef}
          onSide={(dir) => moveTo(open + dir, true)}
        />
      )}
    </div>
  );
}

/** One open menu of a Menubar, positioned under its own button (a new instance per menu, so it re-anchors). */
function MenubarDropdown({
  anchor,
  id,
  menu,
  onClose,
  panelRef,
  onSide,
}: {
  anchor: HTMLElement | null;
  id: string;
  menu: MenubarMenu;
  onClose: (refocus: boolean) => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onSide: (dir: 1 | -1) => void;
}) {
  const anchorRef = useRef<HTMLElement | null>(anchor);
  const pos = useAnchoredPosition(anchorRef, true, { minWidth: 200 });
  if (!pos) return null;
  return <MenuPanel id={id} items={menu.items} label={menu.label} pos={pos} initial="first" onClose={onClose} panelRef={panelRef} onSide={onSide} sheet={false} />;
}
