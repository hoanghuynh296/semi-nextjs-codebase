#!/usr/bin/env node
// Starts the Semi MCP server of the project's own @semi/ui (node_modules/@semi/ui/cli/mcp.mjs), so the docs the agent
// reads always match the installed version. Looks in the folder the agent runs in, its parents and, for a monorepo,
// apps/* and packages/*. Without @semi/ui it still answers, with one tool that says how to add Semi.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

function findServer(start) {
  const candidates = [];
  for (let dir = start; dir !== dirname(dir); dir = dirname(dir)) {
    candidates.push(join(dir, "node_modules/@semi/ui"));
    // the Semi repository itself
    try {
      if (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name === "@semi/ui") candidates.push(dir);
    } catch {}
  }
  for (const group of ["apps", "packages"]) {
    try {
      for (const e of readdirSync(join(start, group), { withFileTypes: true })) if (e.isDirectory()) candidates.push(join(start, group, e.name, "node_modules/@semi/ui"));
    } catch {}
  }
  return candidates.map((c) => join(c, "cli/mcp.mjs")).find((f) => existsSync(f));
}

const server = findServer(process.cwd());
if (server) {
  await import(pathToFileURL(server).href);
} else {
  const send = (m) => process.stdout.write(JSON.stringify(m) + "\n");
  const tool = {
    name: "semi_status",
    description: "Why the Semi docs tools are not available here and how to add them.",
    inputSchema: { type: "object", properties: {} },
  };
  const why = "This project has no @semi/ui 0.13+ installed. New app: /semi-init. Existing app: /semi-audit then /semi-fix (installs @semi/ui). Older @semi/ui: /semi-update. Then restart the agent session.";
  createInterface({ input: process.stdin }).on("line", (line) => {
    let m;
    try {
      m = JSON.parse(line);
    } catch {
      return;
    }
    if (m.method === "initialize") send({ jsonrpc: "2.0", id: m.id, result: { protocolVersion: m.params?.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "semi", version: "0" }, instructions: why } });
    else if (m.method === "tools/list") send({ jsonrpc: "2.0", id: m.id, result: { tools: [tool] } });
    else if (m.method === "tools/call") send({ jsonrpc: "2.0", id: m.id, result: { content: [{ type: "text", text: why }] } });
    else if (m.method === "ping") send({ jsonrpc: "2.0", id: m.id, result: {} });
    else if (m.id !== undefined) send({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: "Method not found" } });
  });
}
