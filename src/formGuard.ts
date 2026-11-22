// Pure decisions behind useUnsavedGuard and FormActions (no React, no DOM objects: the unit tests call them directly).

/** The pieces of a click that decide whether it leaves the page. */
export interface ClickInfo {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** The pieces of the clicked `<a>` that decide it. */
export interface LinkInfo {
  href: string;
  target: string;
  download: boolean;
}

/**
 * True when a click on a link is an in-app navigation to another page, the kind that unmounts a dirty form: a plain
 * left click, same origin, not a new tab / download / modifier click, and a different path or query (a hash on the
 * same page stays). Anything else (new tab, other site, anchor jump) must not be intercepted.
 */
export function leavesPage(click: ClickInfo, link: LinkInfo, currentHref: string): boolean {
  if (click.defaultPrevented || click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return false;
  if (link.download || (link.target && link.target !== "_self")) return false;
  let to: URL;
  let from: URL;
  try {
    from = new URL(currentHref);
    to = new URL(link.href, from);
  } catch {
    return false;
  }
  if (to.origin !== from.origin || !/^https?:$/.test(to.protocol)) return false;
  return to.pathname !== from.pathname || to.search !== from.search;
}

/**
 * How far the on-screen keyboard covers the bottom of the layout viewport, in px (0 when it is closed or the page is
 * pinch-zoomed: a zoomed visual viewport is smaller too). A sticky bar sets `bottom` to this to stay above the keyboard.
 */
export function keyboardInset(vv: { height: number; offsetTop: number; scale: number }, innerHeight: number): number {
  if (vv.scale > 1.01) return 0;
  const inset = Math.round(innerHeight - vv.height - vv.offsetTop);
  return inset > 80 ? inset : 0;
}

/** The marker `useUnsavedGuard` puts on the history entry it adds, so back / forward can be told apart. */
export const GUARD_STATE_KEY = "__semiUnsavedGuard";
