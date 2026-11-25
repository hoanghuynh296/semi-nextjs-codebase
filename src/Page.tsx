"use client";

// 1.0 page layouts, sub-nav card and vertical rhythm (#149, docs/DESIGN_SYSTEM.md §4a):
// - `layout="work"` (default): flush, no centred max-width, card padding 16 / 24.
// - `layout="reading"`: one column centred at max 1536px inside 16px card padding, 64px bottom padding.
// - `layout="two-column"`: 240px (`md:w-60`) sub-nav card (padding 20 / 10) + 4px gap + main card (padding 24);
//   below `md` the sub-nav stacks above the content.
// - Vertical rhythm owned by the layout: 32px from the card top to the header block, 28px from the title or tabs to
//   the intro (or to the toolbar), 32px between blocks, 16px from a section heading to its content (`PageSection`),
//   8px inside grids and cards (`PageGrid`).
import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { Tooltip } from "./Overlay";
import { PageEnter } from "./PageEnter";
import { PageTitle } from "./PageTitle";
import { useSemiLocale } from "./locale";
import { cn, FOCUS_RING, HIT_AREA } from "../styles/utils";

/** One destination or filter item inside a `SubNavSection`. */
export interface SubNavItem {
  id: string;
  label: string;
  /** Optional 16px icon before the label. */
  icon?: IconName;
  /** Route link (`next/link`); omit for an in-page filter or view handled by `onClick` / `onSelect`. */
  href?: string;
  onClick?: () => void;
  /** Quiet trailing count or short meta (`text-chrome tabular-nums`). */
  meta?: React.ReactNode;
}

/** A 16px icon action on the right of a `SubNavSection` group label (e.g. `+` to create a mail group). */
export interface SubNavAction {
  label: string;
  icon: IconName;
  onClick: () => void;
}

/** One section of a `SubNav`: an optional faint 10/500 uppercase label row (h32) + items (h32, 2px apart). */
export interface SubNavSection {
  label?: string;
  /** Optional 16px icon actions at the right end of the group label row. */
  actions?: SubNavAction[] | React.ReactNode;
  items: SubNavItem[];
}

const isActionArray = (a: unknown): a is SubNavAction[] => Array.isArray(a);

/**
 * The 240px sub-navigation card of a `two-column` page (`Page layout="two-column" subNav={<SubNav … />}`):
 * padding 20 / 10, sections separated by a 1px `bg-raised` line, group labels in `text-nav-label` (10 / 500 uppercase
 * faint, row h32, optional 16px icon actions on the right), and items (h32, `rounded-control`, padding 4 / 16,
 * `text-chrome` 12 / 500, 16px icon, 2px apart; inactive `text-muted`, hover `bg-item-hover`, active
 * `bg-item-selected text-strong`).
 */
export function SubNav({
  sections,
  activeId,
  onSelect,
  label,
  className,
}: {
  sections: SubNavSection[];
  activeId: string;
  onSelect?: (id: string) => void;
  /** Accessible name of the sub-nav landmark (default locale `subNav`). */
  label?: string;
  className?: string;
}) {
  const t = useSemiLocale();
  const itemBase = cn(
    "w-full h-8 py-1 px-4 rounded-control flex items-center gap-2 text-chrome font-medium whitespace-nowrap transition-nav cursor-pointer",
    FOCUS_RING,
  );
  return (
    <aside
      aria-label={label ?? t.subNav}
      data-subnav=""
      className={cn("w-full bg-panel sm:rounded-panel py-5 px-2.5 flex flex-col", className)}
    >
      {sections.map((section, idx) => {
        if (!section.items.length && !section.label) return null;
        return (
          <React.Fragment key={section.label ?? idx}>
            {idx > 0 && <div aria-hidden className="my-3 mx-1.5 h-px bg-raised shrink-0" />}
            {section.label && (
              <div className="h-8 px-4 py-1.5 flex items-center justify-between gap-2 select-none shrink-0">
                <span className="text-nav-label truncate">{section.label}</span>
                {section.actions && (
                  <span className="flex items-center gap-1 shrink-0 text-muted">
                    {isActionArray(section.actions)
                      ? section.actions.map((act) => (
                          <Tooltip key={act.label} content={act.label}>
                            <button
                              type="button"
                              aria-label={act.label}
                              onClick={act.onClick}
                              className={cn(
                                "relative w-5 h-5 rounded-chip flex items-center justify-center text-muted hover:text-strong hover:bg-item-hover transition-hover cursor-pointer",
                                HIT_AREA,
                                FOCUS_RING,
                              )}
                            >
                              <Icon name={act.icon} className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        ))
                      : section.actions}
                  </span>
                )}
              </div>
            )}
            <nav aria-label={section.label ?? `${label ?? t.subNav} ${idx + 1}`} className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = item.id === activeId;
                const stateCls = active ? "bg-item-selected text-strong" : "text-muted hover:bg-item-hover hover:text-strong";
                const inner = (
                  <>
                    {item.icon && <Icon name={item.icon} className="w-4 h-4 shrink-0" />}
                    <span className="flex-1 min-w-0 truncate text-left">{item.label}</span>
                    {item.meta !== undefined && <span className="shrink-0 text-chrome tabular-nums text-muted">{item.meta}</span>}
                  </>
                );
                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => onSelect?.(item.id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(itemBase, stateCls)}
                    >
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => (item.onClick ? item.onClick() : onSelect?.(item.id))}
                    aria-current={active ? "true" : undefined}
                    className={cn(itemBase, stateCls)}
                  >
                    {inner}
                  </button>
                );
              })}
            </nav>
          </React.Fragment>
        );
      })}
    </aside>
  );
}

/**
 * One content section inside `<Page>`: a 20 / 500 heading (`text-section`) spaced 16px (`gap-4`) above its content,
 * with optional actions on the heading row. Multiple `PageSection`s inside `<Page>` sit 32px apart automatically.
 */
export function PageSection({
  title,
  editorial = false,
  actions,
  description,
  headingLevel = 2,
  children,
  className,
}: {
  title?: React.ReactNode;
  /** Use `font-display` on the 20px section heading (discovery / editorial reading pages only). */
  editorial?: boolean;
  /** Optional quiet control or link on the right of the heading row. */
  actions?: React.ReactNode;
  /** Optional short muted line under the heading. */
  description?: React.ReactNode;
  headingLevel?: 2 | 3;
  children: React.ReactNode;
  className?: string;
}) {
  const H = `h${headingLevel}` as const;
  return (
    <section data-page-section="" className={cn("flex flex-col gap-4 min-w-0", className)}>
      {(title || actions || description) && (
        <div className="flex flex-col gap-1 min-w-0">
          {(title || actions) && (
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              {title && <H className={cn("text-section text-strong min-w-0 flex-1", editorial && "font-display font-medium")}>{title}</H>}
              {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {description && <p className="text-ui text-muted max-w-3xl">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

const GRID_COLS = {
  2: "@md:grid-cols-2",
  3: "@md:grid-cols-2 @2xl:grid-cols-3",
  4: "@sm:grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4",
} as const;

/** Compact 8px (`gap-2`) grid inside a `<PageSection>` or `<Card>`, sized by `@container` width (§4a rhythm). */
export function PageGrid({
  columns = 3,
  children,
  className,
}: {
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-page-grid="" className={cn("grid grid-cols-1 gap-2 min-w-0", GRID_COLS[columns], className)}>
      {children}
    </div>
  );
}

export type PageLayout = "work" | "reading" | "two-column";

/**
 * Shared 1.0 page anatomy and layout inside `AppShell`'s content card (#149, #71):
 * - `layout="work"` (default): flush, no centred max-width, card padding 16 / 24 (`px-4 sm:px-6`).
 * - `layout="reading"`: centred at max 1536px (`max-w-screen-2xl`) inside 16px card padding, 64px bottom padding.
 * - `layout="two-column"`: 240px (`md:w-60`) sub-nav card + 4px gap + main card (padding 24); stacks below `md`.
 *
 * Owns the vertical rhythm from the card top (32px to the header block, 28px from title or tabs to intro / toolbar,
 * 16px from filter toolbar to list, 32px between content blocks), so pages set no margins on those joins.
 */
export function Page({
  layout = "work",
  fixed = false,
  enter = false,
  subNav,
  title,
  titleVariant = "work",
  actions,
  tabs,
  intro,
  toolbar,
  children,
  footer,
  className,
}: {
  /**
   * Page layout inside the content card: `"work"` (flush, 16 / 24), `"reading"` (centred max 1536px inside 16px card
   * padding, 64px bottom), or `"two-column"` (240px sub-nav card + 4px gap + main card).
   * @default "work"
   */
  layout?: PageLayout;
  /**
   * Fixed-height page: fills the content column without scrolling the card so inner panels (`ListReaderLayout`, a
   * pinned list) scroll independently. Works inside `<AppShell page="fixed">` or a shared `<AppShell>`.
   */
  fixed?: boolean;
  /**
   * Run `motion-enter` + `motion-stagger` on the page's top blocks and first ~10 rows / cards once per route
   * (`PageEnter`). Pass `true` to key by pathname, or a string for a custom route key. Adds no layout box.
   */
  enter?: boolean | string;
  /** Sub-navigation card for `layout="two-column"` (`<SubNav sections={…} activeId={…} />`). */
  subNav?: React.ReactNode;
  /** Page heading: a string / node rendered via `PageTitle` (18/400 UI sans by default), or leave out when `tabs` is big `TextTabs`. */
  title?: React.ReactNode;
  /** On a `"reading"` page, `"reading"` opts into the 44 / 500 display title (`text-title-xl`). Ignored on other layouts. */
  titleVariant?: "work" | "reading";
  /** Actions at the right end of the title row (one `inverse` or `primary` action, optional `•••` `Menu` / `RefreshButton`). */
  actions?: React.ReactNode;
  /** Optional tab bar (`PillTabs`, `Tabs`, `SegmentedControl`, `TextTabs`). */
  tabs?: React.ReactNode;
  /** Optional lead intro under the title or tabs (28px below). */
  intro?: React.ReactNode;
  /** Optional sticky toolbar / filter row (`StickyContextBar`, `SubpageToolbar`); content sits 16px below it. */
  toolbar?: React.ReactNode;
  /** Page blocks (spaced 32px apart; in `fixed` mode, fills the remaining height). */
  children: React.ReactNode;
  /** Optional page footer (`Pagination`, `FormActions`). */
  footer?: React.ReactNode;
  className?: string;
}) {
  const hasTitle = title !== undefined && title !== null && title !== false;
  const hasTabs = tabs !== undefined && tabs !== null && tabs !== false;
  const hasIntro = intro !== undefined && intro !== null && intro !== false;
  const hasToolbar = toolbar !== undefined && toolbar !== null && toolbar !== false;
  const hasFooter = footer !== undefined && footer !== null && footer !== false;
  const hasHeader = hasTitle || hasTabs || hasIntro || Boolean(actions);
  const resolvedVariant = layout === "reading" ? titleVariant : "work";

  const headerNode = hasHeader ? (
    <header
      data-page-header=""
      className={cn(
        "shrink-0 flex flex-col gap-7 min-w-0",
        hasToolbar ? "mb-7" : fixed ? "mb-4" : "mb-8",
      )}
    >
      {(hasTitle || actions) && (
        <PageTitle title={title ?? ""} actions={actions} variant={resolvedVariant} className="!mb-0" />
      )}
      {hasTabs && <div className="min-w-0 *:!mb-0">{tabs}</div>}
      {hasIntro && <div data-page-intro="" className="text-lead text-muted max-w-3xl">{intro}</div>}
    </header>
  ) : null;

  const bodyNode = fixed ? (
    <div data-page-body="" className="flex-1 min-h-0 min-w-0 flex flex-col">
      {children}
    </div>
  ) : (
    <div data-page-body="" className="flex flex-col gap-8 min-w-0">
      {children}
    </div>
  );

  // StickyContextBar / FormActions must stay direct children of the column so CSS position: sticky spans the full page.
  const flow = (
    <>
      {headerNode}
      {toolbar}
      {bodyNode}
      {hasFooter && <div data-page-footer="" className={cn("shrink-0 min-w-0", !fixed && "mt-8")}>{footer}</div>}
    </>
  );

  const wrap = (node: React.ReactElement) =>
    enter ? <PageEnter routeKey={typeof enter === "string" ? enter : undefined}>{node}</PageEnter> : node;

  if (layout === "reading") {
    return wrap(
      <div
        data-page-layout="reading"
        data-page-fixed={fixed ? "" : undefined}
        className={cn("@container w-full min-w-0 flex-1 flex flex-col px-4 pt-4 pb-16", fixed && "h-full min-h-0", className)}
      >
        <div
          data-page-column=""
          className={cn(
            "mx-auto w-full max-w-screen-2xl min-w-0 flex-1 flex flex-col",
            hasHeader && "pt-4",
            fixed && "min-h-0",
          )}
        >
          {flow}
        </div>
      </div>,
    );
  }

  if (layout === "two-column") {
    const subNavEnhanced =
      React.isValidElement<{ className?: string }>(subNav) && subNav.type === SubNav
        ? React.cloneElement(subNav, {
            className: cn(
              "md:flex-1",
              fixed && "md:min-h-0 md:overflow-y-auto overscroll-contain",
              subNav.props.className,
            ),
          })
        : subNav;
    return wrap(
      <div
        data-page-layout="two-column"
        data-page-fixed={fixed ? "" : undefined}
        className={cn("w-full min-w-0 flex-1 flex flex-col md:flex-row gap-1", fixed && "h-full min-h-0", className)}
      >
        {subNav && (
          <div
            data-page-subnav=""
            className={cn("shrink-0 w-full md:w-60 flex flex-col", fixed ? "md:min-h-0" : "md:sticky md:top-0 md:self-start")}
          >
            {subNavEnhanced}
          </div>
        )}
        <div
          data-page-main=""
          className={cn(
            "@container flex-1 min-w-0 flex flex-col bg-panel sm:rounded-panel [--semi-app:var(--semi-panel)] p-6 [&>[role=search]]:max-sm:-mx-6 [&>[role=search]]:max-sm:px-6",
            hasHeader && "pt-8",
            fixed && "min-h-0 overflow-hidden",
          )}
        >
          {flow}
        </div>
      </div>,
    );
  }

  return wrap(
    <div
      data-page-layout="work"
      data-page-fixed={fixed ? "" : undefined}
      className={cn(
        "@container w-full min-w-0 flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6",
        hasHeader && "!pt-8",
        fixed && "h-full min-h-0",
        className,
      )}
    >
      {flow}
    </div>,
  );
}
