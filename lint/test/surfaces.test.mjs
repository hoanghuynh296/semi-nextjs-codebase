// node --test lint/test — the surface ladder of every style x theme (#88): the content panel must read as a card on the app.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hexToOklch } from "../../brand/color.mjs";
import { generateBrand } from "../../brand/generate.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const tokens = read("tokens/tokens.json");
const styles = read("tokens/styles.json");
const kits = { semi: read("lint/test/fixtures/brand-semi.json"), "3dnoobs": read("lint/test/fixtures/brand-3dnoobs.json") };

const MIN_STEP = 0.01; // OKLCH L
const KEYS = ["color-canvas", "color-app", "color-panel", "color-field", "color-raised"];
const L = (hex) => hexToOklch(hex).l;
const ids = styles.styles.map((s) => s.id);
const coreSurfaces = (st, theme) => Object.fromEntries(KEYS.map((k) => [k, (st.semantic?.[k] ?? tokens.semantic[k])[theme]]));
const kitNeutrals = (b) => generateBrand({ ...b, styles: { default: "flat", allowed: ids } }, { tokens, styles }).tokens.neutrals;

/**
 * Dark climbs canvas < app < panel < field < raised. Light: canvas < app < panel, and the field / raised fills sit
 * below the panel (field may equal canvas: it is the same tone by design).
 */
function checkLadder(label, theme, s) {
  const step = (lo, hi, what) => {
    const d = L(s[hi]) - L(s[lo]);
    assert.ok(d >= MIN_STEP, `${label} ${theme}: ${what} needs an OKLCH L step >= ${MIN_STEP} (${lo} ${s[lo]} -> ${hi} ${s[hi]}: ${d.toFixed(4)})`);
  };
  step("color-canvas", "color-app", "canvas < app");
  step("color-app", "color-panel", "app < panel");
  if (theme === "light") {
    step("color-field", "color-app", "field < app");
    step("color-canvas", "color-app", "canvas < app");
  }
  if (theme === "dark") {
    step("color-panel", "color-field", "panel < field");
    step("color-field", "color-raised", "field < raised");
  } else {
    step("color-field", "color-panel", "field < panel");
    step("color-raised", "color-field", "raised < field");
  }
}

test("core tokens: every style x theme has strictly ordered, distinct surfaces", () => {
  for (const st of styles.styles) for (const theme of ["light", "dark"]) checkLadder(`core ${st.id}`, theme, coreSurfaces(st, theme));
});

test("built kits: every allowed style x theme has strictly ordered, distinct surfaces", () => {
  for (const [id, b] of Object.entries(kits)) {
    for (const [sid, themes] of Object.entries(kitNeutrals(b))) {
      for (const theme of ["light", "dark"]) checkLadder(`kit ${id} ${sid}`, theme, themes[theme]);
    }
  }
});

test("Flat light steps (canvas to app, app to panel) are at least Sharp's, in core and in kits", () => {
  const gaps = (n) => ({ low: L(n["color-app"]) - L(n["color-canvas"]), high: L(n["color-panel"]) - L(n["color-app"]) });
  const check = (label, flat, sharp) => {
    const f = gaps(flat), r = gaps(sharp);
    for (const k of ["low", "high"]) assert.ok(f[k] >= r[k] - 1e-6, `${label} flat ${k} ${f[k].toFixed(4)} vs sharp ${r[k].toFixed(4)}`);
  };
  const core = (id) => coreSurfaces(styles.styles.find((s) => s.id === id), "light");
  check("core", core("flat"), core("sharp"));
  for (const [id, b] of Object.entries(kits)) {
    const n = kitNeutrals(b);
    check(`kit ${id}`, n.flat.light, n.sharp.light);
  }
});

// ── C-030 surfaces (#93): panel scale, borderless cards, tint, inverted ─────────────────────────────────────────────
import { contrast, blend, oklchToHex } from "../../brand/color.mjs";
import { derivedSurfaces, mixOklab } from "../../brand/generate.mjs";

const TEXT_KEYS = ["color-text-contrast", "color-text-body", "color-text-muted"];
const neutralsOf = (st, theme) => Object.fromEntries([...KEYS, ...TEXT_KEYS].map((k) => [k, (st.semantic?.[k] ?? tokens.semantic[k])[theme]]));
const palette = (name) => {
  for (const g of Object.values(tokens)) if (g && typeof g === "object" && g[name]) return typeof g[name] === "string" ? g[name] : g[name].value;
};
/** A palette value as hex: v3 hex as is; violet is pinned to Tailwind 4's own OKLCH (no visual change), mapped into sRGB. */
const toHex = (v) => {
  const m = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/.exec(String(v ?? ""));
  return m ? oklchToHex({ l: +m[1] / 100, c: +m[2], h: +m[3] }) : v;
};
const hexOf = (v) => toHex(/^var\(--([\w-]+)\)$/.exec(v) ? palette(/^var\(--([\w-]+)\)$/.exec(v)[1]) : v);
const kitSets = () => {
  const out = {};
  for (const [id, b] of Object.entries(kits))
    for (const neutral of [undefined, "pure"]) {
      const n = generateBrand({ ...b, neutral, styles: { default: "flat", allowed: ids } }, { tokens, styles }).tokens.neutrals;
      for (const [sid, t] of Object.entries(n)) for (const theme of ["light", "dark"]) out[`kit ${id}${neutral ? "/pure" : ""} ${sid} ${theme}`] = [theme, t[theme]];
    }
  return out;
};
const allSets = () => ({
  ...Object.fromEntries(styles.styles.flatMap((st) => ["light", "dark"].map((th) => [`core ${st.id} ${th}`, [th, neutralsOf(st, th)]]))),
  ...kitSets(),
});

test("the derived surfaces in the report mix what tokens.json mixes (same percentages)", () => {
  const sem = tokens.semantic;
  assert.match(sem["color-card"].light, /var\(--semi-app\) 95%, var\(--semi-text-contrast\)/);
  assert.match(sem["color-card"].dark, /var\(--semi-panel\) 95%, var\(--semi-text-contrast\)/);
  assert.match(sem["color-card-field"].light, /var\(--semi-card\) 97%, var\(--semi-text-contrast\)/);
  assert.match(sem["color-card-field"].dark, /var\(--semi-card\) 95%, var\(--semi-text-contrast\)/);
  assert.match(sem["color-inverted"].dark, /var\(--semi-text-contrast\) 96%, var\(--semi-canvas\)/);
  assert.match(sem["color-inverted-hover"].light, /var\(--semi-text-contrast\) 85%, var\(--semi-panel\)/);
  for (const k of ["color-panel-0", "color-panel-2", "color-panel-4"]) assert.match(sem[k].light, /^var\(--semi-(canvas|app|panel)\)$/, k);
  assert.equal(mixOklab("#000000", "#ffffff", 0), "#000000");
});

test("text reads AA on every panel step, the card and the field in a card; the card stands out from the app", () => {
  for (const [label, [theme, n]] of Object.entries(allSets())) {
    const s = derivedSurfaces(n, theme);
    const steps = {
      "panel-0": n["color-canvas"],
      "panel-1": mixOklab(n["color-canvas"], n["color-app"], 0.5),
      "panel-2": n["color-app"],
      "panel-3": mixOklab(n["color-app"], n["color-panel"], 0.5),
      "panel-4": n["color-panel"],
      card: s.card,
      "card-field": s.cardField,
    };
    for (const [step, bg] of Object.entries(steps)) {
      const r = contrast(n["color-text-muted"], bg);
      assert.ok(r >= 4.5, `${label}: text-muted on ${step} ${bg} ${r.toFixed(2)}`);
    }
    // order of the scale: canvas <= panel-1 <= app <= panel-3 <= panel (OKLCH L)
    const ls = ["panel-0", "panel-1", "panel-2", "panel-3", "panel-4"].map((k) => L(steps[k]));
    for (let i = 1; i < ls.length; i++) assert.ok(ls[i] >= ls[i - 1], `${label}: panel scale ascends at step ${i}`);
    const sep = contrast(s.card, n["color-app"]);
    assert.ok(sep >= 1.1, `${label}: card vs app ${sep.toFixed(3)} (#10: a borderless card must still read as one)`);
    if (theme === "light") assert.ok(L(s.card) < L(n["color-app"]), `${label}: the light card is recessed below the app`);
    else assert.ok(L(s.card) > L(n["color-panel"]), `${label}: the dark card sits above the panel`);
    assert.ok(contrast(s.onInverted, s.inverted) >= 4.5, `${label}: on-inverted / inverted`);
    assert.ok(contrast(s.onInverted, s.invertedHover) >= 4.5, `${label}: on-inverted / inverted-hover`);
    // a secondary button (tint) on the card: body text still reads
    const tintA = +/(\d+)%/.exec(tokens.semantic["color-tint-hover"][theme])[1] / 100;
    assert.ok(contrast(n["color-text-body"], blend(n["color-text-contrast"], s.cardField, tintA)) >= 4.5, `${label}: body on tint-hover over card-field`);
  }
});

test("status and tone text (badges: the 500 tint at 10%) read AA on the card in both themes (#50 amber)", () => {
  for (const [label, [theme, n]] of Object.entries(allSets())) {
    const { card } = derivedSurfaces(n, theme);
    for (const [k, v] of Object.entries(tokens.semantic)) {
      const m = /^color-(?:tone-(\w+)|(danger|success|warning|info)-fg)$/.exec(k);
      if (!m) continue;
      const family = m[1] ?? { danger: "rose", success: "emerald", warning: "amber", info: "sky" }[m[2]];
      const fg = hexOf(v[theme]);
      assert.ok(fg?.startsWith("#") && palette(`color-${family}-500`), `${k}: its palette is pinned in tokens.json`);
      const badge = blend(toHex(palette(`color-${family}-500`)), card, 0.1);
      const r = contrast(fg, badge);
      assert.ok(r >= 4.5, `${label}: ${k} ${fg} on a ${family} badge over the card ${r.toFixed(2)}`);
    }
  }
});

test("tokens.css has no plain .bg-* fallbacks that beat responsive variants (SHELL_OUTER md:bg-canvas)", () => {
  const css = readFileSync(new URL("../../tokens/tokens.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /^\s*\.bg-(app|canvas|panel)\s*\{/m);
  assert.match(css, /@utility bg-card \{/);
  const theme = [...css.matchAll(/@theme(?: inline)? \{([^}]*)\}/g)].map((m) => m[1]).join("\n");
  assert.doesNotMatch(theme, /--color-card(-field)?:/, "no --color-card theme variable (it would also make a border-card colour utility)");
});

test("accent text reads AA on the card and on the selected tint over it (Pagination current page, active row in a card)", () => {
  const alpha = (theme) => +/(\d+)%/.exec(tokens.semantic["color-accent-subtle"][theme])[1] / 100;
  const check = (label, theme, fg, card) => {
    for (const [what, bg] of [["card", card], ["accent-subtle over card", blend(fg, card, alpha(theme))]]) {
      const r = contrast(fg, bg);
      assert.ok(r >= 4.5, `${label} ${theme}: accent-fg ${fg} on ${what} ${r.toFixed(2)}`);
    }
  };
  for (const st of styles.styles)
    for (const theme of ["light", "dark"]) check(`core ${st.id}`, theme, hexOf(tokens.semantic["color-accent-fg"][theme]), derivedSurfaces(neutralsOf(st, theme), theme).card);
  for (const [id, b] of Object.entries(kits)) {
    const r = generateBrand({ ...b, styles: { default: "flat", allowed: ids } }, { tokens, styles }).tokens;
    for (const [sid, t] of Object.entries(r.neutrals))
      for (const theme of ["light", "dark"]) check(`kit ${id} ${sid}`, theme, r.themes[theme]["color-accent-fg"], derivedSurfaces(t[theme], theme).card);
  }
});

// WCAG 1.4.11 asks the field's boundary to stand out from what is around it (the surface), as lint/a11y.mjs measures it;
// the line against the field's own fill is not a boundary (2.7-3:1 there is fine).
test("a field drawn on a tint fill (SearchPill, #99): control-line reads 3:1 against the surface around it, in both themes", () => {
  const pct = (key, theme) => +/(\d+)%/.exec(tokens.semantic[key][theme])[1] / 100;
  for (const [label, [theme, n]] of Object.entries(allSets())) {
    const s = derivedSurfaces(n, theme);
    for (const [where, under] of Object.entries({ app: n["color-app"], panel: n["color-panel"], card: s.card })) {
      for (const tintKey of ["color-tint", "color-tint-hover"]) {
        const fill = blend(n["color-text-contrast"], under, pct(tintKey, theme));
        // the border paints over the element's own fill (background-clip: border-box)
        const edge = blend(n["color-text-muted"], fill, pct("color-control-line", theme));
        const out = contrast(edge, under);
        assert.ok(out >= 3, `${label}: control-line on ${tintKey} over ${where} vs the surface ${out.toFixed(2)}`);
      }
    }
  }
});
