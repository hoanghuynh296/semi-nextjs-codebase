"use client";

// PREVIEW (#94 L1, L9, L14): CommandPalette, DetailOverlay (+ SplitButton of #90 as a stand-in), FeatureIntro.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, IconTile, type IconName, type TileTone } from "../Icon";
import { Kbd } from "../Kbd";
import { Menu, type MenuItem } from "../Overlay";
import { filterCommands, type CommandItem } from "../Command";
import { useDialog } from "../a11y";
import { cn } from "../../styles/utils";

export interface PaletteAction extends CommandItem {
  /** Colour of the icon tile (actions only; places stay grey). */
  tone?: TileTone;
  /** One short line under the label. */
  hint?: string;
}

function usePortal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** L1: ⌘K "Tìm hoặc tạo": one box for search and quick actions, coloured icon per action, shortcut hints, key legend. */
export function CommandPalette({
  open,
  onOpenChange,
  actions,
  placeholder = "Tìm hoặc tạo…",
  initialQuery = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: PaletteAction[];
  placeholder?: string;
  initialQuery?: string;
}) {
  const mounted = usePortal();
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  useDialog(ref, open && mounted, () => onOpenChange(false));
  const list = useMemo(() => filterCommands(actions, query) as PaletteAction[], [actions, query]);
  const groups = useMemo(() => {
    const out: { group: string; items: { it: PaletteAction; index: number }[] }[] = [];
    list.forEach((it, index) => {
      const g = it.group ?? "";
      const last = out[out.length - 1];
      if (last && last.group === g) last.items.push({ it, index });
      else out.push({ group: g, items: [{ it, index }] });
    });
    return out;
  }, [list]);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (open) setQuery(initialQuery);
  }, [open, initialQuery]);
  if (!open || !mounted) return null;
  const run = (it?: PaletteAction) => {
    if (!it || it.disabled) return;
    onOpenChange(false);
    it.onSelect();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(list[active]);
    }
  };
  return createPortal(
    <div className="fixed inset-0 z-dialog flex items-start justify-center p-3 sm:p-4 pt-[8vh] sm:pt-[12vh]">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => onOpenChange(false)} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm hoặc tạo"
        className="relative w-full max-w-[640px] max-h-[min(560px,80dvh)] flex flex-col bg-panel-4 border border-line rounded-panel shadow-overlay overflow-hidden"
      >
        <div className="flex items-center gap-3 h-14 px-4 border-b border-divider shrink-0">
          <Icon name="search" className="w-5 h-5 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            aria-label={placeholder}
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
            aria-activedescendant={list[active] ? `palette-${list[active].id}` : undefined}
            className="flex-1 min-w-0 bg-transparent outline-none text-ui-lg text-contrast placeholder:text-muted"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div id="palette-list" role="listbox" className="flex-1 overflow-y-auto p-2">
          {list.length === 0 && <p className="px-3 py-8 text-center text-label text-muted">Không có kết quả cho “{query}”. Thử từ khác.</p>}
          {groups.map((g) => (
            <div key={g.group} role="group" aria-label={g.group} className="pb-1">
              {g.group && <div className="px-3 pt-2 pb-1 text-caption font-semibold uppercase tracking-wide text-muted">{g.group}</div>}
              {g.items.map(({ it, index }) => (
                <div
                  key={it.id}
                  id={`palette-${it.id}`}
                  role="option"
                  aria-selected={index === active}
                  aria-disabled={it.disabled}
                  onMouseMove={() => setActive(index)}
                  onClick={() => run(it)}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-control cursor-pointer",
                    index === active ? "bg-tint-hover" : "",
                    it.disabled && "opacity-50",
                  )}
                >
                  {it.icon &&
                    (it.tone ? (
                      <IconTile name={it.icon} tone={it.tone} size="sm" />
                    ) : (
                      <span className="w-8 h-8 rounded-control bg-tint flex items-center justify-center text-muted">
                        <Icon name={it.icon} className="w-4 h-4" />
                      </span>
                    ))}
                  <span className="flex-1 min-w-0">
                    <span className="block text-label font-medium text-contrast truncate">{it.label}</span>
                    {it.hint && <span className="block text-caption text-muted truncate">{it.hint}</span>}
                  </span>
                  {it.shortcut && <Kbd keys={it.shortcut} />}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-4 h-10 px-4 border-t border-divider text-caption text-muted shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <Kbd keys={["↑", "↓"]} /> Chọn
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↵</Kbd> Mở
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd keys={["⌘", "↵"]} /> Mở tab mới
          </span>
          <span className="inline-flex items-center gap-1.5 ml-auto">
            <Kbd>Esc</Kbd> Đóng
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Stand-in for #90's SplitButton: the main action and a menu of its variants. */
export function SplitButton({
  label,
  icon,
  onClick,
  items,
  variant = "primary",
  menuLabel,
}: {
  label: string;
  icon?: IconName;
  onClick: () => void;
  items: MenuItem[];
  variant?: "primary" | "secondary";
  menuLabel: string;
}) {
  const base =
    variant === "primary" ? "bg-accent text-on-accent hover:bg-accent-hover" : "bg-tint text-contrast hover:bg-tint-hover";
  return (
    <div className="inline-flex items-stretch rounded-control overflow-hidden" role="group" aria-label={label}>
      <button type="button" onClick={onClick} className={cn(base, "h-control px-3 inline-flex items-center gap-2 text-label font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus")}>
        {icon && <Icon name={icon} className="w-4 h-4" />}
        {label}
      </button>
      <Menu
        label={menuLabel}
        items={items}
        trigger={
          <button
            type="button"
            aria-label={menuLabel}
            className={cn(base, "h-control w-8 inline-flex items-center justify-center border-l border-divider outline-none focus-visible:ring-2 focus-visible:ring-focus")}
          >
            <Icon name="chevronDown" className="w-4 h-4" />
          </button>
        }
      />
    </div>
  );
}

/**
 * L9: an item opens as a large overlay over the list with its own URL (the page puts `?open=<id>` in the URL);
 * ‹ › (and ← →) step through the results; close / Esc returns to the list at the same scroll (the list never unmounts).
 * `side` is the action panel (SplitButton + icon row + ⋯); `related` goes under the main content.
 */
export function DetailOverlay({
  open,
  onClose,
  title,
  subtitle,
  index,
  total,
  onPrev,
  onNext,
  onCopyLink,
  children,
  side,
  related,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  index: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  onCopyLink?: () => void;
  children: React.ReactNode;
  side?: React.ReactNode;
  related?: React.ReactNode;
}) {
  const mounted = usePortal();
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, open && mounted, onClose);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onPrev, onNext]);
  if (!open || !mounted) return null;
  const nav =
    "w-9 h-9 rounded-full bg-tint text-contrast hover:bg-tint-hover flex items-center justify-center disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-focus";
  return createPortal(
    <div className="fixed inset-0 z-modal flex items-stretch justify-center sm:p-4 lg:p-6">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Chi tiết"}
        className="relative w-full max-w-[1240px] flex flex-col bg-panel-3 sm:rounded-panel shadow-overlay overflow-hidden"
      >
        <div className="flex items-center gap-2 h-14 px-3 sm:px-4 border-b border-divider shrink-0">
          <button type="button" onClick={onClose} aria-label="Đóng" className={nav}>
            <Icon name="close" className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 px-1">
            <div className="text-ui font-semibold text-contrast truncate">{title}</div>
            {subtitle && <div className="text-caption text-muted truncate">{subtitle}</div>}
          </div>
          {onCopyLink && (
            <button type="button" onClick={onCopyLink} aria-label="Sao chép liên kết" title="Sao chép liên kết" className={cn(nav, "hidden sm:flex")}>
              <Icon name="copy" className="w-4 h-4" />
            </button>
          )}
          <span className="text-label text-muted tabular-nums px-1">
            {index + 1} / {total}
          </span>
          <button type="button" onClick={onPrev} disabled={!onPrev} aria-label="Mục trước" title="Mục trước (←)" className={nav}>
            <Icon name="back" className="w-4 h-4" />
          </button>
          <button type="button" onClick={onNext} disabled={!onNext} aria-label="Mục sau" title="Mục sau (→)" className={nav}>
            <Icon name="chevron" className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="lg:overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 min-w-0">
            {children}
            {related}
          </div>
          {side && <aside className="lg:overflow-y-auto p-4 sm:p-6 lg:bg-panel-4 flex flex-col gap-5 max-lg:border-t max-lg:border-divider">{side}</aside>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** L14: the first visit of a feature: a visual, a title, one line, dots, secondary + primary. Once per user per feature. */
export function FeatureIntro({
  id,
  slides,
  forceOpen,
  onDone,
}: {
  /** Storage key: shown once per user per id. */
  id: string;
  slides: { title: string; body: string; visual: React.ReactNode }[];
  /** Preview / docs only: show even if seen. */
  forceOpen?: boolean;
  onDone?: () => void;
}) {
  const mounted = usePortal();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (forceOpen) return setOpen(true);
    try {
      if (!localStorage.getItem(`semi_intro_${id}`)) setOpen(true);
    } catch {
      /* storage blocked: skip the intro */
    }
  }, [id, forceOpen]);
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(`semi_intro_${id}`, "1");
    } catch {
      /* ignore */
    }
    onDone?.();
  };
  useDialog(ref, open && mounted, close);
  if (!open || !mounted) return null;
  const s = slides[step];
  const last = step === slides.length - 1;
  return createPortal(
    <div className="fixed inset-0 z-dialog flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={close} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`intro-${id}`} className="relative w-full sm:max-w-[480px] bg-panel-4 rounded-t-panel sm:rounded-panel shadow-overlay overflow-hidden">
        <div className="aspect-[16/9] bg-card flex items-center justify-center">{s.visual}</div>
        <div className="p-5 sm:p-6 flex flex-col gap-2">
          <h2 id={`intro-${id}`} className="text-title font-title font-semibold text-contrast">
            {s.title}
          </h2>
          <p className="text-ui text-body">{s.body}</p>
        </div>
        <div className="flex items-center gap-3 px-5 sm:px-6 pb-5 sm:pb-6 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="flex gap-1.5 flex-1" aria-label={`Bước ${step + 1} / ${slides.length}`}>
            {slides.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5 bg-contrast" : "w-1.5 bg-raised")} />
            ))}
          </div>
          <button type="button" onClick={close} className="h-control px-3 rounded-control bg-tint text-label font-medium text-contrast hover:bg-tint-hover">
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={() => (last ? close() : setStep(step + 1))}
            className="h-control px-4 rounded-control bg-accent text-on-accent text-label font-semibold hover:bg-accent-hover"
          >
            {last ? "Bắt đầu" : "Tiếp"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
