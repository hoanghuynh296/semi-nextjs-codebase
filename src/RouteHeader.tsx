"use client";

// The row on top of AppShell's content column (#144, docs/DESIGN_SYSTEM.md §4): the breadcrumb on the left, an optional
// middle, the page's action icons and the account avatar menu on the right. AppShell renders it from its `header` prop;
// it is exported for a frame that composes its own column.
import React, { createContext, Suspense, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { LetterAvatar } from "./Feedback";
import { Menu, Tooltip, type MenuItem } from "./Overlay";
import { useSemiLocale } from "./locale";
import { useThemeChoices } from "./ThemeProvider";
import { cn, FOCUS_RING } from "../styles/utils";

/** One crumb of the route header. Every crumb is muted; the last is the current page and needs no `href`. */
export interface RouteCrumb {
  label: string;
  href?: string;
  icon?: IconName;
}

/** Who is signed in, for the account avatar menu. */
export interface ShellAccount {
  /** The person's name: the avatar shows its first letter, the menu header shows it whole. */
  name: string;
  /** One line under the name in the menu header: a role or an email. */
  detail?: string;
  /** A photo in place of the letter. */
  avatarSrc?: string;
  /** The app's own items (Tài khoản, Cài đặt…), between the theme choices and sign-out. */
  items?: MenuItem[];
  /** Adds the last item, "Đăng xuất" (locale `signOut`), after a divider. */
  onSignOut?: () => void;
  /** Light / Dark / System as radio items at the top (default true). Turn off only when the app pins one theme. */
  theme?: boolean;
}

// ─── Record crumb ───────────────────────────────────────────────────────────────────────────────────────────────

type RecordCrumbState = { label: string | null; set: (label: string | null) => void };
/** The record a detail page shows (internal: AppShell provides it). */
export const RecordCrumbContext = createContext<RecordCrumbState>({ label: null, set: () => undefined });

/**
 * A detail page names its record ("DH-1042") for the route header's trail while it is on screen; the crumb goes away
 * when the page unmounts or the label becomes empty. Call it in the page, inside AppShell.
 */
export function useRecordCrumb(label: string | null | undefined) {
  const { set } = useContext(RecordCrumbContext);
  useEffect(() => {
    set(label || null);
    return () => set(null);
  }, [label, set]);
}

// ─── Account menu ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The account avatar menu of the route header: a one-letter avatar (32px) whose Menu has a header (name, role or email),
 * then the theme (Light / Dark / System), the app's items and sign-out.
 */
export function AccountMenu({ name, detail, avatarSrc, items = [], onSignOut, theme = true }: ShellAccount) {
  const t = useSemiLocale();
  const choices = useThemeChoices();
  const label = `${t.account}: ${name}`;
  const all: MenuItem[] = [
    ...(theme ? choices.items.map((it) => ({ ...it, group: choices.label })) : []),
    ...items.map((it, i) => (i === 0 && theme ? { ...it, separator: true } : it)),
    ...(onSignOut ? [{ label: t.signOut, icon: "logout" as IconName, onSelect: onSignOut, separator: theme || items.length > 0 }] : []),
  ];
  return (
    <Menu
      label={label}
      items={all}
      header={
        <>
          <span className="block truncate text-ui font-medium text-strong">{name}</span>
          {detail && <span className="block truncate text-chrome text-muted">{detail}</span>}
        </>
      }
      trigger={
        <Tooltip content={name}>
          <button type="button" aria-label={label} className={cn("w-8 h-8 max-md:w-11 max-md:h-11 shrink-0 rounded-full flex items-center justify-center cursor-pointer", FOCUS_RING)}>
            <span aria-hidden className="inline-flex">
              <LetterAvatar name={name} src={avatarSrc} size="md" />
            </span>
          </button>
        </Tooltip>
      }
    />
  );
}

// ─── Route header ───────────────────────────────────────────────────────────────────────────────────────────────

export interface RouteHeaderProps {
  /** The trail: group (a link), page, record. Every crumb is muted; the trail never wraps and long crumbs truncate. */
  crumbs: RouteCrumb[];
  /** Optional middle: a search field on a search page, a small info banner. Hidden below `md`. In its own Suspense. */
  middle?: React.ReactNode;
  /** The page's action icon buttons (32×32, ghost or outline); keep room for a future AI chat button. In its own Suspense. */
  actions?: React.ReactNode;
  /** The account avatar menu: the who-is-signed-in data, or your own element. */
  account?: ShellAccount | React.ReactNode;
  /** Phones: the menu button that opens the nav drawer (shown below `md` when set). */
  onMenu?: () => void;
  menuExpanded?: boolean;
  className?: string;
}

const isAccount = (a: unknown): a is ShellAccount => !!a && typeof a === "object" && !React.isValidElement(a) && typeof (a as ShellAccount).name === "string";

/** The fallback of a slot that suspends (reads search params): keeps the row's height. */
function SlotSkeleton() {
  return <span aria-hidden className="block w-24 h-6 rounded-control shimmer" />;
}

function Trail({ crumbs, className, label, hidden }: { crumbs: RouteCrumb[]; className?: string; label: string; hidden?: boolean }) {
  const body = (
    <ol className="flex flex-nowrap items-center gap-1 min-w-0 text-chrome font-normal text-muted">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        const inner = (
          <>
            {c.icon && <Icon name={c.icon} className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{c.label}</span>
          </>
        );
        return (
          <li key={i} className={cn("flex items-center gap-1 min-w-0", last ? "shrink" : "shrink-[4]")}>
            {c.href && !last ? (
              <Link href={c.href} tabIndex={hidden ? -1 : undefined} className={cn("inline-flex items-center gap-1 min-w-0 rounded-chip hover:text-strong transition-hover", FOCUS_RING)}>
                {inner}
              </Link>
            ) : (
              <span aria-current={last ? "page" : undefined} className="inline-flex items-center gap-1 min-w-0">
                {inner}
              </span>
            )}
            {!last && <Icon name="chevron" className="w-3.5 h-3.5 shrink-0" />}
          </li>
        );
      })}
    </ol>
  );
  // the leaving copy is decoration: out of the a11y tree, not clickable
  if (hidden) {
    return (
      <div aria-hidden className={className}>
        {body}
      </div>
    );
  }
  return (
    <nav aria-label={label} className={className}>
      {body}
    </nav>
  );
}

/**
 * The route header: h60 from `lg` (56 below), padding 0 8px (16px from `sm`), the column's full width. Crumbs enter with
 * `motion-crumb-in` and leave with `motion-crumb-out` (opacity only under reduced motion); the row itself never moves.
 */
export function RouteHeader({ crumbs, middle, actions, account, onMenu, menuExpanded, className }: RouteHeaderProps) {
  const t = useSemiLocale();
  const key = crumbs.map((c) => c.label).join("\u203a");
  // a new trail: the old one fades out on top while the new one slides in (not on the first render). State updated
  // during render (React's pattern for state derived from props), so the new trail paints in the same frame.
  const [prev, setPrev] = useState({ key, crumbs });
  const [animate, setAnimate] = useState(false);
  const [leaving, setLeaving] = useState<{ key: string; crumbs: RouteCrumb[] } | null>(null);
  if (prev.key !== key) {
    setLeaving(prev);
    setPrev({ key, crumbs });
    setAnimate(true);
  }
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setLeaving(null), 160);
    return () => clearTimeout(id);
  }, [leaving]);

  return (
    <header className={cn("shrink-0 h-14 lg:h-15 px-2 sm:px-4 flex items-center gap-3 min-w-0", className)}>
      {onMenu && (
        <button
          type="button"
          onClick={onMenu}
          aria-label={t.openMenu}
          aria-haspopup="dialog"
          aria-expanded={menuExpanded}
          className={cn("md:hidden -ml-1 w-11 h-11 shrink-0 rounded-control flex items-center justify-center text-strong hover:bg-item-hover transition-hover cursor-pointer", FOCUS_RING)}
        >
          <Icon name="menu" className="w-5 h-5" />
        </button>
      )}
      <div className="relative flex-1 min-w-0 flex items-center overflow-hidden">
        <Trail key={key} crumbs={crumbs} label={t.breadcrumb} className={cn("min-w-0", animate && "animate-crumb-in")} />
        {leaving && <Trail key={`out-${leaving.key}`} crumbs={leaving.crumbs} label={t.breadcrumb} hidden className="semi-crumb-out absolute inset-y-0 left-0 flex items-center pointer-events-none" />}
      </div>
      {middle && (
        <div className="hidden md:flex min-w-0 max-w-[40%] items-center">
          <Suspense fallback={<SlotSkeleton />}>{middle}</Suspense>
        </div>
      )}
      {(actions || account) && (
        <div className="shrink-0 flex items-center gap-1">
          {actions && <Suspense fallback={<SlotSkeleton />}>{actions}</Suspense>}
          {account && (isAccount(account) ? <AccountMenu {...account} /> : account)}
        </div>
      )}
    </header>
  );
}
