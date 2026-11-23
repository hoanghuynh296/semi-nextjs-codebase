"use client";

import Link from "next/link";
import { SearchPill } from "../../../../src/SearchPill";
import { useFilterParams } from "../../../../src/FilterChipRow";

// A SearchPill in a layout that stays mounted across its routes (#128 review): text typed before a Link to the other
// route is dropped, not written onto the new route's URL when the (long, for the test) debounce runs out.
export function LayoutSearch() {
  const f = useFilterParams([]);
  return (
    <>
      <SearchPill value={f.params.get("q") ?? ""} onChange={(v) => f.setParams({ q: v }, "replace")} label="Search everything" debounce={2000} />
      <nav aria-label="Pages">
        <Link href="/layout-search/a">Page A</Link> <Link href="/layout-search/b">Page B</Link>
      </nav>
    </>
  );
}
