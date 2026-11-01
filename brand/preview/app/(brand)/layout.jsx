"use client";

// Brand book frame (Thương hiệu, Ứng dụng): a plain top bar like a brand site, no component sidebar. The UI kit and
// component pages keep the Semi docs shell ((kit)/layout.jsx).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle, useTheme } from "@semi/ui";
import { FOCUS_RING } from "@semi/ui/styles";
import brand from "../brand.json";
import { StyleSwitch, Wordmark } from "../parts";

const TABS = [
  { href: "/", label: "Thương hiệu" },
  { href: "/apps/", label: "Ứng dụng" },
  { href: "/kit/", label: "UI kit" },
];

export default function BrandLayout({ children }) {
  const { resolvedTheme } = useTheme();
  const path = usePathname();
  const active = (href) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-canvas border-b border-line">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/" className={`flex items-center gap-2 rounded-control ${FOCUS_RING}`}>
            <Wordmark theme={resolvedTheme} />
          </Link>
          <nav aria-label="Brand book" className="order-last w-full sm:order-none sm:w-auto flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active(t.href) ? "page" : undefined}
                className={`inline-flex items-center h-9 px-3 rounded-control text-ui font-medium whitespace-nowrap transition ${FOCUS_RING} ${
                  active(t.href) ? "bg-accent-subtle text-accent-fg" : "text-muted hover:text-contrast hover:bg-raised"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <StyleSwitch />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="@container flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-14">{children}</main>
      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3 text-caption text-muted tabular-nums">
          <span>
            {brand.package} · @semi/ui {brand.semiVersion}
          </span>
          <span className="md:hidden ml-auto">
            <StyleSwitch />
          </span>
        </div>
      </footer>
    </div>
  );
}
