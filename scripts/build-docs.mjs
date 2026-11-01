// Component docs, agent-first (docs/COMPONENT_DOCS.md): examples/<id>/meta.json + examples/<id>/<example>.tsx →
//   examples/registry.generated.ts   what the docs site renders (site/): meta, example code + component, API tables
//   docs/components/<id>.md           one page per doc for agents (also served at /docs/components/<id>.md)
//   docs/components/README.md         the index: every doc, its components, when to use it
//   examples/list.generated.json      id / title / group / description / components of every doc (static params, metadata)
// Props come from the TypeScript types of src/ (name, type, required, default, TSDoc), so the API tables never drift.
// Used by scripts/build-manifest.mjs (which writes the files and checks they are fresh).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

export const GROUPS = ["Actions", "Forms", "Overlays", "Navigation & layout", "Data display", "Feedback", "AI", "Setup"];
const MAX_LITERALS = 10; // a longer literal union (IconName, SemanticTone…) is shown by its alias name

/** Read every examples/<id>/meta.json with its example sources. */
export function readDocs(root) {
  const dir = join(root, "examples");
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, "meta.json")))
    .map((d) => {
      const meta = JSON.parse(readFileSync(join(dir, d.name, "meta.json"), "utf8"));
      const examples = meta.examples.map((ex) => {
        const file = join(dir, d.name, `${ex.file}.tsx`);
        if (!existsSync(file)) throw new Error(`examples/${d.name}/meta.json: missing ${ex.file}.tsx`);
        return { ...ex, code: readFileSync(file, "utf8").trim() };
      });
      return { id: d.name, ...meta, examples };
    })
    .sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.title.localeCompare(b.title));
}

/** { ComponentName: { description, props: [{ name, type, required, default, description }] } } for exported components. */
export function readApi(root, names) {
  const options = { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, skipLibCheck: true, allowJs: false };
  const program = ts.createProgram([join(root, "src/index.ts")], options);
  const checker = program.getTypeChecker();
  const entry = program.getSourceFile(join(root, "src/index.ts"));
  const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(entry));
  const out = {};
  const typeText = (type, node) => {
    const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType;
    if (type.isUnion()) {
      const parts = type.types.filter((t) => !(t.flags & ts.TypeFlags.Undefined));
      if (parts.length > MAX_LITERALS && parts.every((t) => t.isStringLiteral()) && node?.type) return node.type.getText();
      const text = parts.map((t) => checker.typeToString(t, undefined, flags)).join(" | ");
      return text.replace(/^false \| true$|^true \| false$/, "boolean").replace(/false \| true/g, "boolean");
    }
    return checker.typeToString(type, undefined, flags);
  };
  // Long expansions (ReactNode, Ref<…>, handlers) read better as written in the source.
  const shown = (type, node) => {
    const text = typeText(type, node);
    return text.length > 70 && node?.type ? node.type.getText().replace(/\s+/g, " ") : text;
  };
  for (const name of names) {
    let sym = exports.find((s) => s.name === name);
    if (!sym) continue;
    if (sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
    const decl = sym.declarations?.[0];
    let fn = decl;
    if (decl && ts.isVariableDeclaration(decl) && decl.initializer) fn = decl.initializer;
    if (fn && ts.isCallExpression(fn)) fn = fn.arguments.find((a) => ts.isFunctionExpression(a) || ts.isArrowFunction(a)) ?? fn;
    const param = fn && fn.parameters?.[0];
    const description = ts.displayPartsToString(sym.getDocumentationComment(checker)).trim();
    if (!param) {
      out[name] = { description, props: [] };
      continue;
    }
    const defaults = {};
    if (ts.isObjectBindingPattern(param.name))
      for (const el of param.name.elements) if (el.initializer && !el.dotDotDotToken) defaults[(el.propertyName ?? el.name).getText()] = el.initializer.getText();
    const type = checker.getTypeAtLocation(param);
    const members = type.isUnion() ? type.types : [type];
    const seen = new Map();
    for (const member of members) {
      for (const p of checker.getPropertiesOfType(member)) {
        // Only props this library declares (HTML / React attributes are left out); a prop it re-declares counts.
        const pd = p.declarations?.find((d) => !d.getSourceFile().fileName.includes("node_modules"));
        if (!pd) continue;
        const ptype = checker.getTypeOfSymbolAtLocation(p, pd);
        const prev = seen.get(p.name);
        const optional = Boolean(p.flags & ts.SymbolFlags.Optional);
        if (prev) {
          prev.required = prev.required && !optional;
          const t = shown(ptype, pd);
          if (!prev.types.includes(t)) prev.types.push(t);
          continue;
        }
        seen.set(p.name, {
          name: p.name,
          types: [shown(ptype, pd)],
          required: !optional,
          ...(defaults[p.name] !== undefined ? { default: defaults[p.name] } : {}),
          description: ts.displayPartsToString(p.getDocumentationComment(checker)).trim().replace(/\s+/g, " "),
        });
      }
    }
    // Required only when every union member requires it (Button's aria-label: only with iconOnly).
    if (members.length > 1)
      for (const p of seen.values())
        p.required = members.every((m) => {
          const ps = checker.getPropertyOfType(m, p.name);
          return ps && !(ps.flags & ts.SymbolFlags.Optional);
        });
    const props = [...seen.values()].map(({ types, ...p }) => ({
      ...p,
      type: [...new Set(types.join(" | ").split(" | "))].join(" | ").replace(/\bfalse \| true\b|\btrue \| false\b/g, "boolean"),
    }));
    out[name] = { description, props: props.map(({ name: n, type: t, required, default: d, description: ds }) => ({ name: n, type: t, required, ...(d !== undefined ? { default: d } : {}), description: ds })) };
  }
  return out;
}

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

/** The agent-facing page of one doc. */
export function docMarkdown(doc, api) {
  const lines = [`# ${doc.title}`, "", doc.description, ""];
  if (doc.when?.length) lines.push("## When to use", "", ...doc.when.map((w) => `- ${w}`), "");
  if (doc.instead?.length) lines.push("## Use something else when", "", "| Need | Use |", "|---|---|", ...doc.instead.map((i) => `| ${cell(i.need)} | ${cell(i.use)} |`), "");
  if (doc.imports) lines.push("## Import", "", "```tsx", doc.imports, "```", "");
  lines.push("## Examples", "");
  for (const ex of doc.examples) lines.push(`### ${ex.title}`, "", ...(ex.description ? [ex.description, ""] : []), "```tsx", ex.code, "```", "");
  lines.push("## API", "");
  for (const name of doc.components) {
    const a = api[name];
    lines.push(`### ${name}`, "");
    if (a?.description) lines.push(a.description, "");
    if (a?.props.length) lines.push("| Prop | Type | Default | Description |", "|---|---|---|---|", ...a.props.map((p) => `| \`${p.name}\`${p.required ? " *" : ""} | \`${cell(p.type)}\` | ${p.default ? `\`${cell(p.default)}\`` : ""} | ${cell(p.description)} |`), "");
    else lines.push("No props of its own.", "");
  }
  if (doc.a11y?.length) lines.push("## Accessibility", "", ...doc.a11y.map((a) => `- ${a}`), "");
  if (doc.notes?.length) lines.push("## Notes", "", ...doc.notes.map((n) => `- ${n}`), "");
  lines.push(`<!-- GENERATED by scripts/build-docs.mjs from examples/${doc.id}/ and the types in src/ -->`, "");
  return lines.join("\n");
}

/** Everything generated from examples/: { files: { path: content }, docs, api }. */
export function buildDocs(root, { exported }) {
  const docs = readDocs(root);
  const names = [...new Set(docs.flatMap((d) => d.components))];
  const api = readApi(root, names);
  const problems = [];
  for (const d of docs) {
    if (!GROUPS.includes(d.group)) problems.push(`examples/${d.id}/meta.json: group "${d.group}" is not one of ${GROUPS.join(", ")}`);
    for (const c of d.components) if (!exported.has(c)) problems.push(`examples/${d.id}/meta.json: "${c}" is not exported by @semi/ui`);
    for (const ex of d.examples) {
      for (const [, names2] of ex.code.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@semi\/ui(?:\/styles)?"/g))
        for (const n of names2.split(",").map((x) => x.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]).filter(Boolean))
          if (!exported.has(n)) problems.push(`examples/${d.id}/${ex.file}.tsx: imports "${n}", which @semi/ui does not export`);
      if (!/^export default function \w+/m.test(ex.code)) problems.push(`examples/${d.id}/${ex.file}.tsx: needs "export default function Name()"`);
      if (/from "\.\.?\//.test(ex.code)) problems.push(`examples/${d.id}/${ex.file}.tsx: import from "@semi/ui", not a relative path (examples are copied by agents)`);
    }
  }
  for (const d of docs) {
    const names = [...d.components, ...(d.imports ?? [])];
    d.imports = names.length ? `import { ${names.join(", ")} } from "@semi/ui";` : ""; // pattern pages (agent-run) import in their examples
  }
  const markdown = Object.fromEntries(docs.map((d) => [d.id, docMarkdown(d, api)]));

  const ident = (id, file) => `${id}_${file}`.replace(/[^A-Za-z0-9_]/g, "_");
  const registry = [
    "// GENERATED by scripts/build-docs.mjs from examples/*/ — do not edit. Rendered by site/ (Semi docs and brand previews).",
    'import type { ComponentType } from "react";',
    ...docs.flatMap((d) => d.examples.map((ex) => `import ${ident(d.id, ex.file)} from "./${d.id}/${ex.file}";`)),
    "",
    "export interface DocProp { name: string; type: string; required: boolean; default?: string; description: string }",
    "export interface DocExample { file: string; title: string; description?: string; preview?: \"inline\" | \"frame\" | \"none\"; code: string; Component: ComponentType<any> }",
    "export interface DocEntry {",
    "  id: string; title: string; group: string; description: string; components: string[]; imports: string;",
    "  when: string[]; instead: { need: string; use: string }[]; a11y: string[]; notes: string[];",
    "  api: { name: string; description: string; props: DocProp[] }[]; examples: DocExample[]; markdown: string;",
    "}",
    "",
    `export const GROUPS = ${JSON.stringify(GROUPS)};`,
    "",
    "export const DOCS: DocEntry[] = [",
    ...docs.map((d) => {
      const data = {
        id: d.id,
        title: d.title,
        group: d.group,
        description: d.description,
        components: d.components,
        imports: d.imports,
        when: d.when ?? [],
        instead: d.instead ?? [],
        a11y: d.a11y ?? [],
        notes: d.notes ?? [],
        api: d.components.map((c) => ({ name: c, ...(api[c] ?? { description: "", props: [] }) })),
        markdown: markdown[d.id],
      };
      const json = JSON.stringify(data);
      const exs = d.examples.map((ex) => `{ file: ${JSON.stringify(ex.file)}, title: ${JSON.stringify(ex.title)}, ${ex.description ? `description: ${JSON.stringify(ex.description)}, ` : ""}${ex.preview ? `preview: ${JSON.stringify(ex.preview)}, ` : ""}code: ${JSON.stringify(ex.code)}, Component: ${ident(d.id, ex.file)} }`);
      return `  { ...${json}, examples: [${exs.join(", ")}] },`;
    }),
    "];",
    "",
  ].join("\n");

  const index = [
    "# Semi components",
    "",
    "Every component doc, for agents: read the one you need (`node_modules/@semi/ui/docs/components/<id>.md`), copy an",
    "example, keep its imports from `@semi/ui`. Generated from `examples/` and the types in `src/`.",
    "",
    ...GROUPS.flatMap((g) => {
      const list = docs.filter((d) => d.group === g);
      return list.length ? [`## ${g}`, "", "| Doc | Components | When to use |", "|---|---|---|", ...list.map((d) => `| [${d.title}](${d.id}.md) | ${d.components.map((c) => `\`${c}\``).join(", ")} | ${cell(d.when?.[0] ?? d.description)} |`), ""] : [];
    }),
  ].join("\n");

  // A light list for server code (static params, metadata) that must not import the example components.
  const list = JSON.stringify(docs.map((d) => ({ id: d.id, title: d.title, group: d.group, description: d.description, components: d.components })), null, 2) + "\n";
  const files = {
    "examples/registry.generated.ts": registry,
    "examples/list.generated.json": list,
    "docs/components/README.md": index + "\n",
    ...Object.fromEntries(docs.map((d) => [`docs/components/${d.id}.md`, markdown[d.id]])),
  };
  return { files, docs, api, problems };
}
