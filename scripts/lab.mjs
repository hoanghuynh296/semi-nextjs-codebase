// Design Lab (docs/LAB.md): try core values of Semi on the docs site before an agent changes the design system.
// A Lab draft holds only what differs from the sources; the same draft is the patch scripts/lab-apply.mjs writes back:
//
//   {
//     "$semiLab": 1,
//     "type":      { "text-ui": "15px", "text-ui--line-height": "1.5" },           → tokens/tokens.json "type"
//     "density":   { "compact": { "spacing": "0.225rem", "sizes": { "text-ui": "13px" } } }, → "product.density"
//     "typeScale": { "contrast": { "sizes": { "text-section": "24px" } } },        → "product.typeScale"
//     "shape":     { "radius-card": "1rem" },                                       → tokens/tokens.json "shape"
//     "params":    { "hoverStep": 0.08 }                                            → brand/params.mjs (brand generator)
//   }
//
// No Node imports: the docs site runs labCss / diffDraft in the browser, scripts/lab-apply.mjs runs applyDraft.
import { SHAPE_SELECTORS, toRem, UTILITY_KEYS } from "./token-css.mjs";

export const LAB_VERSION = 1;
const PRODUCT = ["density", "typeScale"];
const GROUPS = ["type", "density", "typeScale", "shape", "params"];

/** A draft with nothing in it. */
export const emptyDraft = () => ({ $semiLab: LAB_VERSION, type: {}, density: {}, typeScale: {}, shape: {}, params: {} });

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const val = (raw) => (isObj(raw) ? raw.value : raw);
const clone = (v) => JSON.parse(JSON.stringify(v));

/** True when the draft changes nothing. */
export function isEmptyDraft(d) {
  if (!d) return true;
  const deep = (o) => !isObj(o) || Object.values(o).every((v) => (isObj(v) ? deep(v) : v === undefined));
  return GROUPS.every((k) => deep(d[k]));
}

/** Type tokens a Lab may change: every size and line height of tokens.json "type" that is not deprecated. */
export function typeKeys(tokens) {
  return Object.entries(tokens.type)
    .filter(([k, raw]) => !k.startsWith("$") && !(isObj(raw) && raw.deprecated))
    .map(([k]) => k);
}

/** The shape tokens of tokens.json (the one look): key → value. */
export const shapeValues = (tokens) => Object.fromEntries(Object.entries(tokens.shape).filter(([k]) => !k.startsWith("$")).map(([k, raw]) => [k, val(raw)]));

/**
 * Current value of every Lab field, from the sources: { type, density, typeScale, shape, params }.
 * `shape` is tokens.json "shape" (values flattened); `params` is brand/params.mjs PARAMS.
 */
export function sourceValues({ tokens, params }) {
  return {
    type: Object.fromEntries(typeKeys(tokens).map((k) => [k, val(tokens.type[k])])),
    density: Object.fromEntries(Object.entries(tokens.product.density).map(([id, d]) => [id, { spacing: d.spacing, sizes: { ...(d.sizes ?? {}) } }])),
    typeScale: Object.fromEntries(Object.entries(tokens.product.typeScale).map(([id, t]) => [id, { sizes: { ...(t.sizes ?? {}) } }])),
    shape: shapeValues(tokens),
    params: clone(params ?? {}),
  };
}

/** Draft values laid over the source values (what the page should look like). */
export function mergedValues(draft, sources) {
  const base = sourceValues(sources);
  const d = draft ?? emptyDraft();
  for (const [k, v] of Object.entries(d.type ?? {})) base.type[k] = v;
  for (const g of PRODUCT)
    for (const [id, e] of Object.entries(d[g] ?? {})) {
      base[g][id] ??= { sizes: {} };
      if (e.spacing !== undefined) base[g][id].spacing = e.spacing;
      Object.assign(base[g][id].sizes, e.sizes ?? {});
    }
  for (const [k, v] of Object.entries(d.shape ?? {})) if (k in base.shape) base.shape[k] = v;
  for (const [k, v] of Object.entries(d.params ?? {})) base.params[k] = isObj(v) ? { ...base.params[k], ...v } : v;
  return base;
}

/** Set one value in a draft (immutably); a value equal to the source's removes it from the draft. */
export function setDraftValue(draft, path, value, sources) {
  const d = clone(draft ?? emptyDraft());
  const src = sourceValues(sources);
  let from = src;
  for (const p of path) from = from?.[p];
  let node = d;
  for (const p of path.slice(0, -1)) node = node[p] ??= {};
  const last = path[path.length - 1];
  if (value === undefined || value === from || (typeof from === "number" && Number(value) === from)) delete node[last];
  else node[last] = value;
  return prune(d);
}

/** Remove empty groups (a density with nothing changed). */
function prune(d) {
  const walk = (o) => {
    for (const [k, v] of Object.entries(o)) if (isObj(v)) (walk(v), Object.keys(v).length === 0 && !GROUPS.includes(k) && delete o[k]);
    return o;
  };
  return walk(d);
}

/** Every change of a draft: [{ file, key, from, to }] (unchanged values dropped). */
export function diffDraft(draft, sources) {
  const src = sourceValues(sources);
  const rows = [];
  const push = (file, key, from, to) => {
    if (to === undefined || String(to) === String(from)) return;
    rows.push({ file, key, from: from ?? "—", to });
  };
  for (const [k, v] of Object.entries(draft?.type ?? {})) push("tokens/tokens.json", `type.${k}`, src.type[k], v);
  for (const g of PRODUCT)
    for (const [id, e] of Object.entries(draft?.[g] ?? {})) {
      if (e.spacing !== undefined) push("tokens/tokens.json", `product.${g}.${id}.spacing`, src[g][id]?.spacing, e.spacing);
      for (const [k, v] of Object.entries(e.sizes ?? {})) push("tokens/tokens.json", `product.${g}.${id}.sizes.${k}`, src[g][id]?.sizes?.[k], v);
    }
  for (const [k, v] of Object.entries(draft?.shape ?? {})) push("tokens/tokens.json", `shape.${k}`, src.shape[k], v);
  for (const [k, v] of Object.entries(draft?.params ?? {})) {
    if (isObj(v)) for (const [kk, vv] of Object.entries(v)) push("brand/params.mjs", `${k}.${kk}`, src.params[k]?.[kk], vv);
    else push("brand/params.mjs", k, src.params[k], v);
  }
  return rows;
}

/** Problems with a draft (unknown keys, wrong types): a patch with errors is never written. */
export function validateDraft(draft, sources) {
  const errors = [];
  const src = sourceValues(sources);
  if (!isObj(draft)) return ["patch không phải một object JSON"];
  if (draft.$semiLab !== LAB_VERSION) errors.push(`$semiLab: cần ${LAB_VERSION} (bản nháp từ Design Lab)`);
  for (const k of Object.keys(draft)) if (!["$semiLab", ...GROUPS].includes(k)) errors.push(`${k}: không phải nhóm của Lab`);
  for (const [k, v] of Object.entries(draft.type ?? {})) {
    if (!(k in src.type)) errors.push(`type.${k}: không có trong tokens.json`);
    else if (/--line-height$/.test(k) ? !/^\d+(\.\d+)?$/.test(String(v)) : !/^\d+(\.\d+)?px$/.test(String(v))) errors.push(`type.${k}: "${v}" phải là ${/--line-height$/.test(k) ? "số (1.5)" : "px (14px)"}`);
  }
  for (const g of PRODUCT)
    for (const [id, e] of Object.entries(draft[g] ?? {})) {
      if (!(id in src[g])) errors.push(`${g}.${id}: không có trong tokens.json product.${g}`);
      if (e.spacing !== undefined && (g !== "density" || !/^\d+(\.\d+)?rem$/.test(String(e.spacing)))) errors.push(`${g}.${id}.spacing: "${e.spacing}" phải là rem (0.25rem), chỉ density có`);
      for (const [k, v] of Object.entries(e.sizes ?? {}))
        if (!(k in src.type) || /--line-height$/.test(k) || !/^\d+(\.\d+)?px$/.test(String(v))) errors.push(`${g}.${id}.sizes.${k}: "${v}" phải là cỡ chữ px của một token type`);
    }
  for (const [k, v] of Object.entries(draft.shape ?? {})) {
    if (!(k in src.shape)) errors.push(`shape.${k}: tokens.json shape không có token này`);
    else if (typeof v !== "string" || !v.trim() || /[;{}]/.test(v)) errors.push(`shape.${k}: "${v}" không phải một giá trị CSS`);
  }
  for (const [k, v] of Object.entries(draft.params ?? {})) {
    if (!(k in src.params)) errors.push(`params.${k}: bộ sinh màu không có tham số này`);
    else if (isObj(src.params[k]) !== isObj(v)) errors.push(`params.${k}: sai kiểu`);
    else if (isObj(v)) {
      for (const [kk, vv] of Object.entries(v)) if (!(kk in src.params[k]) || typeof vv !== "number" || !Number.isFinite(vv)) errors.push(`params.${k}.${kk}: phải là số của một khoá có sẵn`);
    } else if (typeof v !== "number" || !Number.isFinite(v)) errors.push(`params.${k}: phải là số`);
  }
  return errors;
}

/** The fonts the docs site loads (variable → entry of tokens.json shape "$fonts"). */
export function knownFonts(tokens) {
  const out = {};
  for (const f of tokens.shape.$fonts ?? []) out[f.variable] ??= f;
  return out;
}

/** The value of font-sans / font-display for one of the known fonts (the brand kit's --font-*-family still wins). */
export function fontValue(role, font) {
  return role === "font-sans"
    ? `var(--font-sans-family, var(${font.variable})), "${font.family}", -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`
    : `var(--font-display-family, var(${font.variable})), "${font.family}", var(--semi-font-sans)`;
}

/** The font variable a font-sans / font-display value falls back to (var(--font-geist) in the default argument). */
export const fontOf = (value) => /-family,\s*var\((--font-[\w-]+)\)/.exec(String(value))?.[1] ?? null;

/**
 * Runtime CSS of a draft for a page that is already built (the docs site): the same variables and selectors as
 * tokens.css, in the same order, so a density's own values still win where they did. Empty draft → "".
 */
export function labCss(draft, sources) {
  if (isEmptyDraft(draft)) return "";
  const v = mergedValues(draft, sources);
  let css = "/* Design Lab draft (docs/LAB.md): not part of any release */\n";
  const typeChanged = Object.keys(draft.type ?? {});
  if (typeChanged.length) css += `:root {\n${typeChanged.map((k) => `  --${k}: ${toRem(k, v.type[k])};`).join("\n")}\n}\n`;
  if (Object.keys(draft.shape ?? {}).length) {
    const keys = Object.keys(v.shape);
    css += `${SHAPE_SELECTORS.join(",\n")} {\n`;
    css += keys.map((k) => `  --semi-${k}: ${v.shape[k]};`).join("\n") + "\n";
    css += keys.filter((k) => !UTILITY_KEYS[k]).map((k) => `  --${k}: var(--semi-${k});`).join("\n") + "\n}\n";
  }
  // Product scopes after :root and the shape, as in tokens.css: a density's own sizes keep winning over :root.
  for (const [id, d] of Object.entries(v.density))
    if (id !== "regular") css += `[data-density="${id}"] {\n  --density-spacing: ${d.spacing};\n  --semi-spacing: ${d.spacing};\n${Object.entries(d.sizes ?? {}).map(([k, x]) => `  --${k}: ${toRem(k, x)};\n`).join("")}}\n`;
  for (const [id, t] of Object.entries(v.typeScale))
    if (Object.keys(t.sizes ?? {}).length) css += `[data-type-scale="${id}"] {\n${Object.entries(t.sizes).map(([k, x]) => `  --${k}: ${toRem(k, x)};`).join("\n")}\n}\n`;
  return css;
}

/**
 * A draft written into the sources (pure): { tokens, params } → the same shape, changed. A font-sans / font-display
 * change also updates shape "$fonts" (what apps load with next/font).
 */
export function applyDraft(draft, { tokens, params }) {
  const t = clone(tokens);
  const p = clone(params);
  for (const [k, value] of Object.entries(draft.type ?? {})) {
    if (isObj(t.type[k])) t.type[k].value = value;
    else t.type[k] = value;
  }
  for (const g of PRODUCT)
    for (const [id, e] of Object.entries(draft[g] ?? {})) {
      const target = t.product[g][id];
      if (e.spacing !== undefined) target.spacing = e.spacing;
      if (e.sizes && Object.keys(e.sizes).length) target.sizes = { ...(target.sizes ?? {}), ...e.sizes };
    }
  const fonts = knownFonts(tokens);
  const shape = draft.shape ?? {};
  for (const [k, value] of Object.entries(shape)) {
    if (isObj(t.shape[k])) t.shape[k].value = value;
    else t.shape[k] = value;
  }
  if ("font-sans" in shape || "font-display" in shape) {
    const vars = [fontOf(val(t.shape["font-sans"])), fontOf(val(t.shape["font-display"]))].filter(Boolean);
    const next = [...new Set(vars)].map((v) => fonts[v]).filter(Boolean);
    if (next.length) t.shape.$fonts = next;
  }
  for (const [k, v] of Object.entries(draft.params ?? {})) p[k] = isObj(v) ? { ...p[k], ...v } : v;
  return { tokens: t, params: p };
}

/** The draft as a share link fragment (#lab=<base64url>), and back. */
export function encodeDraft(draft) {
  const bytes = new TextEncoder().encode(JSON.stringify(draft));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeDraft(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))));
}
