"use client";

// Long-form text (help articles, release notes, policies, AI answers rendered by Markdown): headings, paragraphs,
// lists, links, quotes, inline code and rules styled from the type scale, on the theme's text tokens.
import React from "react";
import { cn } from "../styles/utils";

export function Prose({ className, children }: { className?: string; /** Plain HTML elements (h2, h3, p, ul, ol, a, blockquote, code, hr) or Markdown. */ children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-prose text-lead leading-relaxed text-body",
        "[&>*+*]:mt-4 [&_h2]:text-section [&_h2]:font-medium [&_h2]:text-strong [&_h2]:mt-8 [&_h3]:text-lead [&_h3]:font-medium [&_h3]:text-strong [&_h3]:mt-6",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li+li]:mt-1.5 [&_strong]:font-semibold [&_strong]:text-strong",
        "[&_a]:text-strong [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-strong",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-line-hover [&_blockquote]:pl-4 [&_blockquote]:text-muted",
        "[&_code]:rounded-chip [&_code]:border [&_code]:border-line [&_code]:bg-field [&_code]:px-1 [&_code]:text-ui [&_hr]:border-divider",
        className,
      )}
    >
      {children}
    </div>
  );
}
