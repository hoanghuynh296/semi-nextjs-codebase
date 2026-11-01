"use client";

import { useState } from "react";
import { SearchInput } from "@semi/ui";

export default function SearchInputBasic() {
  const [q, setQ] = useState("");
  return <SearchInput value={q} onChange={setQ} placeholder="Tìm máy in…" className="w-64" />;
}
