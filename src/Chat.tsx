"use client";

// AI chat of the Semi Design System (docs/DESIGN_SYSTEM.md §14b), extracted from 3D Noobs Studio. UI only: the app keeps
// the messages, streams the answer and talks to the model; these parts draw it and report send / stop / retry.
//   <AIChat title="Trợ lý AI" shown={open} onClose={close} messages={msgs} busy={streaming}
//     onSend={ask} onStop={abort} onRetry={retry} onNewChat={reset} empty={<ChatIntro title="…">…</ChatIntro>} />
// Or compose the parts: ChatPanel (side panel) > ChatView (loading / setup / list) > ChatList + ChatComposer, with
// UserMessage, AssistantMessage, ChatError, ChatThinking, ChatIntro, ChatSuggestion inside.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, IconTile, type IconName } from "./Icon";
import { Button } from "./Button";
import { CustomSelect, type CustomSelectOption } from "./CustomSelect";
import { ExternalLink } from "./ExternalLink";
import { Markdown } from "./Markdown";
import { Skeleton } from "./Skeleton";
import { STATUS_ICON } from "./Toast";
import { useDialog } from "./a11y";
import { useSemiLocale } from "./locale";
import { MODAL_CLOSE } from "../styles/surfaces";
import { cn, FOCUS_RING } from "../styles/utils";

// ─── Classes ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** A tappable row in a chat (suggested request, follow-up choice, link): one look for all of them. */
export const CHAT_ROW = cn(
  "group w-full flex items-center gap-3 text-left text-ui text-body hover:text-contrast rounded-xl bg-field hover:bg-raised border border-line hover:border-primary-500/30 px-3 py-2.5 transition disabled:opacity-40 disabled:pointer-events-none",
  FOCUS_RING,
);
/** A small label chip in a chat (events, tags the AI understands). */
export const CHAT_CHIP = "text-label text-body rounded-lg bg-field border border-line px-2 py-1";
/** The scrolling message list. */
const CHAT_LIST = "flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-4 min-h-0";
/** The bar that holds the composer at the bottom of a chat (clear of the home indicator on phones). */
const COMPOSER_BAR = "relative p-3 border-t border-divider shrink-0 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]";
/** The input box around the textarea and its buttons. */
const COMPOSER_BOX = "flex flex-col gap-1 bg-field border border-line rounded-xl p-1.5 pl-2 focus-within:border-primary-500/50 transition min-w-0";
/** The question field: grows with the text up to 45% of the screen, then scrolls inside. */
const COMPOSER_FIELD =
  "flex-1 min-w-0 block resize-none max-h-[45dvh] overflow-y-auto bg-transparent px-1.5 py-1.5 text-ui text-contrast placeholder:text-muted outline-none disabled:opacity-40";
const SMALL_ACTION = cn("w-7 h-7 rounded-lg text-muted hover:text-contrast hover:bg-raised flex items-center justify-center transition shrink-0", FOCUS_RING);

// ─── Messages ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Small sparkles tile in front of every AI answer (pulses while it streams). */
export function ChatAvatar({ busy = false, icon = "sparkles" }: { busy?: boolean; icon?: IconName }) {
  return (
    <span className={cn("w-6 h-6 rounded-lg bg-primary-500/15 text-accent-fg flex items-center justify-center shrink-0", busy && "motion-safe:animate-pulse")}>
      <Icon name={icon} className="w-3.5 h-3.5" />
    </span>
  );
}

/** "Đang suy nghĩ" (or what the AI is doing) with three bouncing dots, while no text has come yet. */
export function ChatThinking({ label }: { label?: string }) {
  const t = useSemiLocale();
  return (
    <span className="inline-flex items-center gap-1.5 text-label text-muted h-6">
      {(label ?? t.chatThinking).replace(/…$/, "")}
      <span className="inline-flex gap-0.5" aria-hidden>
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-1 h-1 rounded-full bg-accent motion-safe:animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    </span>
  );
}

/** The user's message, right-aligned. `failed`: its answer failed (shown dimmed, not sent again). */
export function UserMessage({ failed = false, children }: { failed?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "self-end max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 text-ui whitespace-pre-wrap break-words border",
        failed ? "bg-field border-line text-muted" : "bg-primary-500/15 border-primary-500/20 text-contrast",
      )}
    >
      {children}
    </div>
  );
}

/** An AI answer, left-aligned behind the avatar. `actions` (copy, feedback) show under it once it is done. */
export function AssistantMessage({
  busy = false,
  actions,
  children,
}: {
  busy?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="self-start w-full flex gap-2">
      <ChatAvatar busy={busy} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-ui text-body leading-relaxed break-words">{children}</div>
        {actions && !busy && <div className="mt-1 -ml-1.5 flex items-center gap-0.5">{actions}</div>}
      </div>
    </div>
  );
}

/** A failed answer (or an AI note in a warning tone), with an optional retry. */
export function ChatError({
  tone = "danger",
  onRetry,
  children,
}: {
  tone?: "danger" | "warning";
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  const t = useSemiLocale();
  const s = STATUS_ICON[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className="self-start flex gap-2 max-w-[96%]">
      <span className={cn("w-6 h-6 rounded-lg border flex items-center justify-center shrink-0", s.surface, s.fg)}>
        <Icon name="alert" className="w-3.5 h-3.5" />
      </span>
      <div className="min-w-0 flex flex-col items-start gap-1.5">
        {/* body colour like Alert: tone text on its tint misses AA on canvas in light mode */}
        <div className={cn("text-ui text-body rounded-xl px-3 py-2 break-words border", s.surface)}>{children}</div>
        {onRetry && (
          <Button size="sm" variant="ghost" icon="refresh" onClick={onRetry}>
            {t.chatRetry}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Copies `text` (an answer, a code block); shows a check for a moment. */
export function ChatCopyButton({ text }: { text: string }) {
  const t = useSemiLocale();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1500);
    return () => clearTimeout(id);
  }, [done]);
  const label = done ? t.copied : t.copy;
  return (
    <button
      type="button"
      className={SMALL_ACTION}
      aria-label={label}
      title={label}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => setDone(true),
          () => undefined,
        );
      }}
    >
      <Icon name={done ? "check" : "copy"} className="w-3.5 h-3.5" />
    </button>
  );
}

/** Icon, title and one line above an empty conversation. */
export function ChatIntro({ icon = "sparkles", title, children }: { icon?: IconName; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-2.5 pt-2">
      <IconTile name={icon} tone="green" size="lg" />
      <div className="text-title-lg font-semibold text-contrast tracking-tight">{title}</div>
      {children && <p className="text-label text-muted max-w-[300px] leading-relaxed">{children}</p>}
    </div>
  );
}

/** One suggested request (a button), or with `href` a link to another site (opens outside the app). */
export function ChatSuggestion({
  icon = "sparkles",
  disabled,
  onClick,
  href,
  children,
}: {
  icon?: IconName;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  const body = (
    <>
      <span className="w-7 h-7 rounded-lg bg-primary-500/10 text-accent-fg flex items-center justify-center shrink-0">
        <Icon name={icon} className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0 leading-relaxed">{children}</span>
      <Icon name={href ? "external" : "chevron"} className="w-4 h-4 text-muted group-hover:text-accent-fg transition shrink-0" />
    </>
  );
  if (href) {
    return (
      <ExternalLink href={href} className={CHAT_ROW}>
        {body}
      </ExternalLink>
    );
  }
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={CHAT_ROW}>
      {body}
    </button>
  );
}

/** A column of ChatSuggestion rows, with an optional small heading. */
export function ChatSuggestions({ label, children }: { label?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <div className="text-label font-medium text-muted px-1">{label}</div>}
      {children}
    </div>
  );
}

// ─── List ────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Within this many px of the end counts as "at the bottom". */
const STICK_SLACK = 32;

/**
 * The scrolling message list (role="log"). Follows new text only while the reader is at the bottom: scrolled up to
 * read, it stays put and offers "jump to latest". Streamed tokens are not read out one by one; when `busy` ends the
 * finished answer (`announcement`, else "answer complete") is announced once. `empty` (only the intro / suggestions
 * showing) keeps it at the top so the intro is read from its start.
 */
export function ChatList({
  busy = false,
  announcement,
  label,
  empty = false,
  children,
}: {
  busy?: boolean;
  announcement?: string;
  empty?: boolean;
  /** Accessible name of the log (the panel title). */
  label?: string;
  children: React.ReactNode;
}) {
  const t = useSemiLocale();
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [away, setAway] = useState(false);
  const [said, setSaid] = useState("");
  const wasBusy = useRef(busy);
  const emptyRef = useRef(empty);
  emptyRef.current = empty;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const follow = () => {
      if (emptyRef.current) el.scrollTop = 0;
      else if (stick.current) el.scrollTop = el.scrollHeight;
    };
    follow();
    const mo = new MutationObserver(follow);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    const ro = new ResizeObserver(follow);
    ro.observe(el);
    return () => {
      mo.disconnect();
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (wasBusy.current && !busy) setSaid(announcement?.trim() || t.chatAnswerDone);
    if (busy) setSaid("");
    wasBusy.current = busy;
  }, [busy, announcement, t.chatAnswerDone]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_SLACK;
    stick.current = bottom;
    setAway(!bottom);
  };

  const jump = () => {
    const el = ref.current;
    if (!el) return;
    stick.current = true;
    setAway(false);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div ref={ref} role="log" aria-live="off" aria-label={label} aria-busy={busy || undefined} onScroll={onScroll} className={CHAT_LIST}>
        {children}
      </div>
      {away && (
        <button
          type="button"
          onClick={jump}
          aria-label={t.chatJumpToLatest}
          title={t.chatJumpToLatest}
          className={cn(
            "absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-raised border border-line text-body hover:text-contrast shadow-float flex items-center justify-center transition",
            FOCUS_RING,
          )}
        >
          <Icon name="chevronDown" className="w-4 h-4" />
        </button>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {said}
      </div>
    </div>
  );
}

// ─── Composer ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Grows the field with its text (up to COMPOSER_FIELD's limit), and again when the panel width re-wraps the lines. */
function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return; // our own height change
      width = el.clientWidth;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, value]);
}

/**
 * The question field with send / stop, and an optional `toolbar` under it (model picker, attachments). Controlled:
 * the caller keeps the text (so it can fill it, e.g. from a suggestion). Enter sends, Shift+Enter breaks the line, and
 * Enter while an input method is composing (Vietnamese Telex / VNI, CJK) only confirms the word. Focus returns to the
 * field once the answer to a typed question is done (not after one the app started itself: that would pop up the
 * keyboard on a tablet).
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  busy = false,
  onStop,
  placeholder,
  ariaLabel,
  disabled = false,
  maxLength = 4000,
  rows = 1,
  inputRef,
  toolbar,
}: {
  value: string;
  onChange: (text: string) => void;
  /** Gets the trimmed text; the field is not cleared here. */
  onSend: (text: string) => void;
  busy?: boolean;
  /** Shown as a Stop button while `busy`. */
  onStop?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  toolbar?: React.ReactNode;
}) {
  const t = useSemiLocale();
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? ownRef;
  const sent = useRef(false);
  useAutoGrow(ref, value);

  useEffect(() => {
    if (!busy && sent.current) {
      sent.current = false;
      ref.current?.focus();
    }
  }, [busy, ref]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy || disabled) return;
    sent.current = true;
    onSend(text);
  };
  const hint = placeholder ?? t.chatPlaceholder;

  return (
    <form
      className={COMPOSER_BAR}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className={COMPOSER_BOX}>
        <div className="flex items-end gap-2 min-w-0">
          <textarea
            ref={ref}
            value={value}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            data-autofocus
            aria-label={ariaLabel ?? hint}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // keyCode 229: Safari reports the IME's confirming Enter with isComposing already false
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={hint}
            className={COMPOSER_FIELD}
          />
          {busy && onStop ? (
            <Button iconOnly icon="stop" aria-label={t.chatStop} onClick={onStop} className="shrink-0" />
          ) : (
            <Button type="submit" variant="primary" iconOnly icon="send" aria-label={t.chatSend} disabled={busy || disabled || !value.trim()} className="shrink-0" />
          )}
        </div>
        {toolbar && <div className="pl-1 pb-0.5 flex items-center gap-1.5 min-w-0 text-caption text-muted">{toolbar}</div>}
      </div>
    </form>
  );
}

// ─── Model picker ────────────────────────────────────────────────────────────────────────────────────────────────

/** A compact chip select under the composer field (provider, model, thinking effort). */
export const CHAT_PICK_CHIP = cn(
  "inline-flex items-center gap-1 h-6 px-2 rounded-full bg-field hover:bg-raised border border-line text-caption font-medium text-body hover:text-contrast transition min-w-0 max-w-[150px] truncate",
  FOCUS_RING,
);

/**
 * Provider, model and thinking-effort chips, like the model picker of the Claude / Gemini apps; pass it as the
 * composer `toolbar`. UI only: the app lists what is ready and remembers the pick. The provider chip shows only when
 * more than one provider is offered, as its logo (`icon`; the name is the tooltip and the label in the list); the
 * effort chip only when the model takes one. The chips stay usable while an answer streams (the pick applies to the
 * next question).
 */
export function ChatModelPicker({
  providers = [],
  provider,
  onProviderChange,
  models,
  model,
  onModelChange,
  efforts = [],
  effort,
  onEffortChange,
  disabled = false,
}: {
  /** Ready providers / profiles (Claude, OpenAI, a local server…): `icon` = its logo in the text colour. */
  providers?: CustomSelectOption[];
  provider?: string;
  onProviderChange?: (value: string) => void;
  /** The current provider's models (`title` e.g. "default of this provider"). */
  models: CustomSelectOption[];
  model: string;
  onModelChange: (value: string) => void;
  /** Thinking levels the current model takes (empty = no effort chip). */
  efforts?: CustomSelectOption[];
  effort?: string;
  onEffortChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useSemiLocale();
  return (
    <span className="inline-flex items-center gap-1 min-w-0 flex-wrap">
      {providers.length > 1 && provider !== undefined && onProviderChange && (
        <CustomSelect
          variant="bare"
          buttonClassName={CHAT_PICK_CHIP}
          value={provider}
          onChange={onProviderChange}
          options={providers}
          disabled={disabled}
          aria-label={t.chatProvider}
          title={t.chatProvider}
          iconsInList
          iconOnly
        />
      )}
      <CustomSelect
        variant="bare"
        buttonClassName={CHAT_PICK_CHIP}
        value={model}
        onChange={onModelChange}
        options={models}
        disabled={disabled}
        aria-label={t.chatModel}
        title={t.chatModel}
      />
      {efforts.length > 0 && effort !== undefined && onEffortChange && (
        <CustomSelect
          variant="bare"
          buttonClassName={CHAT_PICK_CHIP}
          value={effort}
          onChange={onEffortChange}
          options={efforts}
          disabled={disabled}
          aria-label={t.chatEffort}
          title={t.chatEffort}
        />
      )}
    </span>
  );
}

// ─── View & panel ────────────────────────────────────────────────────────────────────────────────────────────────

/** Loading skeleton, `setup` (e.g. "AI is not set up" + a settings button) in place of the chat, or the list above the composer. */
export function ChatView({
  loading = false,
  setup,
  busy,
  announcement,
  label,
  empty,
  composer,
  children,
}: {
  loading?: boolean;
  setup?: React.ReactNode;
  busy?: boolean;
  announcement?: string;
  label?: string;
  /** Only the intro is showing (see ChatList). */
  empty?: boolean;
  composer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useSemiLocale();
  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-3" role="status" aria-label={t.loading}>
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  if (setup) return <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col justify-center">{setup}</div>;
  return (
    <>
      <ChatList busy={busy} announcement={announcement} label={label} empty={empty}>
        {children}
      </ChatList>
      {composer}
    </>
  );
}

/** Height of the on-screen keyboard: iOS does not resize the layout viewport, so the panel lifts its bottom edge
 *  above the keyboard to keep the field in view instead of scrolling the page. */
function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => {
      if (vv.scale > 1.01) return; // pinch zoom, not a keyboard
      setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);
  return inset;
}

export const CHAT_PANEL_WIDTH = 380;
const MIN_WIDTH = 320;
const MAX_WIDTH = 900;
/** Room left for what is beside the panel (the workspace, the page under a modal). */
const KEEP_FREE = 240;

function clampWidth(w: number, el: HTMLElement | null): number {
  const room = (el?.offsetParent as HTMLElement | null)?.clientWidth || window.innerWidth;
  return Math.round(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, room - KEEP_FREE, w)));
}

/** Width from `sm` up, dragged on the left edge; double click = default; remembered under `storageKey` (null = not). */
function usePanelWidth(panelRef: React.RefObject<HTMLElement | null>, defaultWidth: number, storageKey: string | null) {
  const [width, setWidth] = useState(defaultWidth);
  const drag = useRef<{ x: number; w: number; cur: number } | null>(null);

  useEffect(() => {
    let saved = NaN;
    try {
      if (storageKey) saved = parseInt(localStorage.getItem(storageKey) || "", 10);
    } catch {}
    if (saved > 0) setWidth(clampWidth(saved, panelRef.current));
    const onResize = () => setWidth((w) => clampWidth(w, panelRef.current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [panelRef, storageKey]);

  const save = (w: number) => {
    setWidth(w);
    try {
      if (storageKey) localStorage.setItem(storageKey, String(w));
    } catch {}
  };
  const setLive = (w: number) => panelRef.current?.style.setProperty("--semi-chat-w", `${w}px`);

  const handle = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      drag.current = { x: e.clientX, w: width, cur: width };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      document.body.classList.add("select-none");
      document.body.style.cursor = "col-resize";
      e.preventDefault();
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d) return;
      // Dragging the left edge to the left widens the panel; the DOM follows directly, the state is set once at the end
      d.cur = clampWidth(d.w - (e.clientX - d.x), panelRef.current);
      setLive(d.cur);
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      document.body.classList.remove("select-none");
      document.body.style.cursor = "";
      save(d.cur);
    },
    onDoubleClick: () => {
      const w = clampWidth(defaultWidth, panelRef.current);
      setLive(w);
      save(w);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const w = clampWidth(width + (e.key === "ArrowLeft" ? 24 : -24), panelRef.current);
      setLive(w);
      save(w);
    },
  };
  return [width, handle] as const;
}

/**
 * The side panel an AI conversation opens in. `placement="workspace"`: inside the nearest positioned parent, beside
 * the content (a tool's canvas, the page). `"screen"`: over the whole page as a dialog, also above an open Modal.
 * Phones always get the full screen. Resizable from `sm` (remembered per `widthKey`); Escape and × close it.
 * Keep it mounted with `shown={false}` while it slides out, then unmount.
 */
export function ChatPanel({
  title,
  icon = "sparkles",
  placement = "workspace",
  shown = true,
  onClose,
  onNewChat,
  newChatDisabled = false,
  actions,
  resizable = true,
  defaultWidth = CHAT_PANEL_WIDTH,
  widthKey = "semi-chat-panel-width",
  children,
}: {
  title: string;
  icon?: IconName;
  placement?: "workspace" | "screen";
  /** false while the panel animates out. */
  shown?: boolean;
  onClose: () => void;
  /** Shows the "new chat" button (pass it only once there is a conversation). */
  onNewChat?: () => void;
  newChatDisabled?: boolean;
  /** Extra header buttons, before "new chat" and close. */
  actions?: React.ReactNode;
  resizable?: boolean;
  defaultWidth?: number;
  /** localStorage key of the width; null = do not remember. */
  widthKey?: string | null;
  /** Usually a ChatView. */
  children: React.ReactNode;
}) {
  const t = useSemiLocale();
  const screen = placement === "screen";
  const panelRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [width, resizeHandle] = usePanelWidth(panelRef, defaultWidth, widthKey);
  const keyboardInset = useKeyboardInset(shown);
  const { titleId } = useDialog(panelRef, screen && shown && mounted, onClose);

  useEffect(() => setMounted(true), []);

  const panel = (
    <aside
      ref={panelRef}
      inert={!shown}
      role={screen ? "dialog" : "complementary"}
      aria-modal={screen || undefined}
      aria-labelledby={titleId}
      onKeyDown={
        screen
          ? undefined
          : (e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
              }
            }
      }
      style={{ "--semi-chat-w": `${width}px`, ...(keyboardInset ? { bottom: keyboardInset } : {}) } as React.CSSProperties}
      className={cn(
        screen ? "fixed z-dialog max-sm:pt-[env(safe-area-inset-top)]" : "absolute z-drawer sm:z-sticky",
        "top-0 right-0 bottom-0 w-full sm:w-(--semi-chat-w) bg-panel sm:border-l border-line flex flex-col min-h-0 shadow-overlay overflow-hidden",
        shown ? "slide-panel-in" : "slide-panel-out pointer-events-none",
      )}
    >
      {resizable && (
        <div
          {...resizeHandle}
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-label={t.chatResize}
          title={t.chatResize}
          className="max-sm:hidden absolute inset-y-0 left-0 w-1.5 z-10 cursor-col-resize touch-none select-none group outline-none hover:bg-accent focus-visible:bg-accent active:bg-accent-hover transition-colors duration-150"
        >
          <div className="absolute inset-y-0 -right-1.5 left-0 cursor-col-resize" />
          <div className="absolute top-1/2 left-0.5 -translate-y-1/2 w-3.5 h-9 rounded-full bg-field border border-line group-hover:border-primary-500 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity shadow-float">
            <div className="flex flex-col gap-0.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-0.5 h-0.5 rounded-full bg-line-hover group-hover:bg-accent" />
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="relative px-4 pt-3 pb-2.5 flex items-center gap-2.5 border-b border-divider shrink-0">
        <IconTile name={icon} tone="green" size="sm" />
        <h2 id={titleId} className="min-w-0 flex-1 text-ui-lg font-semibold text-contrast tracking-tight truncate">
          {title}
        </h2>
        {actions}
        {onNewChat && <Button iconOnly icon="plus" aria-label={t.chatNewChat} onClick={onNewChat} disabled={newChatDisabled} />}
        <button type="button" onClick={onClose} className={MODAL_CLOSE} title={t.close} aria-label={t.close}>
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>
      {children}
    </aside>
  );

  if (!screen) return panel;
  if (!mounted) return null;
  // Over a modal: on <body> (a backdrop-filter of the modal would otherwise be the panel's containing block), and no
  // event goes on to the modal: React still bubbles portal events to it, and its backdrop closes on any click.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return createPortal(
    <div onClick={stop} onMouseDown={stop} onPointerDown={stop} onTouchStart={stop} onKeyDown={stop}>
      <div className={cn("fixed inset-0 z-dialog bg-overlay", !shown && "opacity-0 pointer-events-none transition-opacity")} aria-hidden />
      {panel}
    </div>,
    document.body,
  );
}

// ─── Ready-made chat ─────────────────────────────────────────────────────────────────────────────────────────────

export interface ChatItem {
  /** Stable key (falls back to the index). */
  id?: string | number;
  role: "user" | "assistant";
  /** Plain text for the user, Markdown for the assistant (may grow while it streams). */
  content: string;
  /** The answer is still coming. */
  pending?: boolean;
  /** The answer failed: shown as ChatError with retry. */
  error?: string;
  /** User turn whose answer failed: shown dimmed. */
  failed?: boolean;
}

/** An answer as most chats show it: the error (with retry), the Markdown text with copy, or "thinking" while empty. */
export function ChatAnswer({ msg, onRetry, copyable = true }: { msg: ChatItem; onRetry?: () => void; copyable?: boolean }) {
  if (msg.error) return <ChatError onRetry={onRetry}>{msg.error}</ChatError>;
  return (
    <AssistantMessage busy={msg.pending} actions={copyable && msg.content ? <ChatCopyButton text={msg.content} /> : undefined}>
      {msg.content ? <Markdown text={msg.content} /> : msg.pending ? <ChatThinking /> : null}
    </AssistantMessage>
  );
}

/**
 * ChatPanel + ChatView + ChatComposer with the messages drawn the standard way. The app owns `messages` and `busy`;
 * the composer text is kept here unless `value` / `onValueChange` are passed (to fill it from a suggestion).
 */
export function AIChat<M extends ChatItem>({
  title,
  icon,
  placement,
  shown,
  onClose,
  loading = false,
  setup,
  messages,
  busy,
  onSend,
  onStop,
  onRetry,
  onNewChat,
  placeholder,
  empty,
  listEnd,
  toolbar,
  actions,
  renderUser,
  renderAnswer,
  composer = true,
  value,
  onValueChange,
  widthKey,
}: {
  title: string;
  icon?: IconName;
  placement?: "workspace" | "screen";
  shown?: boolean;
  onClose: () => void;
  loading?: boolean;
  setup?: React.ReactNode;
  messages: M[];
  busy: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
  /** Retry for a failed answer (gets that message). */
  onRetry?: (m: M) => void;
  /** Clears the conversation; the button shows once there is a message. */
  onNewChat?: () => void;
  placeholder?: string;
  /** Shown while there is no message (ChatIntro, ChatSuggestions). */
  empty?: React.ReactNode;
  /** Under the last message (follow-up choices, a note). */
  listEnd?: React.ReactNode;
  /** Under the field (model picker, attachments). */
  toolbar?: React.ReactNode;
  actions?: React.ReactNode;
  renderUser?: (m: M) => React.ReactNode;
  renderAnswer?: (m: M) => React.ReactNode;
  /** false hides the composer (read-only conversation). */
  composer?: boolean;
  value?: string;
  onValueChange?: (text: string) => void;
  widthKey?: string | null;
}) {
  const [own, setOwn] = useState("");
  const text = value ?? own;
  const setText = onValueChange ?? setOwn;
  const last = [...messages].reverse().find((m) => m.role === "assistant");
  const chatShown = !loading && !setup;

  return (
    <ChatPanel
      title={title}
      icon={icon}
      placement={placement}
      shown={shown}
      onClose={onClose}
      actions={actions}
      onNewChat={chatShown && composer && onNewChat && messages.length > 0 ? onNewChat : undefined}
      newChatDisabled={busy}
      widthKey={widthKey}
    >
      <ChatView
        loading={loading}
        setup={setup}
        busy={busy}
        label={title}
        empty={messages.length === 0}
        announcement={last?.error ?? last?.content}
        composer={
          composer && (
            <ChatComposer
              value={text}
              onChange={setText}
              onSend={(t) => {
                setText("");
                onSend(t);
              }}
              busy={busy}
              onStop={onStop}
              placeholder={placeholder}
              toolbar={toolbar}
            />
          )
        }
      >
        {messages.length === 0 && empty}
        {messages.map((m, i) => (
          <React.Fragment key={m.id ?? i}>
            {m.role === "user"
              ? (renderUser?.(m) ?? <UserMessage failed={m.failed}>{m.content}</UserMessage>)
              : (renderAnswer?.(m) ?? <ChatAnswer msg={m} onRetry={onRetry ? () => onRetry(m) : undefined} />)}
          </React.Fragment>
        ))}
        {listEnd}
      </ChatView>
    </ChatPanel>
  );
}
