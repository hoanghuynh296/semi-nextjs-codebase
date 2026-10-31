#!/usr/bin/env node
/**
 * propose.mjs — helper for the /semi-propose skill.
 *
 *   --scan      Collect consumer-project context (installed vs latest @semi/ui, local primitives, workarounds).
 *   --search    Look for existing issues on the core repo before filing a duplicate.
 *   --create    Publish a proposal (body from --file) via the GitHub REST API.
 *               Falls back to a temp file + prefilled issue URL when unauthenticated.
 *   --dry-run   With --create: print what would be sent without calling the API.
 *
 * Auth: GITHUB_TOKEN / GH_TOKEN, else the user's configured git credential helper for github.com.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const REPO_OWNER = "hoanghuynh296";
const REPO_NAME = "semi-nextjs-codebase";
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
const GITHUB_API = "https://api.github.com";
const MAX_PREFILL_URL = 7000; // browsers/GitHub truncate longer prefilled URLs

const args = process.argv.slice(2);
const getArg = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
};
const hasFlag = (flag) => args.includes(flag);
const out = (obj) => console.log(JSON.stringify(obj, null, 2));

const cwd = path.resolve(getArg("--cwd", process.cwd()));

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();
  try {
    const res = execSync('printf "protocol=https\\nhost=github.com\\n" | git credential fill 2>/dev/null', {
      encoding: "utf8",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    const m = res.match(/^password=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  return null;
}

async function gh(endpoint, options = {}) {
  const token = getGitHubToken();
  return fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "semi-propose-agent",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
}

// ---------- scan ----------
const PRIMITIVES = [
  "Button", "Modal", "Dialog", "Select", "Combobox", "Dropdown", "Menu", "Tabs", "Table", "DataGrid",
  "Pagination", "Card", "Badge", "Chip", "Pill", "Tooltip", "Popover", "Drawer", "Sheet", "Accordion",
  "Slider", "Switch", "Toggle", "Checkbox", "Radio", "DateRange", "Calendar", "TimePicker", "Upload",
  "Dropzone", "Toast", "Stepper", "Progress", "Avatar", "Breadcrumb", "Tree", "Timeline", "Empty",
];
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", ".git", "out", "coverage"]);

function walk(dir, files = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return files; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (/\.(tsx|jsx)$/.test(e.name)) files.push(full);
  }
  return files;
}

function latestTag() {
  try {
    const res = execSync(`git ls-remote --tags --refs ${REPO_URL}.git`, {
      encoding: "utf8", timeout: 15000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    const tags = [...res.matchAll(/refs\/tags\/v(\d+)\.(\d+)\.(\d+)$/gm)].map((m) => m.slice(1).map(Number));
    tags.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    const t = tags.at(-1);
    return t ? t.join(".") : null;
  } catch { return null; }
}

function scanProject(dir) {
  const r = {
    projectDir: dir, name: path.basename(dir),
    semiUi: { declared: null, installed: null, latest: null, outdated: null },
    stack: { next: null, react: null, tailwind: null },
    localPrimitives: [], workarounds: { inlineSvgPath: [], nativeSelect: [], nativeDateOrNumber: [] },
    filesScanned: 0,
  };
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    r.name = pkg.name || r.name;
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    r.semiUi.declared = deps["@semi/ui"] || null;
    r.stack = { next: deps.next || null, react: deps.react || null, tailwind: deps.tailwindcss || null };
  } catch {}
  try {
    r.semiUi.installed = JSON.parse(fs.readFileSync(path.join(dir, "node_modules/@semi/ui/package.json"), "utf8")).version;
  } catch {}
  r.semiUi.latest = latestTag();
  if (r.semiUi.installed && r.semiUi.latest) r.semiUi.outdated = r.semiUi.installed !== r.semiUi.latest;

  const files = walk(dir).filter((f) => !f.includes(`${path.sep}node_modules${path.sep}`));
  r.filesScanned = files.length;
  for (const f of files) {
    const rel = path.relative(dir, f);
    const base = path.basename(f).replace(/\.(tsx|jsx)$/, "");
    if (/(^|\/)(components|ui)\//.test(rel.split(path.sep).join("/")) && PRIMITIVES.some((p) => base.toLowerCase().includes(p.toLowerCase()))) {
      r.localPrimitives.push(rel);
    }
    let src = "";
    try { src = fs.readFileSync(f, "utf8"); } catch { continue; }
    if (/<svg[\s\S]{0,400}?<path\b/.test(src)) r.workarounds.inlineSvgPath.push(rel);
    if (/<select\b/.test(src)) r.workarounds.nativeSelect.push(rel);
    if (/type=["'](date|number)["']/.test(src)) r.workarounds.nativeDateOrNumber.push(rel);
  }
  return r;
}

// ---------- search duplicates ----------
async function searchIssues(query) {
  const q = encodeURIComponent(`repo:${REPO_OWNER}/${REPO_NAME} is:issue ${query}`);
  const res = await gh(`/search/issues?q=${q}&per_page=10`);
  if (!res.ok) return { ok: false, status: res.status, hint: res.status === 404 || res.status === 401 ? "Private repo: GitHub auth required (gh auth login && gh auth setup-git, or GITHUB_TOKEN)." : undefined };
  const data = await res.json();
  return {
    ok: true,
    total: data.total_count,
    items: data.items.map((i) => ({ number: i.number, title: i.title, state: i.state, labels: i.labels.map((l) => l.name), url: i.html_url })),
  };
}

// ---------- create ----------
async function createIssue({ title, body, labels }) {
  if (!getGitHubToken()) return { success: false, reason: "NO_TOKEN" };
  const post = (payload) => gh(`/repos/${REPO_OWNER}/${REPO_NAME}/issues`, { method: "POST", body: JSON.stringify(payload) });
  let res = await post({ title, body, labels });
  let labelsDropped = false;
  if (res.status === 422 && labels.length) { // label missing/forbidden → retry without labels
    res = await post({ title, body });
    labelsDropped = true;
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 201) return { success: true, number: data.number, url: data.html_url, labelsDropped };
  return { success: false, reason: res.status === 404 ? "NO_ACCESS" : "API_ERROR", status: res.status, message: data.message };
}

function fallback({ title, body, labels }) {
  const safe = title.replace(/[^\w-]+/g, "-").slice(0, 60);
  const file = path.join(os.tmpdir(), `semi-proposal-${safe}.md`);
  fs.writeFileSync(file, `# ${title}\n\n${body}\n`, "utf8");
  const p = new URLSearchParams({ title, body, labels: labels.join(",") });
  let url = `${REPO_URL}/issues/new?${p}`;
  let urlNote;
  if (url.length > MAX_PREFILL_URL) {
    url = `${REPO_URL}/issues/new?${new URLSearchParams({ title, labels: labels.join(",") })}`;
    urlNote = `Body too long for a prefilled URL; open the link and paste the body from ${file}.`;
  }
  return { savedTo: file, webUrl: url, urlNote };
}

async function main() {
  if (hasFlag("--scan")) return out(scanProject(cwd));

  if (hasFlag("--search")) {
    const q = getArg("--search");
    if (!q) { out({ error: "Usage: --search \"<keywords>\"" }); process.exit(1); }
    return out(await searchIssues(q));
  }

  if (hasFlag("--create")) {
    const title = getArg("--title");
    const file = getArg("--file");
    const body = getArg("--body") ?? (file && fs.existsSync(path.resolve(cwd, file)) ? fs.readFileSync(path.resolve(cwd, file), "utf8") : null);
    const labels = getArg("--labels", "ecosystem-proposal").split(",").map((s) => s.trim()).filter(Boolean);
    if (!title || !body) { out({ success: false, error: "Missing --title or --file/--body" }); process.exit(1); }
    if (hasFlag("--dry-run")) return out({ dryRun: true, repo: `${REPO_OWNER}/${REPO_NAME}`, title, labels, bodyChars: body.length });

    const r = await createIssue({ title, body, labels });
    if (r.success) return out({ success: true, issueNumber: r.number, url: r.url, labelsDropped: r.labelsDropped });
    return out({ success: false, reason: r.reason, status: r.status, message: r.message, ...fallback({ title, body, labels }) });
  }

  console.log(`Semi Propose CLI
  node propose.mjs --scan [--cwd <dir>]
  node propose.mjs --search "<keywords>"
  node propose.mjs --create --title "<title>" --file <body.md> [--labels "ecosystem-proposal,component"] [--dry-run]`);
}

main().catch((e) => { out({ error: e.message }); process.exit(1); });
