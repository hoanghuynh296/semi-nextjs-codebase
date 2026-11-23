// 0.36.0 (#96, C-031 / C-032): AppShell's `footer` is split into `utilities` (actions: help, theme) and `account` (who
// is signed in). The footer content is the account in almost every app, so `footer=` becomes `account=` on AppShell and
// DocsShell (same `{ collapsed }` render prop). Moving actions out of it into `utilities` is a judgement: CHANGELOG note.
// Phones get the drawer by default, but an app that sets `mobileTabIds` keeps MobileTabBar (deprecated prop); whether to
// move to the drawer is the app's choice, so the migration only warns where it is set without mobileNav.
// Since 0.37 (#113): the renamed render prop gets `{ collapsed, rail }`, and `rail` is also true at md where `collapsed`
// is false, so `({ collapsed }) => …collapsed…` becomes `({ collapsed, rail }) => …(collapsed || rail)…` where every
// `collapsed` is a plain read; other shapes, and functions / components that read neither, are reported with file:line
// (0.37.0-account-rail runs the same step for apps already on 0.36).
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
const word = (name) => new RegExp(`(?<![\\w$])${name}(?![\\w$])`);
// the code before a `collapsed` that makes it a plain expression read: the start of the body, ( ! ? && || => return
// ={ (an attribute value)
const READ_BEFORE = /(?:^|\(|!|\?|&&|\|\||=>|(?<![\w$])return|(?<![=!<>])=\s*\{)\s*$/;
// a parameter named collapsed (`(collapsed) =>`, `(collapsed: boolean, i) =>`) shadows the render prop's: never rewritten
const PARAM_AFTER = /^\s*(?::\s*[^,()=]+)?\s*(?:,[^()]*)?\)\s*(?::\s*[^=()]+)?=>/;
// …and the first parameter of a `function (collapsed)` / `function name(collapsed)` or a `catch (collapsed)`
const PARAM_BEFORE = /(?:(?<![\w$])function(?![\w$])[\s\w$*]*|(?<![\w$])catch\s*)\(\s*$/;
// …and what may follow it: ? && || ) } ; , : or the end
const READ_AFTER = /^\s*(?:\?|&&|\|\||\)|\}|;|,|:(?!:)|$)/;

/**
 * The body of `({ collapsed }) => body` with each `collapsed` read as `(collapsed || rail)`, or null when one
 * occurrence is anything else or cannot be told apart: a parameter that shadows it (`(collapsed) =>`), an attribute
 * name (`collapsed={…}`), a shorthand property
 * (`{ collapsed }`, `{...{ collapsed }}`), a comparison, a template literal or JSX text. Strings and comments that
 * mention the word are skipped. Conservative: when in doubt the caller reports file:line instead of rewriting.
 */
function rewriteReads(body) {
  const hits = [];
  let quote = "";
  let text = false; // inside JSX text (after a tag's `>`, until `<` or `{`)
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (text) {
      if (ch === "<" || ch === "{") text = false;
      else if (body.startsWith("collapsed", i) && !/[\w$]/.test(body[i - 1] ?? "") && !/[\w$]/.test(body[i + 9] ?? "")) return null;
      continue;
    }
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = "";
      continue;
    }
    if (body.startsWith("//", i)) {
      const nl = body.indexOf("\n", i);
      i = nl < 0 ? body.length : nl;
      continue;
    }
    if (body.startsWith("/*", i)) {
      const close = body.indexOf("*/", i + 2);
      i = close < 0 ? body.length : close + 1;
      continue;
    }
    if (ch === "`") {
      // a template literal may read collapsed inside ${…}: never rewritten
      const close = body.indexOf("`", i + 1);
      if (word("collapsed").test(body.slice(i, close < 0 ? body.length : close))) return null;
      quote = ch;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === ">" && body[i - 1] !== "=" && body[i + 1] !== "=") text = true;
    else if (body.startsWith("collapsed", i) && !/[\w$.]/.test(body[i - 1] ?? "") && !/[\w$]/.test(body[i + 9] ?? "")) {
      // an object key (`{ collapsed: 1 }`) is not a read: left as is
      if (/[{,]\s*$/.test(body.slice(0, i)) && /^\s*:(?!:)/.test(body.slice(i + 9))) {
        i += 8;
        continue;
      }
      const after = body.slice(i + 9).replace(/^\s*\/\*[\s\S]*?\*\//, "");
      const before = body.slice(0, i);
      if (!READ_BEFORE.test(before) || !READ_AFTER.test(after) || PARAM_AFTER.test(after) || PARAM_BEFORE.test(before)) return null;
      hits.push(i);
      i += 8;
    }
  }
  let out = body;
  for (const i of hits.reverse()) out = `${out.slice(0, i)}(collapsed || rail)${out.slice(i + 9)}`;
  return out;
}

/**
 * One source file: AppShell / DocsShell `account` render props that may squeeze into the md rail (0.35 footers hid
 * their text by `collapsed`; at md the rail is shown while `collapsed` is false). `({ collapsed }) => …` whose every
 * `collapsed` is a plain read is rewritten to `({ collapsed, rail }) => …(collapsed || rail)…`. Returned as `manual`
 * (1-based `line` and a `reason`) for a person: other shapes that read collapsed (`reason: "collapsed"`), and a
 * function or a component reference that reads neither (`reason: "state"`: it may render the full block in the
 * rail). A prop that mentions `rail`, or a plain JSX node, is left alone. Exact and safe to run twice.
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
    if (word("rail").test(expr)) continue;
    const line = src.slice(0, a + range[0]).split("\n").length;
    if (!word("collapsed").test(expr)) {
      // a render function, or a name that may hold one: it gets { collapsed, rail } and may ignore both
      if (/^\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*(?::[^=]+)?=>|[\w$]+\s*=>|[\w$.]+\s*$)/.test(expr)) manual.push({ line, reason: "state" });
      continue;
    }
    const head = expr.match(COLLAPSED_ONLY);
    const body = head && rewriteReads(expr.slice(head[0].length));
    if (body == null) {
      manual.push({ line, reason: "collapsed" });
      continue;
    }
    out += src.slice(at, a + range[0]) + `${head[1]}collapsed, rail${head[2]}${body}`;
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
  // a tag whose end could not be read (an apostrophe in JSX text inside a prop): nothing in it was checked
  const opened = /@semi\/ui/.test(src) ? [...src.matchAll(/<(?:AppShell|DocsShell)\b/g)].length : 0;
  if (opened > shellTags(src).length)
    console.warn(`${f}: an AppShell / DocsShell tag could not be read to its end (a quote in JSX text?): check its account by hand (hide its text when \`collapsed || rail\`).`);
  for (const { line, reason } of manual)
    console.warn(
      reason === "collapsed"
        ? `${f}:${line}: AppShell's account reads collapsed but not rail (left as is): at md the sidebar is a rail while collapsed is false, so hide its text when \`collapsed || rail\` (or by \`rail\` alone).`
        : `${f}:${line}: AppShell's account is a function or component that reads neither collapsed nor rail: check it hides its text in the rail (render prop \`{ collapsed, rail }\`, by \`rail\`).`,
    );
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
