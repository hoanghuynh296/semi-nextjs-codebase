// The Semi docs as an MCP server (stdio, newline-delimited JSON-RPC 2.0; no SDK). Started by `semi mcp`, which the
// semi-design plugin runs for the agent. Tools answer from the installed @semi/ui, like the CLI.
import { createInterface } from "node:readline";
import * as core from "./core.mjs";

const text = (t) => ({ content: [{ type: "text", text: t }] });
const json = (v) => text(JSON.stringify(v, null, 2));
const missing = (name) => ({ ...text(`No Semi doc or export named "${name}". Call semi_search with the need in words.`), isError: true });

const TOOLS = [
  {
    name: "semi_search",
    description: "Find the Semi component for a UI need, in words (Vietnamese or English): 'bảng có sắp xếp', 'pick a date range', 'agent asks before sending'. Returns ranked docs with when to use them. Call this before writing any UI.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number" } }, required: ["query"] },
    run: ({ query, limit }) => json(core.search(query, limit ?? 8)),
  },
  {
    name: "semi_docs",
    description: "The full page of a Semi component (by doc id like 'data-table' or a component name like 'DataTable'): when to use, what to use instead, import line, examples, API table, accessibility.",
    inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
    run: ({ name }) => {
      const d = core.findDoc(name);
      return d ? text(core.docMarkdown(d.id)) : missing(name);
    },
  },
  {
    name: "semi_example",
    description: "Example code of a Semi doc to start from (imports from @semi/ui only, type-checked). Omit file for all examples of the doc.",
    inputSchema: { type: "object", properties: { name: { type: "string" }, file: { type: "string" } }, required: ["name"] },
    run: ({ name, file }) => {
      const d = core.findDoc(name);
      if (!d) return missing(name);
      const ex = core.examples(d.id).filter((e) => !file || e.file === file);
      return ex.length ? text(ex.map((e) => `// ${e.title} — ${e.path}\n${e.code}`).join("\n")) : missing(`${name}/${file}`);
    },
  },
  {
    name: "semi_props",
    description: "Kind, module, summary and prop names of a Semi export (component, hook or function).",
    inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
    run: ({ name }) => {
      const c = core.component(name);
      return c ? json(c) : missing(name);
    },
  },
  {
    name: "semi_list",
    description: "Every Semi doc by group (Actions, Forms, Data display, Navigation & layout, Overlays, Feedback, AI, Blocks…), optionally one group.",
    inputSchema: { type: "object", properties: { group: { type: "string" } } },
    run: ({ group }) =>
      json(
        Object.fromEntries(
          [...core.groups()].filter(([g]) => !group || core.normalize(g) === core.normalize(group)).map(([g, ds]) => [g, ds.map((d) => ({ id: d.id, components: d.components, when: d.when?.[0] ?? d.description }))]),
        ),
      ),
  },
  {
    name: "semi_block",
    description: "Page-level blocks (dashboard, settings, list page, agent workspace): without id, the list; with id, the block's full page code to copy into the app.",
    inputSchema: { type: "object", properties: { id: { type: "string" } } },
    run: ({ id }) => {
      if (!id) return json(core.blocks().map((b) => ({ id: b.id, title: b.title, description: b.description })));
      const b = core.blocks().find((x) => x.id === id);
      return b ? text(core.examples(b.id)[0].code) : missing(id);
    },
  },
  {
    name: "semi_brand",
    description: "The brand of this app (its brand kit): topic 'voice' (tone, how to address the user, do / don't, example button / error / empty texts), 'color' (how much accent, secondary colour role, button shades per theme), 'logo' (files to import, clear space), 'brief' (audience, personality, imagery), 'tokens', or 'all' (the full BRAND.md). Call it before writing UI text, picking colours or placing the logo.",
    inputSchema: { type: "object", properties: { topic: { type: "string", enum: ["all", "voice", "color", "logo", "brief", "tokens"] } } },
    run: ({ topic }) => {
      const r = core.brand(topic ?? "all");
      if (r.error) return { ...text(r.error), isError: true };
      return r.markdown ? text(r.markdown) : json(r);
    },
  },
];

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
const reply = (id, result) => send({ jsonrpc: "2.0", id, result });
const error = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

export function handle(msg) {
  const { id, method, params } = msg;
  if (method === "initialize")
    return reply(id, {
      protocolVersion: params?.protocolVersion ?? "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "semi", version: core.version() },
      instructions: "Semi Design System docs for the installed @semi/ui. Before writing UI: semi_search the need, read semi_docs of the pick, start from semi_example. Never invent local primitives. In an app with a brand kit, semi_brand gives its voice, colour use and logo.",
    });
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools: TOOLS.map(({ run, ...t }) => t) });
  if (method === "tools/call") {
    const tool = TOOLS.find((t) => t.name === params?.name);
    if (!tool) return error(id, -32602, `Unknown tool ${params?.name}`);
    try {
      return reply(id, tool.run(params.arguments ?? {}));
    } catch (e) {
      return reply(id, { ...text(String(e?.message ?? e)), isError: true });
    }
  }
  if (id !== undefined && !method?.startsWith("notifications/")) return error(id, -32601, `Method not found: ${method}`);
}

createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return error(null, -32700, "Parse error");
  }
  for (const m of Array.isArray(msg) ? msg : [msg]) handle(m);
});
