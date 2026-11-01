#!/usr/bin/env node
// `semi`: the Semi docs from the terminal, for agents first (plain markdown out, `--json` for structured output).
//   semi search "bảng có sắp xếp"     which component fits a need (ranked, with why)
//   semi docs DataTable               the component's page: when / instead / import / examples / API / a11y
//   semi example data-table [file]    the example code to start from
//   semi props Button                 props from components.json
//   semi list [--group AI]            every doc by group
//   semi blocks / semi add <block>    page-level blocks; add copies one into the app
//   semi mcp                          the same tools as an MCP server on stdio
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import * as core from "./core.mjs";

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--") && !a.includes("=")));
const opt = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=") ?? (argv.includes(`--${name}`) ? argv[argv.indexOf(`--${name}`) + 1] : undefined);
const valued = new Set(["--group", "--out"]);
const args = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]));
const [cmd, ...rest] = args;
const json = flags.has("--json");

const out = (data, text) => process.stdout.write((json ? JSON.stringify(data, null, 2) : text) + "\n");
const fail = (msg, code = 1) => {
  process.stderr.write(msg + "\n");
  process.exit(code);
};
const need = (doc, name) => doc ?? fail(`No Semi doc for "${name}". Try: semi search "${name}"`);

const HELP = `semi ${core.version()} — Semi Design System docs for agents

  semi search <need…>          which component fits (words in Vietnamese or English)
  semi docs <id|Component>     the component page (markdown)
  semi example <id> [file]     example code (all examples when no file)
  semi props <Component>       props and summary
  semi list [--group <name>]   every doc, by group
  semi blocks                  page-level blocks
  semi add <block> [--out <path>] [--force]   copy a block into this app
  semi mcp                     run as an MCP server (stdio)

Add --json for structured output.`;

switch (cmd) {
  case "search": {
    const q = rest.join(" ");
    if (!q) fail("semi search <need…>");
    const res = core.search(q);
    out(res, res.length ? res.map((r, i) => `${i + 1}. ${r.title} (${r.id}) — ${r.components.join(", ") || "pattern"}\n   ${r.when}${r.why ? `\n   ↳ ${r.why}` : ""}`).join("\n") + `\n\nNext: semi docs ${res[0].id}` : `Nothing matches "${q}". semi list shows every doc.`);
    break;
  }
  case "docs": {
    const d = need(core.findDoc(rest.join(" ")), rest.join(" "));
    const md = core.docMarkdown(d.id);
    out({ ...d, markdown: md }, md);
    break;
  }
  case "example":
  case "examples": {
    const d = need(core.findDoc(rest[0] ?? ""), rest[0]);
    let ex = core.examples(d.id);
    if (rest[1]) ex = ex.filter((e) => e.file === rest[1]);
    if (!ex.length) fail(`No example "${rest[1]}" in ${d.id}. Examples: ${core.examples(d.id).map((e) => e.file).join(", ")}`);
    out(ex, ex.map((e) => `// ${e.title} — ${e.path}\n${e.code}`).join("\n"));
    break;
  }
  case "props": {
    const c = core.component(rest[0] ?? "") ?? fail(`No export "${rest[0]}". Try: semi search ${rest[0] ?? ""}`);
    out(c, `${c.name} (${c.kind}, ${c.module})\n${c.summary}\n${c.props ? `props: ${c.props.join(", ")}\n` : ""}${c.doc ? `full API: semi docs ${c.name}` : ""}`);
    break;
  }
  case "list": {
    const g = opt("group");
    const groups = [...core.groups()].filter(([name]) => !g || core.normalize(name) === core.normalize(g));
    out(
      Object.fromEntries(groups.map(([name, ds]) => [name, ds.map((d) => ({ id: d.id, title: d.title, components: d.components, when: d.when?.[0] }))])),
      groups.map(([name, ds]) => `## ${name}\n${ds.map((d) => `- ${d.id}: ${d.components.join(", ") || d.title} — ${d.when?.[0] ?? d.description}`).join("\n")}`).join("\n\n"),
    );
    break;
  }
  case "blocks": {
    const bs = core.blocks();
    out(bs.map((b) => ({ id: b.id, title: b.title, description: b.description })), bs.map((b) => `- ${b.id}: ${b.description}`).join("\n") + "\n\nAdd one: semi add <id>");
    break;
  }
  case "add": {
    const b = core.blocks().find((x) => x.id === rest[0]) ?? fail(`No block "${rest[0] ?? ""}". Blocks: ${core.blocks().map((x) => x.id).join(", ")}`);
    const [ex] = core.examples(b.id);
    const target = resolve(opt("out") ?? join(existsSync("src/app") ? "src/app" : "app", b.id, "page.tsx"));
    if (existsSync(target) && !flags.has("--force")) fail(`${target} exists. Pass --force to replace it, or --out <path>.`, 2);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, ex.code);
    out({ block: b.id, file: target }, `Added ${b.title} → ${target}\nReplace the sample data with the app's own; keep the Semi components.`);
    break;
  }
  case "mcp":
    await import("./mcp.mjs");
    break;
  case undefined:
  case "help":
  case "--help":
    out({ version: core.version() }, HELP);
    break;
  default:
    fail(`Unknown command "${cmd}".\n\n${HELP}`);
}
