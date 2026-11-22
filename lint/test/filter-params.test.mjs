// Filter state in the URL (#99): search params in, typed filter state out, and back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { activeFilterCount, clearFilters, readFilters, readFilterValues, toQueryString, writeFilters } from "../../src/filterParams.ts";

const SPECS = [
  { key: "status", label: "Trạng thái", options: [{ value: "new", label: "Mới" }, { value: "quoting", label: "Báo giá" }, { value: "won", label: "Chốt" }] },
  { key: "country", label: "Quốc gia", options: [{ value: "DE", label: "Đức" }, { value: "AE", label: "UAE" }] },
  { key: "big", label: "Từ 100 tấn", kind: "switch" },
  { key: "tag", label: "Nhãn" }, // options load later: every value is kept
];

test("reads typed state from params, a string or a query string with ?", () => {
  const want = { status: ["new", "quoting"], country: [], big: ["1"], tag: ["a, b", "ü"] };
  const qs = "f.status=quoting&f.status=new&f.big=1&f.tag=a%2C+b&f.tag=%C3%BC&q=ti%C3%AAu";
  assert.deepEqual(readFilterValues(qs, SPECS), want);
  assert.deepEqual(readFilterValues(`?${qs}`, SPECS), want);
  assert.deepEqual(readFilterValues(new URLSearchParams(qs), SPECS), want);
});

test("drops unknown values, duplicates and empty ones; a switch is on only with 1", () => {
  const v = readFilterValues("f.status=lost&f.status=won&f.status=won&f.status=&f.big=yes&f.tag=x&f.tag=x", SPECS);
  assert.deepEqual(v.status, ["won"]);
  assert.deepEqual(v.big, []);
  assert.deepEqual(v.tag, ["x"]);
});

test("round-trips: write then read gives the same state, in the options' order", () => {
  const state = { status: ["won", "new"], country: ["AE"], big: ["1"], tag: ["giao gấp", "a&b=c"] };
  const params = writeFilters("", state, SPECS);
  assert.deepEqual(readFilterValues(params, SPECS), { status: ["new", "won"], country: ["AE"], big: ["1"], tag: ["giao gấp", "a&b=c"] });
  // and through a URL string, as history.pushState / a shared link would carry it
  const url = new URL(`https://x.test/list${toQueryString(params)}`);
  assert.deepEqual(readFilterValues(url.search, SPECS), readFilterValues(params, SPECS));
});

test("writing one filter keeps the others and every non-filter param", () => {
  const next = writeFilters("q=ti%C3%AAu&sort=volume&f.status=new&f.country=DE", { status: ["quoting"] }, SPECS);
  assert.equal(next.get("q"), "tiêu");
  assert.equal(next.get("sort"), "volume");
  assert.deepEqual(next.getAll("f.country"), ["DE"]);
  assert.deepEqual(next.getAll("f.status"), ["quoting"]);
  // an empty list removes the param
  assert.equal(writeFilters(next, { status: [] }, SPECS).has("f.status"), false);
});

test("clear removes every filter param and nothing else; readFilters and the count", () => {
  const cleared = clearFilters("q=a&f.status=new&f.big=1&page=2", SPECS);
  assert.equal(cleared.toString(), "q=a&page=2");
  const filters = readFilters("f.status=new&f.big=1", SPECS);
  assert.equal(filters.length, SPECS.length);
  assert.equal(filters[0].label, "Trạng thái");
  assert.equal(activeFilterCount(filters), 2);
  assert.equal(toQueryString(new URLSearchParams()), "");
});

test("a custom prefix", () => {
  const p = writeFilters("", { status: ["new"] }, SPECS, "filter_");
  assert.equal(p.toString(), "filter_status=new");
  assert.deepEqual(readFilterValues(p, SPECS, "filter_").status, ["new"]);
  assert.deepEqual(readFilterValues(p, SPECS).status, []);
});
