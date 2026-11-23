// 0.36.0 (#96, C-031 / C-032): AppShell's `footer` is split into `utilities` (actions: help, theme) and `account` (who
// is signed in). The footer content is the account in almost every app, so `footer=` becomes `account=` on AppShell and
// DocsShell (same `{ collapsed }` render prop). Moving actions out of it into `utilities` is a judgement: CHANGELOG note.
// Phones get the drawer by default, but an app that sets `mobileTabIds` keeps MobileTabBar (deprecated prop); whether to
// move to the drawer is the app's choice, so the migration only warns where it is set without mobileNav.
// Since 0.37 (#113): the renamed render prop gets `{ collapsed, rail }`, and `rail` is also true at md where `collapsed`
// is false, so `({ collapsed }) => …collapsed…` becomes `({ collapsed, rail }) => …(collapsed || rail)…`; other shapes
// that read collapsed are reported with file:line (0.37.0-account-rail runs the same step for apps already on 0.36).
export const version = "0.36.0";
export const id = "shell";
export const description = "AppShell / DocsShell footer → account (not where account is already set), its collapsed check → collapsed || rail; warns where mobileTabIds is set without mobileNav";

/** The opening tags of AppShell / DocsShell as [start, end) ranges: a `>` inside `{…}` (an arrow function) or a string
 * does not end the tag. */
function shellTags(src) {
  const out = [];
  for (const m of src.matchAll(/<(?:AppShell|DocsShell)\b/g)) {
    let depth = 0;
    let quote = "";
    for (let i = m.index + m[0].length; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (ch === quote && src[i - 1] !== "\\") quote = "";
      } else if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        out.push([m.index, i + 1]);
        break;
      }
    }
  }
  return out;
}

/** Whether a prop name appears at brace depth 0 of an opening tag (not inside an attribute's {…} or a string). */
function hasTopLevelProp(tag, name) {
  let depth = 0;
  let quote = "";
  for (let i = 0; i < tag.length; i++) {
    const ch = tag[i];
    if (quote) {
      if (ch === quote && tag[i - 1] !== "\\") quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (depth === 0 && /\s/.test(ch) && tag.startsWith(name, i + 1) && /[=\s/>]/.test(tag[i + 1 + name.length] ?? "")) return true;
  }
  return false;
}

/** AppShell / DocsShell tags that set both footer and account: the migration leaves them for a person to merge. */
export function footerAndAccount(src) {
  return shellTags(src)
    .map(([a, b]) => src.slice(a, b))
    .filter((tag) => hasTopLevelProp(tag, "footer") && hasTopLevelProp(tag, "account")).length;
}

/** One source file; exact and safe to run twice. Only the `footer` prop at the top level of the tag is renamed. */
export function migrateShell(src) {
  if (!/@semi\/ui/.test(src)) return src;
  let out = "";
  let at = 0;
  for (const [a, b] of shellTags(src)) {
    const tag = src.slice(a, b);
    // a tag that already has `account` keeps its footer: two account props would not compile (migrate() warns)
    if (hasTopLevelProp(tag, "account")) {
      out += src.slice(at, b);
      at = b;
      continue;
    }
    // `footer` as a prop of the tag itself: at brace depth 0, after whitespace, followed by =, space, / or >
    let depth = 0;
    let quote = "";
    let renamed = tag;
    for (let i = 0; i < tag.length; i++) {
      const ch = tag[i];
      if (quote) {
        if (ch === quote && tag[i - 1] !== "\\") quote = "";
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (depth === 0 && /\s/.test(ch) && tag.startsWith("footer", i + 1) && /[=\s/>]/.test(tag[i + 7] ?? "")) {
        renamed = tag.slice(0, i + 1) + "account" + tag.slice(i + 7);
        break;
      }
    }
    out += src.slice(at, a) + renamed;
    at = b;
  }
  return out + src.slice(at);
}

/** The `{…}` expression of a top-level `name=` prop of a tag: [start, end) inside the tag, braces excluded, or null. */
function propExpression(tag, name) {
  let depth = 0;
  let quote = "";
  for (let i = 0; i < tag.length; i++) {
    const ch = tag[i];
    if (quote) {
      if (ch === quote && tag[i - 1] !== "\\") quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (depth === 0 && /\s/.test(ch) && tag.startsWith(`${name}={`, i + 1)) {
      const start = i + name.length + 3;
      let d = 1;
      let q = "";
      for (let j = start; j < tag.length; j++) {
        const c = tag[j];
        if (q) {
          if (c === q && tag[j - 1] !== "\\") q = "";
        } else if (c === '"' || c === "'" || c === "`") q = c;
        else if (c === "{") d++;
        else if (c === "}" && --d === 0) return [start, j];
      }
      return null;
    }
  }
  return null;
}

// `({ collapsed }) =>` or `({ collapsed }: ShellSlotState) =>`: the one shape that can be rewritten exactly
const COLLAPSED_ONLY = /^(\s*(?:async\s+)?\(\s*\{\s*)collapsed(\s*\}\s*(?::\s*[\w.]+\s*)?\)\s*=>)/;
// `collapsed` read as a value: not a property (`.collapsed`), a key (`collapsed:`) or part of a longer name
const COLLAPSED_READ = /(?<![\w$.])collapsed(?![\w$])(?!\s*:)/g;

/**
 * One source file: an AppShell / DocsShell `account` render prop that reads `collapsed` but not `rail` (0.35 footers
 * hid their text by `collapsed`; at md the rail is shown while `collapsed` is false). `({ collapsed }) => …` is
 * rewritten to `({ collapsed, rail }) => …(collapsed || rail)…`; any other shape is returned as `manual` (1-based
 * lines) for a person. Exact and safe to run twice (a prop that mentions `rail` is left alone).
 */
export function railAccount(src) {
  if (!/@semi\/ui/.test(src)) return { src, manual: [] };
  const manual = [];
  let out = "";
  let at = 0;
  for (const [a, b] of shellTags(src)) {
    const tag = src.slice(a, b);
    const range = propExpression(tag, "account");
    if (!range) continue;
    const expr = tag.slice(range[0], range[1]);
    if (!/(?<![\w$])collapsed(?![\w$])/.test(expr) || /(?<![\w$])rail(?![\w$])/.test(expr)) continue;
    const head = expr.match(COLLAPSED_ONLY);
    if (!head) {
      manual.push(src.slice(0, a + range[0]).split("\n").length);
      continue;
    }
    const body = expr.slice(head[0].length).replace(COLLAPSED_READ, "(collapsed || rail)");
    const next = `${head[1]}collapsed, rail${head[2]}${body}`;
    out += src.slice(at, a + range[0]) + next;
    at = a + range[1];
  }
  return { src: out + src.slice(at), manual };
}

/** How many AppShell / DocsShell tags set mobileTabIds without mobileNav (it still keeps the tab bar, but is deprecated). */
export function deprecatedTabIds(src) {
  return shellTags(src)
    .map(([a, b]) => src.slice(a, b))
    .filter((tag) => /\smobileTabIds\b/.test(tag) && !/\smobileNav=/.test(tag)).length;
}

/** The rail step alone, with its warnings (shared with 0.37.0-account-rail). */
export function migrateRail(f, src) {
  const { src: out, manual } = railAccount(src);
  for (const line of manual)
    console.warn(`${f}:${line}: AppShell's account reads collapsed but not rail: at md the sidebar is a rail while collapsed is false, so hide its text when \`collapsed || rail\` (or by \`rail\` alone).`);
  return out;
}

export default function migrate({ files, read, write }) {
  for (const f of files) {
    if (!/\.(tsx?|jsx?)$/.test(f)) continue;
    const src = read(f);
    write(f, migrateRail(f, migrateShell(src)));
    if (deprecatedTabIds(src))
      console.warn(`${f}: mobileTabIds without mobileNav keeps MobileTabBar but warns: add mobileNav="tabs" to keep the tab bar on purpose (mobileTabIds then picks its items), or remove mobileTabIds for the phone drawer.`);
    if (footerAndAccount(src)) console.warn(`${f}: AppShell sets both footer and account; footer was left as is: merge it into account / utilities by hand.`);
  }
}
