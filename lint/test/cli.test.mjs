import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as core from "../../cli/core.mjs";

const top = (q) => core.search(q)[0]?.id;
const cli = (args, opts = {}) => spawnSync(process.execPath, [join(import.meta.dirname, "../../cli/semi.mjs"), ...args], { encoding: "utf8", ...opts });

test("search: needs in Vietnamese or English land on the right doc", () => {
  assert.equal(top("bảng có sắp xếp và chọn dòng"), "data-table");
  assert.equal(top("agent hỏi trước khi gửi email"), "action-confirmation");
  assert.equal(top("pick a date range"), "calendar");
  assert.equal(top("bieu do doanh thu"), "chart");
  assert.equal(top("nhập mã otp"), "input-otp");
  assert.equal(top("cây thư mục"), "file-tree");
  assert.equal(top("thông báo sau khi lưu"), "toast");
  assert.equal(top("menu điều hướng website"), "navigation-menu");
  assert.deepEqual(core.search("   "), []);
});

test("findDoc resolves ids, component names and titles", () => {
  assert.equal(core.findDoc("DataTable").id, "data-table");
  assert.equal(core.findDoc("data table").id, "data-table");
  assert.equal(core.findDoc("Citation").id, "sources");
  assert.equal(core.findDoc("nope"), undefined);
});

test("every doc has its markdown and examples; blocks have one page", () => {
  for (const d of core.docs()) {
    assert.ok(core.docMarkdown(d.id), `${d.id}.md`);
    assert.ok(core.examples(d.id).length, `${d.id} examples`);
  }
  assert.deepEqual(core.blocks().map((b) => b.id).sort(), ["agent-run", "dashboard", "list-page", "settings-page"]);
  for (const b of core.blocks()) assert.match(core.examples(b.id)[0].code, /export default function/);
});

test("cli: docs, props, --json and errors", () => {
  assert.match(cli(["docs", "Button"]).stdout, /^# Button/);
  assert.equal(JSON.parse(cli(["props", "DataTable", "--json"]).stdout).module, "src/DataTable.tsx");
  const miss = cli(["docs", "Nope"]);
  assert.equal(miss.status, 1);
  assert.match(miss.stderr, /semi search/);
});

test("cli add: writes the block and refuses to overwrite", () => {
  const dir = mkdtempSync(join(tmpdir(), "semi-add-"));
  assert.equal(cli(["add", "dashboard"], { cwd: dir }).status, 0);
  assert.match(readFileSync(join(dir, "app/dashboard/page.tsx"), "utf8"), /DashboardPage/);
  assert.equal(cli(["add", "dashboard"], { cwd: dir }).status, 2);
  assert.equal(cli(["add", "list-page", "--out", "x/orders.tsx"], { cwd: dir }).status, 0);
  assert.ok(existsSync(join(dir, "x/orders.tsx")));
});

test("mcp: initialize, list tools and call one over stdio", () => {
  const lines = [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "semi_docs", arguments: { name: "Slider" } } },
    { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "semi_docs", arguments: { name: "Nope" } } },
  ];
  const out = cli(["mcp"], { input: lines.map((l) => JSON.stringify(l)).join("\n") + "\n" })
    .stdout.trim()
    .split("\n")
    .map((l) => JSON.parse(l));
  assert.equal(out.length, 4); // no reply to the notification
  assert.equal(out[0].result.serverInfo.name, "semi");
  assert.ok(out[1].result.tools.some((t) => t.name === "semi_search"));
  assert.match(out[2].result.content[0].text, /^# Slider/);
  assert.equal(out[3].result.isError, true);
});
