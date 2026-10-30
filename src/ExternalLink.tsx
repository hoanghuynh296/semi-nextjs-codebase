"use client";

// Links to other sites (docs, shops): always a new tab with rel="noopener noreferrer" (docs/DESIGN_SYSTEM.md §14).
// Apps embedded in a native WebView can intercept the click with `onClick` (call e.preventDefault() and open the URL
// outside) — the design system itself has no host-app dependency.
import React from "react";

export type ExternalLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> & { href: string };

export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
