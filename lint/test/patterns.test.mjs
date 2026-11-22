// node --test lint/test — the lint rules of the #94 patterns (#107, C-031 / C-032): five warnings (no-spinner-in-list,
// filter-chip-wrap, raw-pill-button, detail-overlay-url, overline-place) and one hard rule (card-hover-actions-touch).
// Each rule: what it must catch (fail fixtures) and the Semi way of writing the same thing (pass fixtures).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { patternHits, scan, tagHardHits, WARN } from "../semi-lint.mjs";

const rules = (code) => [...new Set(patternHits(code).map(([r]) => r))].sort();
const hits = (code, rule) => patternHits(code).filter(([r]) => r === rule).length;

test("no-spinner-in-list: a Spinner or loading text in a list, as the other branch of a list or an early return warns", () => {
  const FAIL = [
    `<ul>\n  {loading && <Spinner />}\n  {rows.map((r) => <li key={r.id}>{r.name}</li>)}\n</ul>`,
    `<div className="grid grid-cols-3 gap-3">\n  {loading ? <Spinner /> : null}\n</div>`,
    `<div className="divide-y divide-divider">{busy && <p>Đang tải…</p>}</div>`,
    `{loading ? <Spinner className="w-5 h-5" /> : rows.map((r) => <Row key={r.id} r={r} />)}`,
    `{loading ? (\n  <div className="flex justify-center py-8">\n    <Spinner />\n  </div>\n) : (\n  <ul>{rows.map((r) => <li key={r.id} />)}</ul>\n)}`,
    `function L() {\n  if (isLoading) return <div className="py-8"><Spinner /></div>;\n  return <ul>{rows.map((r) => <li key={r.id} />)}</ul>;\n}`,
    `<DataTable rows={rows} columns={cols} empty={<Spinner />} />`,
    `<div role="list">\n  <span>Loading...</span>\n</div>`,
    `<ul>\n  {loading && <li><span>Loading…</span></li>}\n</ul>`,
    `<div className="divide-y divide-divider">\n  {loading && <div className="w-5 h-5 border-2 rounded-full animate-spin" />}\n</div>`,
    `{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : items.map((i) => <Row key={i.id} />)}`,
  ];
  for (const code of FAIL) assert.deepEqual(rules(code), ["no-spinner-in-list"], code);
  const PASS = [
    `<DataTable rows={rows} columns={cols} loading={loading} />`,
    `{loading ? <SkeletonRows count={6} /> : rows.map((r) => <Row key={r.id} r={r} />)}`,
    `<ul>{rows.map((r) => (\n  <li key={r.id}>\n    <Button loading={r.busy}>Lưu</Button>\n    <button type="button" className="h-8">{r.saving ? <Spinner /> : "Gửi"}</button>\n  </li>\n))}</ul>`,
    `<form>{saving && <Spinner />}<Field label="Tên"><Input /></Field></form>`,
    `{loading ? <Spinner /> : <p>{total} kết quả</p>}`,
    `function P() {\n  if (loading) return <PageSkeleton shape="list" />;\n  return <ul>{rows.map((r) => <li key={r.id} />)}</ul>;\n}`,
    `<div className="flex gap-2"><Spinner label="Đang đồng bộ" /></div>`,
    `<ul>{rows.map((r) => <li key={r.id}><Icon name="refresh" className={cn("w-4 h-4", r.syncing && "animate-spin")} /></li>)}</ul>`,
  ];
  for (const code of PASS) assert.deepEqual(rules(code), [], code);
  assert.equal(hits(`<td>\n  {busy ? (\n    <Loader2\n      size={14}\n      className="animate-spin"\n    />\n  ) : null}\n</td>`.replace(/^/, "<tbody><tr>") + "</tr></tbody>", "no-spinner-in-list"), 1, "a spinning Loader2 is one hit");
});

test("filter-chip-wrap: hand-made clickable chips in a flex-wrap warn; FilterChipRow, tags and Pills do not", () => {
  const FAIL = [
    `<div className="flex flex-wrap gap-2">\n  {STATUSES.map((s) => (\n    <button key={s} onClick={() => setFilter(s)} className={cn("h-8 px-3 rounded-full", active === s ? "bg-inverted" : "bg-tint")}>{s}</button>\n  ))}\n</div>`,
    `<div className="flex flex-wrap gap-1.5">\n  <Chip selected={a} onClick={() => setFilter("open")}>Đang mở</Chip>\n  <Chip selected={b} onClick={() => setFilter("closed")}>Đã đóng</Chip>\n</div>`,
    `<div className="flex flex-wrap gap-2">{filters.map((f) => <Chip key={f.id} onClick={() => pick(f.id)}>{f.label}</Chip>)}</div>`,
    `<div className="flex flex-wrap gap-2" aria-label="Lọc">\n  <Chip active={a} onClick={() => setA(!a)}>Đang mở</Chip>\n  <Chip active={b} onClick={() => setB(!b)}>Đã đóng</Chip>\n</div>`,
    `<div className="flex flex-wrap items-center gap-2">\n  {active.map((c) => (\n    <Chip key={c} active onClick={() => remove(c)} title={\`Bỏ lọc \${c}\`}>{c}</Chip>\n  ))}\n</div>`,
  ];
  for (const code of FAIL) assert.deepEqual(rules(code), ["filter-chip-wrap"], code);
  const PASS = [
    `<FilterChipRow filters={defs} onChange={set} />`,
    `<div className="flex flex-wrap gap-1">{tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>`,
    `<div className="flex flex-wrap gap-2"><Button>Huỷ</Button><Button variant="primary">Lưu</Button></div>`,
    `<div className="flex flex-nowrap gap-2">{filters.map((f) => <Chip key={f.id} onClick={() => pick(f.id)}>{f.label}</Chip>)}</div>`,
    `<Pills value={v} onChange={setV} options={OPTS} />`,
    `<div className="flex flex-wrap gap-1.5">{series.map((s) => <button key={s.key} onClick={() => highlight(s.key)} className={cn("h-7 px-2 rounded-full", isActive && "bg-tint")}>{s.label}</button>)}</div>`,
    `<div className="flex flex-wrap gap-2">{COLOURS.map((c) => <button key={c} aria-pressed={c === pick} onClick={() => setPick(c)} className="h-8 px-3 rounded-full bg-tint">{c}</button>)}</div>`,
    `<div className="flex flex-wrap gap-1">\n  {brands.map((b) => (\n    <button key={b} aria-pressed={on(b)} onClick={() => onChange(on(b) ? sel.filter((x) => x !== b) : [...sel, b])} className="h-7 px-2 rounded-full bg-tint">{b}</button>\n  ))}\n</div>`,
  ];
  for (const code of PASS) assert.deepEqual(rules(code), [], code);
});

test("raw-pill-button: a round, filled, square clickable button warns; Button shape=round, avatars and dots do not", () => {
  const FAIL = [
    `<button type="button" aria-label="Đóng" className="w-9 h-9 rounded-full bg-tint hover:bg-tint-hover flex items-center justify-center"><Icon name="close" /></button>`,
    `const ROUND = "size-8 rounded-full bg-panel-4/90 hover:bg-panel-4 cursor-pointer";`,
    `<Link href="/new" className="w-10 h-10 rounded-full bg-field flex items-center justify-center"><Icon name="plus" /></Link>`,
    `<button onClick={next} className="absolute right-2 w-8 h-8 rounded-full bg-black/40 text-white"><Icon name="chevronRight" /></button>`,
    `<Button iconOnly icon="more" aria-label="Thêm" className="rounded-full" />`,
    `      <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center"><Icon name="close" /></button>`,
    `<Button\n  iconOnly\n  icon="close"\n  onClick={() => close()}\n  aria-label="Đóng"\n  className="rounded-full"\n/>`,
  ];
  for (const code of FAIL) assert.deepEqual(rules(code), ["raw-pill-button"], code);
  const PASS = [
    `<Button iconOnly shape="round" icon="close" aria-label="Đóng" />`,
    `<div className="w-8 h-8 rounded-full bg-panel flex items-center justify-center">{initials}</div>`,
    `<span className="w-2 h-2 rounded-full bg-success-fg" />`,
    `<button type="button" className="h-8 px-3 rounded-full bg-tint hover:bg-tint-hover">Tất cả</button>`,
    `<Avatar name="An" className="w-8 h-8 rounded-full bg-panel hover:bg-raised" />`,
    `<button className="w-9 h-9 rounded-control bg-tint hover:bg-tint-hover"><Icon name="close" /></button>`,
    `<button className="relative aspect-video" onClick={watch}>\n  <span className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><Icon name="play" /></span>\n</button>`,
  ];
  for (const code of PASS) assert.deepEqual(rules(code), [], code);
  assert.equal(hits(`<button className="w-9 h-9 rounded-full bg-tint hover:bg-tint-hover" onClick={a} /><button className="w-9 h-9 rounded-full bg-tint hover:bg-tint-hover" onClick={b} />`, "raw-pill-button"), 1, "one hit per line");
});

test("detail-overlay-url: a DetailOverlay on local state warns; useDetailParam, a search param or a pass-through prop do not", () => {
  const FAIL = [
    `const [sel, setSel] = useState(null);\n<DetailOverlay open={sel !== null} onClose={() => setSel(null)} title="Đơn hàng" />`,
    `<DetailOverlay\n  open={isOpen}\n  onClose={close}\n  title={t}\n>\n  <p />\n</DetailOverlay>`,
  ];
  for (const code of FAIL) assert.deepEqual(rules(code), ["detail-overlay-url"], code);
  const PASS = [
    `const { openId, close } = useDetailParam();\n<DetailOverlay open={openId !== null} onClose={close} title="Đơn hàng" />`,
    `const sp = useSearchParams();\n<DetailOverlay open={sp.get("open") !== null} onClose={close} title="x" />`,
    `export function OrderOverlay({ open, onClose }: Props) {\n  return <DetailOverlay open={open} onClose={onClose} title="x" />;\n}`,
    `function O(props) {\n  return <DetailOverlay open={props.open} onClose={props.onClose} title="x" />;\n}`,
    `<DetailOverlay {...overlay} title="x" />`,
  ];
  for (const code of PASS) assert.deepEqual(rules(code), [], code);
});

test("overline-place (C-032): text-overline on a section label passes; on a button, link, field label, title, badge or a sentence warns", () => {
  const FAIL = [
    `<button className="text-overline text-muted">Lưu</button>`,
    `<Link href="/x" className="text-overline">Xem tất cả</Link>`,
    `<label htmlFor="n" className="text-overline">Tên</label>`,
    `<h1 className="text-overline">Đơn hàng</h1>`,
    `<Badge className="text-overline">Mới</Badge>`,
    `<p className="text-overline text-muted">Đây là một câu mô tả dài về tính năng mới của sản phẩm</p>`,
    `export function T() {\n  return (\n    <table>\n      <tbody>\n        <tr>\n          <td className="px-2 text-overline">Tổng</td>\n        </tr>\n      </tbody>\n    </table>\n  );\n}`,
    `    <div className="flex">\n      <a href="/all" className="text-overline">Xem tất cả</a>\n    </div>`,
    `<div onClick={() => open()} className="text-overline">Mở</div>`,
    `<Card className="p-card">\n  <Text className="text-overline">Mới</Text>\n</Card>`,
    `  <div role="button" className="text-overline" aria-pressed={on}>Ghim</div>`,
  ];
  for (const code of FAIL) assert.deepEqual(rules(code), ["overline-place"], code);
  const PASS = [
    `<div className="px-2.5 pt-1 text-overline text-muted">Đã ghim</div>`,
    `<h2 className="px-2 pb-1 text-overline text-muted">{col.title}</h2>`,
    `<div role="presentation" className="px-3 pt-2 pb-1 text-overline text-muted">Thao tác nhanh</div>`,
    `<span className="text-overline text-muted">Tài liệu 0/8</span>`,
    `const LABEL = "text-overline text-muted";`,
    `export function Panel() {\n  return (\n    <aside>\n      <section>\n        <div className="px-3 pt-2 text-overline text-muted">\n          Tài liệu tham khảo\n        </div>\n      </section>\n    </aside>\n  );\n}`,
    `        <div className="flex items-center justify-between">\n          <span className={cn("text-overline", "text-muted")}>Bước 1/3</span>\n        </div>`,
  ];
  for (const code of PASS) assert.deepEqual(rules(code), [], code);
});

test("card-hover-actions-touch: CardActions without a label is a hard error; with a label or a spread it is not", () => {
  const rule = (code) => tagHardHits(code).map(([r]) => r);
  assert.deepEqual(rule(`<CardActions actions={acts} menu={more} />`), ["card-hover-actions-touch"]);
  assert.deepEqual(tagHardHits(`<div>\n  <CardActions\n    actions={acts}\n  />\n</div>`).map(([r, l]) => [r, l]), [["card-hover-actions-touch", 2]]);
  assert.deepEqual(rule(`<CardActions label={\`Thao tác với \${s.name}\`} actions={acts} />`), []);
  assert.deepEqual(rule(`<CardActions\n  actions={acts}\n  label="Thao tác"\n/>`), []);
  assert.deepEqual(rule(`<CardActions {...p} />`), []);
  // label last, after attributes whose arrows (=>) hold a ">": the tag runs to its real end
  assert.deepEqual(rule(`<CardActions actions={[{ icon: "edit", label: "Sửa", onClick: () => edit(id) }]} label="Thao tác với A" />`), []);
  assert.deepEqual(rule(`<CardActions\n  actions={[{ icon: "pin", label: "Ghim", onClick: () => pin(s.id) }]}\n  menu={[{ label: "Xoá", danger: true, onSelect: () => del(s.id) }]}\n  label={\`Thao tác với \${s.name}\`}\n/>`), []);
  // a label inside an action object is not the menu's label
  assert.deepEqual(rule(`<CardActions actions={[{ icon: "edit", label: "Sửa", onClick: () => edit(id) }]} />`), ["card-hover-actions-touch"]);
  assert.deepEqual(rule(`<CardActions\n  menu={[{ label: "Xoá", onSelect: () => del() }]}\n/>`), ["card-hover-actions-touch"]);
  // an apostrophe in JSX text inside an attribute is not a quote
  assert.deepEqual(rule(`<CardActions menu={more} trigger={<span>Don't</span>} label="Thao tác" />`), []);
  assert.deepEqual(rule(`<CardActions trigger={<span>Don't</span>} actions={acts} />`), ["card-hover-actions-touch"]);
  assert.deepEqual(rule(`<CardActions label={isOpen ? 'Đóng' : 'Mở'} actions={acts} />`), [], "a JS string after ? and : is still a string");
  assert.deepEqual(rule(`// <CardActions actions={a} />\nconst a = 1;`), []);
});

test("scan(): the five pattern rules are warnings (never in the baseline), card-hover-actions-touch is hard; skip / disable work", () => {
  assert.deepEqual(
    WARN.map(([id]) => id).slice(-5),
    ["no-spinner-in-list", "filter-chip-wrap", "raw-pill-button", "detail-overlay-url", "overline-place"],
  );
  const dir = mkdtempSync(join(tmpdir(), "semi-patterns-"));
  const file = join(dir, "page.tsx");
  writeFileSync(
    file,
    `export default function P() {\n  const [s, setS] = useState(null);\n  return (\n    <>\n      <CardActions actions={[]} />\n      <DetailOverlay open={s !== null} onClose={() => setS(null)} title="x" />\n    </>\n  );\n}\n`,
  );
  const r = scan([file], {}, dir);
  assert.deepEqual(r.hard.map((h) => [h.rule, h.line]), [["card-hover-actions-touch", 5]]);
  assert.deepEqual(r.warnings.map((w) => [w.rule, w.line]), [["detail-overlay-url", 6]]);
  assert.ok(r.warnings.every((w) => w.message));
  assert.equal(Object.values(r.counts).flatMap((c) => Object.values(c)).length, 0, "nothing lands in the ratchet baseline");
  const off = scan([file], { disable: ["detail-overlay-url"], skip: { "card-hover-actions-touch": ["page.tsx"] } }, dir);
  assert.deepEqual([off.hard.length, off.warnings.length], [0, 0]);
  rmSync(dir, { recursive: true });
});

test("no false positives on the docs examples of the #94 components (and every other example)", () => {
  const root = new URL("../../examples/", import.meta.url);
  const found = [];
  for (const id of readdirSync(root)) {
    if (id.includes(".")) continue;
    for (const f of readdirSync(new URL(id + "/", root))) {
      if (!f.endsWith(".tsx")) continue;
      const src = readFileSync(new URL(`${id}/${f}`, root), "utf8");
      for (const [rule, line] of patternHits(src.split("\n").map((r) => (/^\s*(\/\/|\*|\/\*)/.test(r) ? "" : r)).join("\n"))) found.push(`${id}/${f}:${line} ${rule}`);
      for (const [rule, line] of tagHardHits(src)) found.push(`${id}/${f}:${line} ${rule}`);
    }
  }
  assert.deepEqual(found, []);
});
