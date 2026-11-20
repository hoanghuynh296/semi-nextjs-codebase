// Density and hierarchy budgets measured on the rendered page (DESIGN_SYSTEM.md §4c). semi-lint reads code one line
// at a time, so it cannot see a row that is tight because its padding comes from three files; this reads what the
// browser drew. densityAudit() runs in the page (Playwright page.evaluate, or pasted into a browser tool): it only
// uses browser globals, no imports and no closures, so its source can be sent as a string.
//
//   import { densityAudit, DENSITY_RULES } from "./density.mjs";
//   const hits = await page.evaluate(densityAudit, { scope: "main" });
//
// Every length scales with the product's density unit (--spacing, 4px at regular) and control height
// (--spacing-control), so a compact dashboard and an airy store are held to their own budgets.

/** [id, budget]: the texts semi-check prints next to a hit. Keep them in step with DESIGN_SYSTEM.md §4c. */
export const DENSITY_RULES = [
  ["tight-box", "Text in a box (card, panel, callout, tile) sits at least 12px from its sides and 8px from top and bottom (p-card, or px-3 py-2 for a callout)."],
  ["tight-row", "A row in a list or menu is at least as tall as a control (h-control) when it is clickable, and its text keeps 6px above and below: use Item / ItemGroup, Menu, DataTable."],
  ["box-nesting", "At most three framed boxes inside each other (page panel › card › tile): a fourth frame is noise; use space, a divider or plain text instead."],
  ["type-mix", "At most four text sizes in one box (title, body, label, caption): a fifth size makes the box read as a collage."],
  ["colour-noise", "At most three colours (accent + status) in one box: colour means something (§3), so more reads as decoration."],
  ["primary-actions", "One filled accent button per view (page, dialog, form): the rest are secondary or ghost."],
  ["cramped-boxes", "Boxes side by side keep 8px or more between them (gap-group between cards, gap-stack between tiles), or share an edge on purpose (0)."],
  ["double-line", "One line between two things: a border next to another border (card edge + row divider, divide-y + border-b) reads as a double line."],
];

/**
 * Measure the page against the density budgets. Runs in the browser.
 * @param {{ scope?: string, limit?: number }} [opts] scope: CSS selector of the area to check (default body);
 *   limit: hits kept per rule (default 20).
 * @returns {{ rule: string, where: string, cls: string, text: string, value: string }[]}
 */
export function densityAudit(opts) {
  const o = opts || {};
  const root = (o.scope && document.querySelector(o.scope)) || document.body;
  const limit = o.limit || 20;

  // Density unit and control height as the page resolves them (4px / 34px in Flat at regular density).
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;left:0;top:0;width:calc(var(--spacing, 0.25rem) * 4);height:var(--spacing-control, 34px);background:var(--color-accent, transparent)";
  (root.closest("[data-density]") || root).appendChild(probe);
  const u = probe.getBoundingClientRect().width / 4 || 4;
  const control = probe.getBoundingClientRect().height || 34;
  const accentRaw = getComputedStyle(probe).backgroundColor;
  probe.remove();

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const colours = new Map();
  const rgba = (c) => {
    if (!colours.has(c)) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      colours.set(c, [d[0], d[1], d[2], d[3] / 255]);
    }
    return colours.get(c);
  };
  const accent = rgba(accentRaw);
  const near = (a, b, tol) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= tol;
  const chroma = (c) => Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
  const hue = (c) => {
    const [r, g, b] = c;
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    if (!d) return 0;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };

  const styles = new Map();
  const css = (el) => {
    if (!styles.has(el)) styles.set(el, getComputedStyle(el));
    return styles.get(el);
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = css(el);
    return s.visibility !== "hidden" && s.opacity !== "0";
  };

  // The colour a box is painted with, its parent's surface blended under it.
  const surfaces = new Map();
  const surface = (el) => {
    if (!el) return [255, 255, 255, 1];
    if (surfaces.has(el)) return surfaces.get(el);
    const own = rgba(css(el).backgroundColor);
    const under = el.parentElement ? surface(el.parentElement) : (() => {
      const h = rgba(getComputedStyle(document.documentElement).backgroundColor);
      return h[3] < 1 ? [255, 255, 255, 1] : h;
    })();
    const out = own[3] > 0 ? [0, 1, 2].map((i) => own[i] * own[3] + under[i] * (1 - own[3])).concat(1) : under;
    surfaces.set(el, out);
    return out;
  };

  const CONTROL = /^(BUTTON|INPUT|TEXTAREA|SELECT|OPTION|LABEL|IMG|SVG|CANVAS|VIDEO|IFRAME|PICTURE|HR)$/;
  const CONTROL_ROLE = /^(button|tab|option|menuitem|menuitemradio|menuitemcheckbox|switch|checkbox|radio|slider|progressbar|separator|tooltip)$/;
  const lineOn = (s, side) => parseFloat(s[`border${side}Width`]) >= 1 && s[`border${side}Style`] !== "none" && rgba(s[`border${side}Color`])[3] > 0.05;
  // A framed box: a border on three or more sides, or its own surface (different from the one under it) with
  // rounded corners or a shadow. Controls, chips and one-line things are not boxes.
  const boxes = new Map();
  const isBox = (el) => {
    if (boxes.has(el)) return boxes.get(el);
    let box = false;
    const tag = el.tagName.toUpperCase();
    if (!CONTROL.test(tag) && !CONTROL_ROLE.test(el.getAttribute("role") || "") && !el.hasAttribute("data-density-view") && visible(el)) {
      const r = el.getBoundingClientRect();
      if (r.height >= Math.max(48, control * 1.4) && r.width >= 120) {
        const s = css(el);
        const sides = ["Top", "Right", "Bottom", "Left"].filter((d) => lineOn(s, d)).length;
        const own = rgba(s.backgroundColor);
        const differs = own[3] > 0.02 && el.parentElement && !near(surface(el), surface(el.parentElement), 6);
        const shaped = parseFloat(s.borderTopLeftRadius) > 0 || (s.boxShadow !== "none" && !/inset/.test(s.boxShadow));
        // A field frame (a composer, an input group: a field and its buttons, no text of its own) is a control,
        // however tall it grows.
        let isField = !!el.querySelector("textarea, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), [contenteditable=true]");
        if (isField) {
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n && isField; n = w.nextNode())
            if (n.data.trim() && !n.parentElement.closest("button, [role=button], [role=combobox], .sr-only")) isField = false;
        }
        box = !isField && (sides >= 3 || (differs && shaped));
      }
    }
    boxes.set(el, box);
    return box;
  };
  // data-density-view marks a frame that stands for a whole screen (a docs example, a sample app in a brand book):
  // it is not a box, and the boxes inside it start counting again.
  const VIEW = "[data-density-view]";
  const boxAbove = (el) => {
    for (let p = el.parentElement; p && p !== document.body && !p.matches(VIEW); p = p.parentElement) if (isBox(p)) return p;
    return null;
  };
  const inOtherView = (box, el) => {
    const v = el.closest(VIEW);
    return !!v && v !== box && box.contains(v);
  };
  // Charts, code and drawings set their own spacing and colours.
  // data-density-skip="<reason>" marks a specimen that breaks a budget on purpose (the type scale, all tones).
  const SKIP = "svg, canvas, pre, code, [data-chart], [role=img], [aria-hidden=true], .recharts-wrapper, [data-density-skip]";
  const skipped = (el) => !!el.closest(SKIP);

  const where = (el) => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
      let p = e.tagName.toLowerCase();
      if (e.id) {
        parts.unshift(`${p}#${e.id}`);
        break;
      }
      const ex = e.getAttribute("data-example");
      if (ex) {
        parts.unshift(`[data-example="${ex}"]`);
        break;
      }
      const same = e.parentElement ? [...e.parentElement.children].filter((c) => c.tagName === e.tagName) : [];
      if (same.length > 1) p += `:nth-of-type(${same.indexOf(e) + 1})`;
      parts.unshift(p);
    }
    return parts.join(" > ");
  };
  const textOf = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const out = [];
  const seen = new Set();
  const count = {};
  const hit = (rule, el, value) => {
    const cls = typeof el.className === "string" ? el.className.trim().replace(/\s+/g, " ").slice(0, 120) : "";
    const key = `${rule}|${cls}|${value}`;
    if (seen.has(key) || (count[rule] || 0) >= limit) return;
    seen.add(key);
    count[rule] = (count[rule] || 0) + 1;
    out.push({ rule, where: where(el), cls, text: textOf(el), value });
  };

  // Something cut off by overflow-hidden or line-clamp is not drawn (the third line of a two-line clamp). Content
  // a scroller moves out of view is still measured: the whole page counts, not only the first screen.
  const scrolls = (el) => /(auto|scroll)/.test(css(el).overflowX + css(el).overflowY);
  const clips = (el) => {
    const s = css(el);
    return !scrolls(el) && (s.overflowX !== "visible" || s.overflowY !== "visible");
  };
  const cut = (el, r) => {
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      if (!clips(a)) continue;
      const c = a.getBoundingClientRect();
      if (r.left < c.left - 0.5 || r.right > c.right + 0.5 || r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5) return true;
    }
    return false;
  };

  // Text runs with their line boxes, and the box each belongs to.
  const runs = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.data.trim() || !n.parentElement || skipped(n.parentElement) || !visible(n.parentElement)) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1 && !cut(n.parentElement, r)) runs.push({ el: n.parentElement, r });
  }

  const all = [root, ...root.querySelectorAll("*")].filter((el) => !skipped(el));
  const boxList = all.filter(isBox);

  // tight-box: the text closest to each side of its box (text inside a nested box counts for that box only).
  const insets = new Map();
  for (const { el, r } of runs) {
    const box = isBox(el) ? el : boxAbove(el);
    if (!box) continue;
    const b = box.getBoundingClientRect();
    const s = css(box);
    // Text that runs past its box is scrolled or clipped (a wide table, a cropped preview): not an inset.
    if (r.left < b.left - 0.5 || r.right > b.right + 0.5 || r.top < b.top - 0.5 || r.bottom > b.bottom + 0.5) continue;
    // Inside a scroller that overflows (a wide table on a phone) text sits wherever the scroll puts it.
    let sx = false;
    let sy = false;
    for (let a = el; a && a !== box; a = a.parentElement) {
      const as = css(a);
      if (/(auto|scroll)/.test(as.overflowX) && a.scrollWidth > a.clientWidth + 1) sx = true;
      if (/(auto|scroll)/.test(as.overflowY) && a.scrollHeight > a.clientHeight + 1) sy = true;
    }
    const inner = {
      l: sx ? 1e9 : r.left - b.left - parseFloat(s.borderLeftWidth),
      r: sx ? 1e9 : b.right - parseFloat(s.borderRightWidth) - r.right,
      t: sy ? 1e9 : r.top - b.top - parseFloat(s.borderTopWidth),
      b: sy ? 1e9 : b.bottom - parseFloat(s.borderBottomWidth) - r.bottom,
    };
    const m = insets.get(box) || { l: 1e9, r: 1e9, t: 1e9, b: 1e9 };
    for (const k of ["l", "r", "t", "b"]) m[k] = Math.min(m[k], inner[k]);
    insets.set(box, m);
  }
  for (const [box, m] of insets) {
    const s = css(box);
    const scroller = /(auto|scroll)/.test(s.overflowY) && box.scrollHeight > box.clientHeight + 1;
    const x = Math.min(m.l, m.r);
    const y = scroller ? 1e9 : Math.min(m.t, m.b);
    // Centred text (a tile or a button-like box) only sets one side; 0.5px for subpixel rounding.
    if (x < 3 * u - 0.5 || y < 2 * u - 0.5) hit("tight-box", box, `${Math.round(Math.min(x, 999))}px × ${Math.round(Math.min(y, 999))}px from the edge`);
  }

  // tight-row: three or more siblings stacked like rows (same tag and classes), clickable or split by lines.
  const CLICK = "a[href], button, [role=option], [role=menuitem], [role=row], [role=link], [role=button], [role=tab], [onclick]";
  // Trees (FileTree) are dense on purpose, like a code editor's, and move by arrow keys.
  for (const parent of new Set(all.map((el) => el.parentElement).filter((p) => p && !p.closest("[role=tree]")))) {
    const groups = new Map();
    for (const c of parent.children) {
      if (!visible(c) || skipped(c)) continue;
      const k = `${c.tagName}|${typeof c.className === "string" ? c.className : ""}`;
      groups.set(k, [...(groups.get(k) || []), c]);
    }
    for (const rows of groups.values()) {
      if (rows.length < 3) continue;
      const rects = rows.map((r) => r.getBoundingClientRect());
      const stacked = rects.every((r, i) => r.width >= 160 && (i === 0 || (r.top >= rects[i - 1].bottom - 1 && Math.abs(r.left - rects[0].left) < 2)));
      if (!stacked) continue;
      for (const [i, row] of rows.entries()) {
        const s = css(row);
        const clickable = row.matches(CLICK) || s.cursor === "pointer";
        const lined = lineOn(s, "Top") || lineOn(s, "Bottom");
        if (!clickable && !lined) continue;
        const h = rects[i].height;
        let top = 1e9;
        let bottom = 1e9;
        for (const { el, r } of runs) {
          if (!row.contains(el)) continue;
          top = Math.min(top, r.top - rects[i].top);
          bottom = Math.min(bottom, rects[i].bottom - r.bottom);
        }
        if (clickable && h < control - 2.5) hit("tight-row", row, `${Math.round(h)}px tall (control ${Math.round(control)}px)`);
        else if (top < 1.5 * u - 0.5 || bottom < 1.5 * u - 0.5) hit("tight-row", row, `text ${Math.round(Math.max(0, Math.min(top, bottom)))}px from the row edge`);
      }
    }
  }

  // box-nesting: the fourth frame inside frames.
  for (const box of boxList) {
    let depth = 1;
    for (let p = boxAbove(box); p; p = boxAbove(p)) depth++;
    if (depth >= 4 && !boxList.some((b) => b !== box && box.contains(b))) hit("box-nesting", box, `${depth} frames deep`);
  }

  // type-mix and colour-noise: per box that is not the whole page (no box inside it is counted twice: the
  // innermost box owns its text).
  const tall = innerHeight * 0.9;
  for (const box of boxList) {
    if (box.getBoundingClientRect().height > tall) continue;
    const sizes = new Set();
    const hues = new Set();
    const mark = (c) => {
      if (c[3] > 0.3 && chroma(c) > 48) hues.add(Math.round(hue(c) / 30) % 12);
    };
    for (const { el } of runs) {
      if (!box.contains(el) || inOtherView(box, el)) continue;
      const s = css(el);
      sizes.add(Math.round(parseFloat(s.fontSize)));
      mark(rgba(s.color));
    }
    for (const el of box.querySelectorAll("*")) {
      if (skipped(el) || !visible(el) || inOtherView(box, el)) continue;
      const s = css(el);
      if (el.tagName.toLowerCase() === "svg") mark(rgba(s.color));
      else if (!isBox(el)) mark(rgba(s.backgroundColor));
    }
    if (sizes.size > 4) hit("type-mix", box, `${sizes.size} text sizes (${[...sizes].sort((a, b) => a - b).join(", ")}px)`);
    if (hues.size > 3) hit("colour-noise", box, `${hues.size} colours`);
  }

  // primary-actions: filled accent buttons per view (dialog, form, example, page).
  if (accent[3] > 0.5 && chroma(accent) > 24) {
    const views = new Map();
    for (const el of root.querySelectorAll("button, a[href], [role=button]")) {
      // A selected day, an "on" switch or the current tab is a state, not an action.
      if (!visible(el) || skipped(el) || el.closest("[role=switch], [role=checkbox], [role=radio], [role=tab], [role=gridcell], [aria-pressed=true], [aria-selected=true], [aria-checked=true], [aria-current]")) continue;
      const bg = rgba(css(el).backgroundColor);
      if (bg[3] < 0.9 || !near(bg, accent, 12)) continue;
      const view = el.closest("[role=dialog], [role=alertdialog], form, [data-density-view], main") || root;
      views.set(view, [...(views.get(view) || []), el]);
    }
    for (const [view, btns] of views) if (btns.length > 1) hit("primary-actions", view, `${btns.length} filled accent buttons: ${btns.map(textOf).filter(Boolean).slice(0, 3).join(" · ")}`);
  }

  // cramped-boxes: neighbouring boxes closer than 8px, but not touching (a shared edge is on purpose).
  for (const box of boxList) {
    const parent = box.parentElement;
    if (!parent) continue;
    const b = box.getBoundingClientRect();
    for (const sib of parent.children) {
      if (sib === box || !isBox(sib) || !(box.compareDocumentPosition(sib) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      const c = sib.getBoundingClientRect();
      const overlapY = Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top) > 0;
      const overlapX = Math.min(b.right, c.right) - Math.max(b.left, c.left) > 0;
      const gap = overlapY ? Math.max(c.left - b.right, b.left - c.right) : overlapX ? Math.max(c.top - b.bottom, b.top - c.bottom) : -1;
      if (gap > 0.5 && gap < 2 * u - 0.5) hit("cramped-boxes", sib, `${Math.round(gap)}px between boxes`);
    }
  }

  // double-line: a divider (a line on top or bottom only, like divide-y or border-b) within 3px of another line
  // (a divider or a box edge) over the same stretch. Outlines of chips, buttons and tabs are shapes, not lines.
  const segs = [];
  for (const el of all) {
    if (!visible(el) || CONTROL.test(el.tagName.toUpperCase()) || CONTROL_ROLE.test(el.getAttribute("role") || "")) continue;
    const s = css(el);
    const r = el.getBoundingClientRect();
    const divider = !lineOn(s, "Left") && !lineOn(s, "Right") && r.width >= 120;
    if ((!divider && !isBox(el)) || cut(el.parentElement || el, r)) continue;
    if (lineOn(s, "Top")) segs.push({ el, divider, y: r.top, l: r.left, r: r.right });
    if (lineOn(s, "Bottom")) segs.push({ el, divider, y: r.bottom, l: r.left, r: r.right });
  }
  segs.sort((a, b) => a.y - b.y);
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length && segs[j].y - segs[i].y <= 3; j++) {
      const a = segs[i];
      const b = segs[j];
      // The edge of a scroller is a window onto its content, not a line next to it.
      if (a.el === b.el || (!a.divider && !b.divider) || (scrolls(a.el) && a.el.contains(b.el)) || (scrolls(b.el) && b.el.contains(a.el))) continue;
      const shared = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      if (shared >= 0.5 * Math.min(a.r - a.l, b.r - b.l)) hit("double-line", b.el.contains(a.el) ? a.el : b.el, `two lines ${Math.round(b.y - a.y)}px apart`);
    }
  }

  return out;
}

// ─── Node: run it on URLs (semi density, /semi-check) ─────────────────────────────────────────────────────────────

const HELP = `semi density <url…> [--scope <css>] [--width <px>[,<px>]] [--theme dark|light] [--json]
semi density --snippet [--scope <css>]

Measures the density budgets (DESIGN_SYSTEM.md §4c) on rendered pages: a dev server's URLs, at 1280px and 375px by
default, inside <main> (--scope body for a page without one). Exit 1 when a budget is broken.
Uses Playwright from the app (or @playwright/test) and the installed Chrome. Without Playwright, --snippet prints one
JavaScript expression: evaluate it on the page with a browser tool (it returns the hits as JSON).`;

/** Playwright's chromium, from the app first, then next to this file; null when neither has it. */
export async function chromium() {
  const { createRequire } = await import("node:module");
  const { join } = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  for (const base of [join(process.cwd(), "package.json"), import.meta.url])
    for (const name of ["playwright", "@playwright/test", "playwright-core"]) {
      try {
        const mod = await import(pathToFileURL(createRequire(base).resolve(name)).href);
        return (mod.chromium ?? mod.default?.chromium) || null;
      } catch {}
    }
  return null;
}

/** The expression a browser tool evaluates on the page. */
export const densitySnippet = (opts = { scope: "main" }) => `(${densityAudit.toString()})(${JSON.stringify(opts)})`;

/** Hits per URL and width, as markdown for an agent (or JSON). */
export async function runDensity(argv = process.argv.slice(2)) {
  const opt = (n) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : argv.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");
  };
  const valued = new Set(["--scope", "--width", "--theme"]);
  const urls = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]));
  const scope = opt("scope") || "main";
  if (argv.includes("--snippet")) return console.log(densitySnippet({ scope })), 0;
  if (!urls.length || argv.includes("--help")) return console.log(HELP), urls.length ? 0 : 2;
  const pw = await chromium();
  if (!pw) {
    console.error(`Playwright is not installed here. Open each page in a browser tool and evaluate the output of:\n  semi density --snippet${scope === "main" ? "" : ` --scope "${scope}"`}`);
    return 2;
  }
  const widths = (opt("width") || "1280,375").split(",").map(Number);
  const theme = opt("theme");
  const browser = await pw.launch({ channel: "chrome" }).catch(() => pw.launch());
  const results = [];
  try {
    for (const url of urls)
      for (const width of widths) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
        if (theme) await page.addInitScript((t) => localStorage.setItem("semi-theme", t), theme);
        await page.goto(url, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
        const hits = await page.evaluate(densityAudit, { scope: (await page.$(scope)) ? scope : "body" });
        results.push({ url, width, hits });
        await page.close();
      }
  } finally {
    await browser.close();
  }
  const total = results.reduce((n, r) => n + r.hits.length, 0);
  if (argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else {
    const used = new Set();
    for (const { url, width, hits } of results) {
      console.log(`## ${url} · ${width}px: ${hits.length ? `${hits.length} hit${hits.length > 1 ? "s" : ""}` : "ok"}`);
      for (const h of hits) {
        used.add(h.rule);
        console.log(`- \`${h.rule}\` ${h.value}${h.text ? ` — "${h.text}"` : ""}${h.cls ? `\n  class: ${h.cls}` : ""}\n  at: ${h.where}`);
      }
    }
    if (used.size) {
      console.log(`\nBudgets (DESIGN_SYSTEM.md §4c):`);
      for (const [id, text] of DENSITY_RULES) if (used.has(id)) console.log(`- \`${id}\`: ${text}`);
      console.log(`\nFind the element by its class or text in the source. A frame that stands for a whole screen (a preview) takes data-density-view; a specimen that breaks a budget on purpose takes data-density-skip="<reason>".`);
    }
  }
  return total ? 1 : 0;
}

if (typeof process !== "undefined" && process.argv[1] && /density\.mjs$/.test(process.argv[1])) process.exitCode = await runDensity();
