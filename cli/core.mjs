// Read the Semi docs that ship in the package (examples/, docs/components/, components.json) for agents: the `semi`
// CLI and the MCP server (cli/mcp.mjs) both answer from here, so they always match the installed @semi/ui version.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), "utf8"));

let cache;
/** Every doc: list entry + its meta.json (when, instead, a11y, examples). */
export function docs() {
  if (cache) return cache;
  cache = readJson("examples/list.generated.json").map((d) => ({ ...readJson(`examples/${d.id}/meta.json`), ...d }));
  return cache;
}

export function manifest() {
  return readJson("components.json");
}

export const version = () => readJson("package.json").version;

/** Lower case, Vietnamese marks removed: people and agents type "ban do", "bảng dữ liệu" or "Bảng". */
export const normalize = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

/** A doc by id, by component name ("DataTable"), or by title ("Data table"). */
export function findDoc(name) {
  const n = normalize(name).replace(/[\s_-]/g, "");
  const flat = (s) => normalize(s).replace(/[\s_-]/g, "");
  return docs().find((d) => flat(d.id) === n || flat(d.title) === n) ?? docs().find((d) => d.components.some((c) => flat(c) === n));
}

// Docs are written in English; people often ask in Vietnamese. Phrases first (longest wins), marks already removed.
const VI = Object.entries({
  "sap xep": "sort", "bieu do": "chart", "doanh thu": "revenue chart", "xu huong": "trend sparkline", "khoang ngay": "date range", "ngay": "date day", "lich": "calendar date",
  "khoang": "range", "chon nhieu": "multiple select", "chon": "select pick", "bang": "table", "dong": "row", "cot": "column", "gui": "send", "duyet": "approve confirmation",
  "cho phep": "approve", "xac nhan": "confirm confirmation", "hoi truoc": "approve confirmation", "tai len": "upload", "tim kiem": "search", "tim": "search", "loc": "filter",
  "thong bao": "toast notification", "mat khau": "password", "ma xac thuc": "otp verification code", "ma otp": "otp", "ma": "code", "tep": "file", "thu muc": "folder tree",
  "hop thoai": "modal dialog", "ngan keo": "drawer sheet", "nut": "button", "phan trang": "pagination", "trang": "page", "dang tai": "loading skeleton", "trong": "empty",
  "loi": "error alert", "canh bao": "alert warning", "tien do": "progress", "anh": "image", "truot": "slider carousel", "keo": "drag resize", "doi kich thuoc": "resize",
  "gio": "time", "so": "number", "tien": "money", "danh dau": "checkbox", "bat tat": "switch toggle", "nguoi dung": "user avatar", "dieu huong": "navigation menu",
  "thanh ben": "sidebar side panel", "dau trang": "header", "the": "card", "nhan": "badge label", "tro ly": "assistant chat ai", "tro chuyen": "chat", "cong cu": "tool",
  "ke hoach": "plan task", "buoc": "step task", "nguon": "source citation", "trich dan": "citation", "dong lenh": "terminal command", "ngu canh": "context", "bieu mau": "form field",
  "truong": "field input", "danh sach": "list item", "cay": "tree", "phim tat": "shortcut hotkey", "lenh": "command", "sao chep": "copy", "chu giai": "tooltip", "goi y": "suggestion",
  "suy luan": "reasoning", "suy nghi": "thinking", "chu de": "theme", "toi": "dark", "sang": "light", "van ban dai": "prose typography", "chu": "typography text",
  "phan cach": "separator", "phim": "kbd key", "duong dan": "breadcrumb", "the tab": "tabs", "mo rong": "collapsible accordion", "thu gon": "collapsible", "tai khoan": "user",
  "cai dat": "settings", "tong quan": "dashboard kpi", "chi so": "kpi metric", "don hang": "order table",
}).sort((a, b) => b[0].length - a[0].length);
const STOP = new Set("co va cho cua mot cac nhung de khi voi la trong tren duoc nay thi o can muon hien thi lam a an the and or with for to of in on is my i want need show use how what which".split(" "));

const tokens = (s) => normalize(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
const wordsOf = new Map();
function words(d) {
  if (!wordsOf.has(d.id)) {
    const set = (t) => new Set(tokens(t));
    wordsOf.set(d.id, [
      [set(`${d.id} ${d.title} ${d.components.join(" ")} ${d.components.map((c) => c.replace(/([a-z])([A-Z])/g, "$1 $2")).join(" ")}`), 6],
      [set((d.when ?? []).join(" ")), 3],
      [set(`${d.description} ${(d.instead ?? []).map((r) => r.use).join(" ")}`), 2],
      [set([...(d.a11y ?? []), ...(d.notes ?? [])].join(" ")), 1],
    ]);
  }
  return wordsOf.get(d.id);
}
// a term matches a word exactly, or as a prefix when it is long enough ("sort" → "sorts", "sorting")
const matches = (set, term) => set.has(term) || (term.length >= 4 && [...set].some((w) => w.startsWith(term)));

/** Query → groups of alternative terms: each Vietnamese phrase becomes its English words, the rest stay as they are. */
function terms(query) {
  let q = ` ${normalize(query).replace(/[^a-z0-9]+/g, " ")} `;
  const groups = [];
  for (const [vi, en] of VI)
    if (q.includes(` ${vi} `)) {
      groups.push(en.split(" "));
      q = q.replace(` ${vi} `, " ");
    }
  for (const w of tokens(q)) groups.push([w]);
  return groups;
}

/**
 * Rank docs for a need written in words ("bảng có sắp xếp", "pick a date range", "agent asks before sending").
 * Each term weighs by how rare it is across docs (IDF) and by the field it hits: names > when to use > description >
 * notes. A match on another doc's "instead" row (“need X → use Y”) also points to Y, with that row as the reason.
 */
export function search(query, limit = 8) {
  const groups = terms(query);
  if (!groups.length) return [];
  const all = docs();
  const idf = (term) => Math.log(1 + all.length / (1 + all.filter((d) => words(d).some(([set]) => matches(set, term))).length));
  const score = new Map();
  const why = new Map();
  for (const group of groups) {
    const w = Math.max(...group.map(idf));
    for (const d of all) {
      const best = Math.max(0, ...words(d).filter(([set]) => group.some((t) => matches(set, t))).map(([, f]) => f));
      if (best) score.set(d.id, (score.get(d.id) ?? 0) + best * w);
    }
  }
  for (const d of all)
    for (const row of d.instead ?? []) {
      const need = new Set(tokens(row.need));
      const h = groups.filter((g) => g.some((t) => matches(need, t))).length;
      if (h < Math.min(2, groups.length)) continue;
      const target = findDoc(String(row.use).match(/[A-Z]\w+/)?.[0] ?? row.use);
      if (!target || target.id === d.id) continue;
      score.set(target.id, (score.get(target.id) ?? 0) + h * 4);
      if (!why.has(target.id)) why.set(target.id, `${d.title}: for “${row.need}” use ${row.use}`);
    }
  const top = Math.max(...score.values(), 0);
  return [...score.entries()]
    .filter(([, s]) => s >= top * 0.25)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, s]) => {
      const doc = all.find((d) => d.id === id);
      return { id, title: doc.title, group: doc.group, components: doc.components, when: doc.when?.[0] ?? doc.description, score: Math.round(s * 10) / 10, ...(why.has(id) ? { why: why.get(id) } : {}) };
    });
}

/** The agent page of a doc (markdown: when, instead, import, examples, API, accessibility). */
export function docMarkdown(id) {
  const file = join(root, "docs/components", `${id}.md`);
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

/** The examples of a doc, with their code. */
export function examples(id) {
  const d = docs().find((x) => x.id === id);
  if (!d) return [];
  return d.examples.map((e) => ({ file: e.file, title: e.title, description: e.description, path: `examples/${id}/${e.file}.tsx`, code: readFileSync(join(root, "examples", id, `${e.file}.tsx`), "utf8") }));
}

/** Props of a component from components.json (+ the doc page with the full API table). */
export function component(name) {
  const m = manifest();
  const all = [...m.components, ...m.hooks, ...m.functions];
  const n = normalize(name);
  return all.find((c) => normalize(c.name) === n) ?? null;
}

export const blocks = () => docs().filter((d) => d.group === "Blocks");

export function groups() {
  const out = new Map();
  for (const d of docs()) out.set(d.group, [...(out.get(d.group) ?? []), d]);
  return out;
}

/** Folder names in examples/ (sanity check for the tests). */
export const exampleDirs = () => readdirSync(join(root, "examples"), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

/**
 * The brand kit of the app in `cwd` (semi-lint.json "brand" → node_modules/<brand>/dist/brand.json + BRAND.md), so an
 * agent asks "how does this brand write an error" instead of guessing. topic: all | voice | color | logo | brief | tokens.
 */
export function brand(topic = "all", cwd = process.cwd()) {
  let dir = cwd;
  while (!existsSync(join(dir, "semi-lint.json")) && dirname(dir) !== dir) dir = dirname(dir);
  const cfgPath = join(dir, "semi-lint.json");
  const pkg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")).brand : null;
  if (!pkg) return { error: "This app has no brand kit (no \"brand\" in semi-lint.json): it uses Semi's own colours and fonts. Brands are made with /semi-brand in their own repo." };
  const kit = join(dir, "node_modules", ...pkg.split("/"));
  if (!existsSync(join(kit, "dist", "brand.json"))) return { error: `Brand kit ${pkg} is not installed (node_modules/${pkg}/dist/brand.json missing). Run the package manager install.` };
  const b = JSON.parse(readFileSync(join(kit, "dist", "brand.json"), "utf8"));
  const g = b.guide ?? {};
  const head = { name: b.name, package: b.package, styles: b.styles, fonts: b.fonts.map((f) => f.family) };
  switch (topic) {
    case "voice":
      return { ...head, voice: g.voice ?? null };
    case "color":
      return { ...head, color: g.color ?? null, themes: b.themes, fidelity: b.fidelity };
    case "logo":
      return { ...head, logo: g.logo ? { ...g.logo, import: Object.fromEntries(["full", "fullDark", "mark"].filter((k) => g.logo[`${k}Dist`]).map((k) => [k, `${pkg}/${g.logo[`${k}Dist`]}`])) } : null };
    case "brief":
      return { ...head, brief: g.brief ?? null, imagery: g.imagery ?? null };
    case "signature":
      return {
        ...head,
        signature: g.signature ?? null,
        use: "Density, title weight and figure font apply through tokens (padding, font-title, font-figure): never override them. Motif: <BrandPattern> in heroes, empty states, covers. Big numbers: <BrandFigure> or <KpiCard featured>. Avoid the generic AI look (DESIGN_SYSTEM.md §19).",
      };
    case "tokens":
      return { ...head, primary: b.primary, secondary: b.secondary ?? null, themes: b.themes };
    default: {
      const md = join(kit, "BRAND.md");
      return { ...head, markdown: existsSync(md) ? readFileSync(md, "utf8") : null };
    }
  }
}
