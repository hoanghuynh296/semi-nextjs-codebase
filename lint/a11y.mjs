// Accessibility measured on the rendered page (DESIGN_SYSTEM.md §18). Semi's own components pass test:ui, but a
// screen made of them can still fail: muted text on a tinted card, an icon button without a name, a field whose edge
// disappears, a custom control with no focus ring. a11yAudit() runs in the page (Playwright page.evaluate, or pasted
// into a browser tool): it only uses browser globals, no imports and no closures, so its source can be sent as a string.
//
//   import { a11yAudit, A11Y_RULES } from "./a11y.mjs";
//   const hits = await page.evaluate(a11yAudit, { scope: "body" });
//
// `semi a11y <url>` runs it in both themes at desktop and phone width, plus axe-core when the app has it installed.

import { chromium } from "./density.mjs";

/** [id, rule]: the texts printed next to a hit. Keep them in step with DESIGN_SYSTEM.md §18. */
export const A11Y_RULES = [
  ["contrast", "Text reaches 4.5:1 against what is under it (3:1 from 24px, or bold from 18.66px), in both themes: text-muted / text-*-fg on their own surfaces, text-on-accent on bg-accent (WCAG 1.4.3)."],
  ["edge", "A field you type in or pick from shows its edge at 3:1 against the surface around it: border-control-line, as Semi's fields draw it (WCAG 1.4.11)."],
  ["name", "Every control has a name a screen reader can say: a visible text, a Field label, or aria-label on an icon-only control. A placeholder is not a label (WCAG 4.1.2, 1.3.1)."],
  ["focus-ring", "Every control shows where focus is when reached with Tab: FOCUS_RING, or a Semi component that draws it (WCAG 2.4.7)."],
  ["target-size", "Every control you click or tap is at least 24×24px, or keeps 24px from the next one (WCAG 2.5.8); Semi controls are h-control."],
  ["img-alt", "An image has alt (alt=\"\" when it only decorates); an element with role=img has aria-label (WCAG 1.1.1)."],
  ["lang", "<html lang> names the page's language, so a screen reader reads it with the right voice (WCAG 3.1.1)."],
  ["field-size", "A field you type in has text of 16px or more below 640px: iOS Safari zooms the page into a smaller one on focus and never zooms back (use FIELD_INPUT, or max-sm:text-title-lg)."],
  ["zoom-lock", "The viewport meta allows zoom: no user-scalable=no and no maximum-scale below 2 (WCAG 1.4.4)."],
];

/**
 * Check the page against the rules of A11Y_RULES. Runs in the browser.
 * @param {{ scope?: string, limit?: number, only?: string[] }} [opts] scope: CSS selector of the area to check (default
 *   body); limit: hits kept per rule (default 20); only: the rule ids to run (default all).
 * @returns {{ rule: string, where: string, cls: string, text: string, value: string }[]}
 */
export function a11yAudit(opts) {
  const o = opts || {};
  const root = (o.scope && document.querySelector(o.scope)) || document.body;
  const limit = o.limit || 20;
  const on = (id) => !o.only || o.only.includes(id);

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
  const blend = (t, b) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3])).concat(1);
  const lum = (c) => {
    const a = c.slice(0, 3).map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => p - q);
    return (y + 0.05) / (x + 0.05);
  };
  // The colour under an element: every translucent surface up to the first opaque one, blended over the page.
  const surfaces = new Map();
  const bgOf = (el) => {
    if (!el) return [255, 255, 255, 1];
    if (surfaces.has(el)) return surfaces.get(el);
    const own = rgba(getComputedStyle(el).backgroundColor);
    let out;
    if (own[3] >= 1) out = own;
    else {
      let under = el.parentElement ? bgOf(el.parentElement) : rgba(getComputedStyle(document.documentElement).backgroundColor);
      if (!el.parentElement && under[3] < 1) under = blend(under, [255, 255, 255, 1]);
      out = own[3] > 0 ? blend(own, under) : under;
    }
    surfaces.set(el, out);
    return out;
  };

  const shown = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && !el.closest("[inert]");
  };
  const tiny = (el) => {
    const r = el.getBoundingClientRect();
    return r.width <= 2 && r.height <= 2;
  };
  const hidden = (el) => !!el.closest("[aria-hidden=true], [inert], [hidden]") || getComputedStyle(el).display === "none";
  const SKIP = "[data-a11y-skip]";
  const disabled = (el) => !!el.closest("[disabled], [aria-disabled=true], fieldset:disabled");

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
  const textOf = (el) => (el.innerText || el.textContent || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const out = [];
  const seen = new Set();
  const count = {};
  const hit = (rule, el, value) => {
    const cls = el && typeof el.className === "string" ? el.className.trim().replace(/\s+/g, " ").slice(0, 120) : "";
    const text = el ? textOf(el) : "";
    const key = `${rule}|${cls}|${text}|${value}`;
    if (seen.has(key) || (count[rule] || 0) >= limit) return;
    seen.add(key);
    count[rule] = (count[rule] || 0) + 1;
    out.push({ rule, where: el ? where(el) : "document", cls, text, value });
  };
  const inScope = (sel) => [...root.querySelectorAll(sel)].filter((el) => !el.closest(SKIP));

  // ─── Page ───────────────────────────────────────────────────────────────────────────────────────────────────────
  if (on("lang") && !(document.documentElement.getAttribute("lang") || "").trim()) hit("lang", null, "<html> has no lang");
  if (on("zoom-lock")) {
    const vp = document.querySelector("meta[name=viewport]");
    const c = (vp && vp.getAttribute("content")) || "";
    const max = /maximum-scale\s*=\s*([\d.]+)/i.exec(c);
    if (/user-scalable\s*=\s*(no|0)\b/i.test(c) || (max && parseFloat(max[1]) < 2)) hit("zoom-lock", null, `viewport "${c}"`);
  }

  // ─── Text contrast (1.4.3) ──────────────────────────────────────────────────────────────────────────────────────
  if (on("contrast"))
    for (const el of inScope("*")) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      if (!shown(el) || el.closest(".sr-only") || disabled(el)) continue;
      const st = getComputedStyle(el);
      const bg = bgOf(el);
      const f0 = rgba(st.color);
      const fg = f0[3] < 1 ? blend(f0, bg) : f0;
      const k = ratio(fg, bg);
      const size = parseFloat(st.fontSize);
      const need = size >= 24 || (parseInt(st.fontWeight) >= 700 && size >= 18.66) ? 3 : 4.5;
      if (k < need) hit("contrast", el, `${k.toFixed(2)}:1, needs ${need}:1 (${st.color} on rgb(${bg.slice(0, 3).map(Math.round).join(", ")}))`);
    }

  // ─── Field edges (1.4.11) ───────────────────────────────────────────────────────────────────────────────────────
  const FIELD = "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]), textarea, select, [role=combobox]";
  const lineOf = (s, side, under) => {
    if (parseFloat(s[`border${side}Width`]) < 1 || s[`border${side}Style`] === "none") return 1;
    const c = rgba(s[`border${side}Color`]);
    return c[3] > 0 ? ratio(blend(c, under), under) : 1;
  };
  if (on("field-size") && window.innerWidth < 640)
    for (const el of inScope(FIELD)) {
      if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !shown(el) || disabled(el) || (el.readOnly && el.tagName !== "SELECT")) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 16) hit("field-size", el, `${size}px, needs 16px or more below 640px (iOS zooms the page on focus)`);
    }

  if (on("edge"))
    for (const el of inScope(FIELD)) {
      if (!shown(el) || tiny(el) || disabled(el) || hidden(el) || getComputedStyle(el).opacity === "0") continue;
      // A combobox whose list is open below it (a command palette) is told apart by that list.
      if (el.getAttribute("aria-expanded") === "true") continue;
      const r = el.getBoundingClientRect();
      // The frame that draws the field: the field itself, or a wrapper hugging it (an input group, a composer).
      let best = 1;
      let framed = false;
      for (let f = el, i = 0; f && i < 4; f = f.parentElement, i++) {
        const fr = f.getBoundingClientRect();
        const inset = Math.min(r.left - fr.left, fr.right - r.right, r.top - fr.top, fr.bottom - r.bottom);
        if (f !== el && (inset > 10 || fr.height > r.height + 64)) break;
        const s = getComputedStyle(f);
        const under = bgOf(f.parentElement);
        const fill = rgba(s.backgroundColor);
        const edge = Math.max(...["Top", "Right", "Bottom", "Left"].map((d) => lineOf(s, d, under)), fill[3] > 0 ? ratio(blend(fill, under), under) : 1);
        const drawn = edge > 1.05 || s.boxShadow !== "none";
        if (drawn) {
          framed = true;
          best = Math.max(best, edge);
          // A ring drawn with box-shadow (Tailwind ring-*) counts at its colour.
          const ring = /rgba?\([^)]+\)/.exec(s.boxShadow);
          if (ring && /\b0px 0px 0px [1-9]/.test(s.boxShadow)) best = Math.max(best, ratio(blend(rgba(ring[0]), under), under));
        }
        if (best >= 3) break;
      }
      if (best < 3) hit("edge", el, framed ? `edge ${best.toFixed(2)}:1 against the surface, needs 3:1` : "no visible edge");
    }

  // ─── Names (4.1.2) ──────────────────────────────────────────────────────────────────────────────────────────────
  const CONTROL = "button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=tab], [role=menuitem], [role=menuitemcheckbox], [role=menuitemradio], [role=option], [role=combobox], [role=slider], [role=spinbutton], [role=textbox], [role=searchbox], [role=treeitem]";
  const ENTRY = /^(INPUT|SELECT|TEXTAREA)$/;
  const BY_CONTENT = /^(button|link|checkbox|radio|switch|tab|menuitem|menuitemcheckbox|menuitemradio|option|treeitem)$/;
  const contentName = (el) => {
    let s = "";
    for (const n of el.childNodes) {
      if (n.nodeType === 3) s += n.textContent;
      else if (n.nodeType === 1) {
        if (n.getAttribute("aria-hidden") === "true" || getComputedStyle(n).display === "none") continue;
        if (n.getAttribute("aria-label")) s += ` ${n.getAttribute("aria-label")}`;
        else if (n.tagName === "IMG") s += ` ${n.getAttribute("alt") || ""}`;
        else if (n.tagName.toLowerCase() === "svg") s += ` ${(n.querySelector("title") || {}).textContent || ""}`;
        else s += ` ${contentName(n)}`;
      }
    }
    return s.trim();
  };
  const ids = (v) => (v || "").split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean);
  const nameOf = (el) => {
    const lb = ids(el.getAttribute("aria-labelledby")).map((e) => e.textContent).join(" ").trim();
    if (lb) return lb;
    if ((el.getAttribute("aria-label") || "").trim()) return el.getAttribute("aria-label").trim();
    const tag = el.tagName.toUpperCase();
    if (tag === "SVG") return ((el.querySelector(":scope > title") || {}).textContent || "").trim();
    if (ENTRY.test(tag)) {
      const type = (el.getAttribute("type") || "").toLowerCase();
      if (/^(submit|reset|button)$/.test(type)) return el.value || (type === "button" ? "" : type);
      if (type === "image") return el.getAttribute("alt") || "";
      const labels = [...(el.labels || [])].map((l) => contentName(l)).join(" ").trim();
      if (labels) return labels;
    }
    const role = el.getAttribute("role") || { BUTTON: "button", A: "link", SUMMARY: "button" }[tag] || "";
    if (BY_CONTENT.test(role) || /^(BUTTON|A|SUMMARY)$/.test(tag)) {
      const c = contentName(el);
      if (c) return c;
    }
    return (el.getAttribute("title") || "").trim();
  };
  if (on("name"))
    for (const el of inScope(CONTROL)) {
      if (hidden(el) || getComputedStyle(el).visibility === "hidden") continue;
      if (nameOf(el)) continue;
      const ph = (el.getAttribute("placeholder") || "").trim();
      const what = `<${el.tagName.toLowerCase()}${el.getAttribute("role") ? ` role=${el.getAttribute("role")}` : ""}${el.getAttribute("type") ? ` type=${el.getAttribute("type")}` : ""}>`;
      hit("name", el, ph ? `${what} named only by its placeholder "${ph.slice(0, 30)}"` : `${what} has no name`);
    }

  // ─── Images (1.1.1) ─────────────────────────────────────────────────────────────────────────────────────────────
  if (on("img-alt")) {
    for (const el of inScope("img")) if (!hidden(el) && !el.hasAttribute("alt") && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) hit("img-alt", el, "<img> without alt");
    for (const el of inScope("[role=img]")) if (!hidden(el) && !nameOf(el)) hit("img-alt", el, "role=img without aria-label");
  }

  // ─── Target size (2.5.8) ────────────────────────────────────────────────────────────────────────────────────────
  const TARGET = "button, a[href], select, summary, input[type=checkbox], input[type=radio], [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=tab], [role=menuitem], [role=option], [role=slider]";
  if (on("target-size")) {
    const targets = inScope(TARGET).filter((el) => shown(el) && !hidden(el) && !disabled(el) && getComputedStyle(el).opacity !== "0" && !el.parentElement.closest(TARGET));
    // The area that takes the click: the element, grown by an absolute ::before / ::after of it or of a wrapper that
    // hugs it (HIT_AREA, the touch area of Checkbox / Switch), translate included.
    const area = (el) => {
      const r = el.getBoundingClientRect();
      let [l, t, rt, b] = [r.left, r.top, r.right, r.bottom];
      const owners = [el];
      const p = el.parentElement;
      if (p) {
        const pr = p.getBoundingClientRect();
        if (Math.abs(pr.width - r.width) <= 2 && Math.abs(pr.height - r.height) <= 2) owners.push(p);
      }
      for (const e of owners) {
        const er = e.getBoundingClientRect();
        for (const ps of ["::before", "::after"]) {
          const s = getComputedStyle(e, ps);
          if (s.content === "none" || s.position !== "absolute" || s.pointerEvents === "none" || s.display === "none") continue;
          const m = /matrix\(([^)]+)\)/.exec(s.transform);
          const [tx, ty] = m ? m[1].split(",").slice(4).map(parseFloat) : [0, 0];
          const x = er.left + e.clientLeft + parseFloat(s.left) + tx;
          const y = er.top + e.clientTop + parseFloat(s.top) + ty;
          const w = parseFloat(s.width);
          const h = parseFloat(s.height);
          if ([x, y, w, h].some(isNaN)) continue;
          [l, t, rt, b] = [Math.min(l, x), Math.min(t, y), Math.max(rt, x + w), Math.max(b, y + h)];
        }
      }
      return { left: l, top: t, right: rt, bottom: b, width: rt - l, height: b - t };
    };
    const rects = targets.map(area);
    // Targets on different layers (a fixed tab bar, a sticky header, the content scrolling under them) only meet
    // at one scroll position, so spacing is compared within a layer.
    const layerOf = (el) => {
      for (let e = el; e; e = e.parentElement) if (/^(fixed|sticky)$/.test(getComputedStyle(e).position)) return e;
      return null;
    };
    const layers = targets.map(layerOf);
    targets.forEach((el, i) => {
      const r = rects[i];
      if (r.width >= 23.5 && r.height >= 23.5) return;
      // A link inside a sentence is exempt; so is a box whose label (or wrapper it fills) is big enough.
      const st = getComputedStyle(el);
      if (st.display === "inline" && [...el.parentElement.childNodes].some((n) => n !== el && n.nodeType === 3 && n.textContent.trim())) return;
      const label = el.closest("label") || (el.labels && el.labels[0]);
      if (label) {
        const lr = label.getBoundingClientRect();
        if (lr.width >= 23.5 && lr.height >= 23.5) return;
      }
      // Spacing exception: a 24px circle on its centre touches no other target, nor the circle of another small one.
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const crowded = rects.some((q, j) => {
        if (j === i || layers[j] !== layers[i]) return false;
        const dx = Math.max(q.left - cx, 0, cx - q.right);
        const dy = Math.max(q.top - cy, 0, cy - q.bottom);
        if (Math.hypot(dx, dy) < 12) return true;
        const small = q.width < 23.5 || q.height < 23.5;
        return small && Math.hypot(q.left + q.width / 2 - cx, q.top + q.height / 2 - cy) < 24;
      });
      if (crowded) hit("target-size", el, `${Math.round(r.width)}×${Math.round(r.height)}px, 24px from another target needed`);
    });
  }

  // ─── Focus visible (2.4.7) ──────────────────────────────────────────────────────────────────────────────────────
  if (on("focus-ring")) {
    const FOCUSABLE = "a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex='-1']), [contenteditable=true]";
    const PROPS = ["outlineStyle", "outlineWidth", "outlineColor", "boxShadow", "borderTopColor", "borderBottomColor", "borderLeftColor", "backgroundColor", "color", "textDecorationLine"];
    const freeze = document.createElement("style");
    freeze.textContent = "*,*::before,*::after{transition:none!important;animation:none!important}";
    document.head.appendChild(freeze);
    const before = document.activeElement;
    const snap = (els) => els.map((e) => PROPS.map((p) => getComputedStyle(e)[p]).join("|") + "|" + ["::before", "::after"].map((ps) => getComputedStyle(e, ps).boxShadow + getComputedStyle(e, ps).outlineStyle + getComputedStyle(e, ps).opacity).join("|"));
    let n = 0;
    for (const el of inScope(FOCUSABLE)) {
      if (n >= 300) break;
      if (!shown(el) || hidden(el) || disabled(el) || el.tabIndex < 0) continue;
      // What can show focus: the control, a few wrappers (a field frame with focus-within) and its siblings (a
      // hidden native input that lights its drawn box with peer-focus).
      const watch = [el];
      for (let p = el.parentElement, i = 0; p && i < 3; p = p.parentElement, i++) watch.push(p);
      if (el.previousElementSibling) watch.push(el.previousElementSibling);
      if (el.nextElementSibling) watch.push(el.nextElementSibling);
      // The baseline is the control without focus. A dialog's focus trap (DetailOverlay, Modal) has already put focus
      // on its first control, ring and all: compared with itself, that ring would count as "nothing changes".
      // A control that takes focus back when it loses it (an onblur that refocuses) has no unfocused baseline: it is
      // reported with its own text, never left out, so a missing ring cannot hide behind it.
      const held = document.activeElement;
      if (held && held !== document.body && held.blur) held.blur();
      const stuck = document.activeElement === el;
      const a = snap(watch);
      try {
        el.focus({ preventScroll: true, focusVisible: true });
      } catch {
        continue;
      }
      const got = document.activeElement;
      if (got !== el) {
        // Nothing took focus (an inert or unfocusable control), or a modal dialog's trap kept it inside (the page
        // behind an open DetailOverlay / Modal): not this control's ring to judge. Anything else that keeps focus
        // would hide every control after it, so the control is reported.
        const modal = got && got !== document.body && got.closest("[aria-modal=true]");
        if (got && got !== document.body && !(modal && !modal.contains(el))) hit("focus-ring", el, `focus could not be moved onto it (${where(got)} keeps it)`);
        continue;
      }
      if (!el.matches(":focus-visible")) continue;
      n++;
      const b = snap(watch);
      el.blur();
      if (a.every((v, i) => v === b[i])) hit("focus-ring", el, stuck ? "focus could not be moved off it to compare (it takes focus back on blur): check its ring with Tab by hand" : "nothing changes when it takes keyboard focus");
    }
    freeze.remove();
    if (before && before !== document.body && before.focus) before.focus({ preventScroll: true });
  }

  return out;
}

// ─── Node: run it on URLs (semi a11y, /semi-check) ────────────────────────────────────────────────────────────────

const HELP = `semi a11y <url…> [--scope <css>] [--width <px>[,<px>]] [--theme dark,light] [--json] [--no-axe]
semi a11y --snippet [--scope <css>]

Checks accessibility (DESIGN_SYSTEM.md §18) on rendered pages: a dev server's URLs, in dark and light, at 1280px and
375px by default: contrast, field edges, names, focus rings, target size, image alt, lang, zoom. When the app has
axe-core installed (npm i -D axe-core), its serious and critical WCAG 2.2 AA findings are added. Exit 1 on a hit.
Uses Playwright from the app (or @playwright/test) and the installed Chrome. Without Playwright, --snippet prints one
JavaScript expression: evaluate it on the page with a browser tool, in each theme (it returns the hits as JSON).`;

/** axe-core's source, from the app first, then next to this file; null when neither has it. */
async function axeSource() {
  const { createRequire } = await import("node:module");
  const { join } = await import("node:path");
  const { readFileSync } = await import("node:fs");
  for (const base of [join(process.cwd(), "package.json"), import.meta.url]) {
    try {
      return readFileSync(createRequire(base).resolve("axe-core/axe.min.js"), "utf8");
    } catch {}
  }
  return null;
}

/** The expression a browser tool evaluates on the page. */
export const a11ySnippet = (opts = { scope: "body" }) => `(${a11yAudit.toString()})(${JSON.stringify(opts)})`;

/** Hits per URL, theme and width, as markdown for an agent (or JSON). */
export async function runA11y(argv = process.argv.slice(2)) {
  const opt = (n) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : argv.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");
  };
  const valued = new Set(["--scope", "--width", "--theme"]);
  const urls = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]));
  const scope = opt("scope") || "body";
  if (argv.includes("--snippet")) return console.log(a11ySnippet({ scope })), 0;
  if (!urls.length || argv.includes("--help")) return console.log(HELP), urls.length ? 0 : 2;
  const pw = await chromium();
  if (!pw) {
    console.error(`Playwright is not installed here. Open each page in a browser tool, in each theme, and evaluate the output of:\n  semi a11y --snippet${scope === "body" ? "" : ` --scope "${scope}"`}`);
    return 2;
  }
  const axe = argv.includes("--no-axe") ? null : await axeSource();
  const widths = (opt("width") || "1280,375").split(",").map(Number);
  const themes = (opt("theme") || "dark,light").split(",");
  const browser = await pw.launch({ channel: "chrome" }).catch(() => pw.launch());
  const results = [];
  try {
    for (const url of urls)
      for (const theme of themes)
        for (const width of widths) {
          const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500, colorScheme: theme === "light" ? "light" : "dark" });
          await page.addInitScript((t) => localStorage.setItem("semi-theme", t), theme);
          await page.goto(url, { waitUntil: "networkidle" });
          await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
          const sel = (await page.$(scope)) ? scope : "body";
          const hits = await page.evaluate(a11yAudit, { scope: sel });
          if (axe) {
            await page.addScriptTag({ content: axe });
            // Contrast and target size are measured above, with translucent surfaces blended in.
            const v = await page.evaluate(
              (s) =>
                window.axe
                  .run(document.querySelector(s), {
                    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
                    rules: { "color-contrast": { enabled: false }, "target-size": { enabled: false } },
                  })
                  .then((r) => r.violations.filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => ({ id: x.id, help: x.help, nodes: x.nodes.slice(0, 5).map((n) => n.target.join(" ")) }))),
              sel,
            );
            for (const x of v) for (const n of x.nodes) hits.push({ rule: `axe/${x.id}`, where: n, cls: "", text: "", value: x.help });
          }
          results.push({ url, theme, width, hits });
          await page.close();
        }
  } finally {
    await browser.close();
  }
  const total = results.reduce((n, r) => n + r.hits.length, 0);
  if (argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else {
    const used = new Set();
    for (const { url, theme, width, hits } of results) {
      console.log(`## ${url} · ${theme} · ${width}px: ${hits.length ? `${hits.length} hit${hits.length > 1 ? "s" : ""}` : "ok"}`);
      for (const h of hits) {
        used.add(h.rule);
        console.log(`- \`${h.rule}\` ${h.value}${h.text ? ` — "${h.text}"` : ""}${h.cls ? `\n  class: ${h.cls}` : ""}\n  at: ${h.where}`);
      }
    }
    if (!axe && !argv.includes("--no-axe")) console.log(`\naxe-core is not installed: add it (npm i -D axe-core) for the full WCAG 2.2 AA rule set.`);
    if (used.size) {
      console.log(`\nRules (DESIGN_SYSTEM.md §18):`);
      for (const [id, text] of A11Y_RULES) if (used.has(id)) console.log(`- \`${id}\`: ${text}`);
      if ([...used].some((u) => u.startsWith("axe/"))) console.log(`- \`axe/*\`: see https://dequeuniversity.com/rules/axe/ for each id.`);
      console.log(`\nFind the element by its class or text in the source. A specimen that breaks a rule on purpose (a contrast sample) takes data-a11y-skip="<reason>".`);
    }
  }
  return total ? 1 : 0;
}

if (typeof process !== "undefined" && process.argv[1] && /a11y\.mjs$/.test(process.argv[1])) process.exitCode = await runA11y();
