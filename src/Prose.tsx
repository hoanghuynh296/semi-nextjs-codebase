"use client";

// Long-form text (help articles, release notes, policies, AI answers rendered by Markdown): headings, paragraphs,
// lists, links, quotes, inline code and rules styled from the type scale, on the theme's text tokens.
import React from "react";
import { cn } from "../styles/utils";

export function Prose({ className, children }: { className?: string; /** Plain HTML elements (h2, h3, p, ul, ol, a, blockquote, code, hr) or Markdown. */ children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-prose text-ui-lg leading-relaxed text-body",
        "[&>*+*]:mt-4 [&_h2]:text-heading-sm [&_h2]:font-semibold [&_h2]:text-contrast [&_h2]:mt-8 [&_h3]:text-title-lg [&_h3]:font-semibold [&_h3]:text-contrast [&_h3]:mt-6",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li+li]:mt-1.5 [&_strong]:font-semibold [&_strong]:text-contrast",
        "[&_a]:text-accent-fg [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-contrast",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-line-hover [&_blockquote]:pl-4 [&_blockquote]:text-muted",
        "[&_code]:rounded-chip [&_code]:border [&_code]:border-line [&_code]:bg-field [&_code]:px-1 [&_code]:text-label [&_hr]:border-divider",
        className,
      )}
    >
      {children}
    </div>
  );
}
