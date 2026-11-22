"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// What Next's own router sees (#100 review): useSearchParams after useFilterParams writes the URL, router.refresh(),
// and same-route navigations by Link / router.push that the hook must follow. Inside the page's Suspense, as an app
// that reads search params must put it.
export function Probe() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  return (
    <div>
      <output data-testid="next-status">{params.getAll("f.status").join(",") || "none"}</output>
      <button type="button" onClick={() => router.refresh()}>
        Refresh
      </button>
      <Link href={`${path}?f.status=done`}>Done only</Link>
      <button type="button" onClick={() => router.push(`${path}?f.status=new&f.status=done`)}>
        Push both
      </button>
    </div>
  );
}
