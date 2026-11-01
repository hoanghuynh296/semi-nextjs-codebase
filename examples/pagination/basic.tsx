"use client";

import { useState } from "react";
import { Pagination } from "@semi/ui";

export default function PaginationBasic() {
  const [page, setPage] = useState(3);
  return <Pagination page={page} pages={12} onChange={setPage} />;
}
